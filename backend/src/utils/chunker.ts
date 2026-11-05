import { createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { meetingTrace, traceError } from "./meetingTrace";
import { buildTranscriptChunks, type TranscriptRow } from "./transcriptChunks";
import { embedMeetingText, TaskType } from "./meetingEmbeddings";

const prisma = new PrismaClient();
const BATCH_SIZE = 5;
const segmentSelect = {
    id: true, sessionId: true, transcriptionJobId: true, sequence: true,
    speakerId: true, speakerName: true, startedAt: true, endedAt: true, text: true,
} as const;
const segmentOrder = [
    { startedAt: "asc" }, { transcriptionJobId: "asc" }, { sequence: "asc" }, { id: "asc" },
] as const;
const fingerprint = (rows: TranscriptRow[]) => createHash("sha256").update(JSON.stringify(rows)).digest("hex");
class TranscriptChangedError extends Error {}

async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
    for (let i = 0; i < attempts; i++) {
        try { return await fn(); }
        catch (err) {
            if (i === attempts - 1) throw err;
            await new Promise(resolve => setTimeout(resolve, 500 * 2 ** i));
        }
    }
    throw new Error("Retry attempts exhausted");
}

export async function chunkTheTranscription(meetingId: string, db: PrismaClient = prisma) {
    try {
        for (let attempt = 0; attempt < 3; attempt++) {
            const rows = await db.transcriptSegment.findMany({
                where: { meetingId }, select: segmentSelect, orderBy: [...segmentOrder],
            });
            if (!rows.some(row => row.text.trim())) throw new Error(`No transcript segments found for meeting ${meetingId}`);
            const snapshot = fingerprint(rows);
            const chunks = buildTranscriptChunks(rows);
            meetingTrace("index.chunks_created", { meetingId, chunks: chunks.length, segments: rows.length });
            const embeddings: number[][] = [];
            for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
                const batch = chunks.slice(i, i + BATCH_SIZE);
                meetingTrace("index.embedding_batch_started", { meetingId, offset: i, count: batch.length });
                embeddings.push(...await Promise.all(batch.map(chunk => withRetry(() =>
                    embedMeetingText(chunk.content, TaskType.RETRIEVAL_DOCUMENT)))));
                meetingTrace("index.embedding_batch_finished", { meetingId, offset: i, count: batch.length });
            }
            try {
                await db.$transaction(async tx => {
                    // The worker takes the same lock when replacing canonical segments.
                    await tx.$queryRaw`SELECT id FROM "Meeting" WHERE id = ${meetingId} FOR UPDATE`;
                    const current = await tx.transcriptSegment.findMany({
                        where: { meetingId }, select: segmentSelect, orderBy: [...segmentOrder],
                    });
                    if (fingerprint(current) !== snapshot) throw new TranscriptChangedError("Transcript changed during indexing");
                    await tx.$executeRaw`DELETE FROM "TranscriptChunk" WHERE "meetingId" = ${meetingId}`;
                    // One insert keeps the atomic replacement short even for long meetings.
                    const records = chunks.map((chunk, i) => ({
                        content: chunk.content, segments: chunk.segments, embedding: `[${embeddings[i].join(",")}]`,
                    }));
                    await tx.$executeRaw`
                        INSERT INTO "TranscriptChunk" (id, content, "meetingId", embedding, segments)
                        SELECT gen_random_uuid(), item.content, ${meetingId}, item.embedding::vector, item.segments
                        FROM jsonb_to_recordset(${JSON.stringify(records)}::jsonb)
                        AS item(content text, embedding text, segments jsonb)
                    `;
                }, { timeout: 30_000 });
                meetingTrace("index.completed", { meetingId, chunks: chunks.length });
                return;
            } catch (error) {
                if (!(error instanceof TranscriptChangedError) || attempt === 2) throw error;
                meetingTrace("index.snapshot_changed", { meetingId, retry: attempt + 1 });
            }
        }
    } catch (error) {
        meetingTrace("index.failed", { meetingId, ...traceError(error) });
        throw error;
    }
}
