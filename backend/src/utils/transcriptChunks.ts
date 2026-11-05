import { getEncoding } from "js-tiktoken";
import { z } from "zod";

// Local estimates, not Gemini's exact tokenizer. No tokenizer network calls.
const tokenizer = getEncoding("cl100k_base");
export const estimateTokens = (text: string) => tokenizer.encode(text, [], []).length;
export const TARGET_CHUNK_TOKENS = 500;
export const MAX_OVERLAP_TOKENS = 120;
// Conservative UTF-8 ceiling below Gemini embedding-001's 2,048-token input limit,
// with room for provider overhead. This also bounds multilingual/long-word input.
export const MAX_EMBEDDING_BYTES = 1900;

export interface TranscriptRow {
    id: string;
    sessionId: string;
    transcriptionJobId: string;
    sequence: number;
    speakerId: string;
    speakerName: string | null;
    startedAt: Date;
    endedAt: Date;
    text: string;
}

export const chunkSegmentSchema = z.object({
    segmentId: z.string().min(1),
    transcriptionJobId: z.string().min(1),
    sequence: z.number().int().nonnegative(),
    partIndex: z.number().int().nonnegative(),
    partCount: z.number().int().positive(),
    sessionId: z.string().min(1),
    speakerId: z.string().min(1),
    speakerName: z.string().nullable(),
    startedAt: z.string().datetime(),
    endedAt: z.string().datetime(),
    startMs: z.number().int().nonnegative().safe(),
    endMs: z.number().int().nonnegative().safe(),
    text: z.string().min(1).max(MAX_EMBEDDING_BYTES),
}).strict().refine(s => s.partIndex < s.partCount && s.endMs >= s.startMs
    && Date.parse(s.endedAt) >= Date.parse(s.startedAt)
    && Date.parse(s.endedAt) - Date.parse(s.startedAt) === s.endMs - s.startMs);
export type ChunkSegment = z.infer<typeof chunkSegmentSchema>;
export interface TranscriptChunkData { content: string; segments: ChunkSegment[] }

export const embeddingText = (segments: ChunkSegment[]) => segments
    .map(s => `${s.speakerName || "Unknown speaker"}: ${s.text}`).join("\n");

function splitOversizedText(text: string, prefix: string): string[] {
    const capacity = MAX_EMBEDDING_BYTES - Buffer.byteLength(prefix, "utf8");
    if (capacity < 64) throw new Error("Speaker label exceeds embedding input budget");
    const parts: string[] = [];
    let rest = text.trim();
    while (Buffer.byteLength(rest, "utf8") > capacity) {
        let end = 0, bytes = 0;
        for (const character of rest) {
            const size = Buffer.byteLength(character, "utf8");
            if (bytes + size > capacity) break;
            bytes += size;
            end += character.length;
        }
        const prefixText = rest.slice(0, end);
        // Prefer a sentence boundary, then whitespace; code points are the last resort.
        const sentences = [...prefixText.matchAll(/[.!?。！？](?:\s+|$)/gu)];
        const sentence = sentences[sentences.length - 1];
        const words = [...prefixText.matchAll(/\s+/gu)];
        const word = words[words.length - 1];
        const sentenceEnd = sentence ? sentence.index! + sentence[0].length : 0;
        const boundary = sentenceEnd > end / 3 ? sentenceEnd : word?.index;
        if (boundary && boundary > end / 3) end = boundary;
        parts.push(rest.slice(0, end).trim());
        rest = rest.slice(end).trimStart();
    }
    if (rest) parts.push(rest);
    return parts;
}

export function buildTranscriptChunks(rows: TranscriptRow[]): TranscriptChunkData[] {
    const sorted = rows.filter(row => row.text.trim()).slice().sort((a, b) =>
        a.startedAt.getTime() - b.startedAt.getTime()
        || a.transcriptionJobId.localeCompare(b.transcriptionJobId)
        || a.sequence - b.sequence || a.id.localeCompare(b.id));
    if (!sorted.length) return [];
    const origin = sorted[0].startedAt.getTime();
    const segments = sorted.flatMap(row => {
        const parts = splitOversizedText(row.text, `${row.speakerName || "Unknown speaker"}: `);
        return parts.map((text, partIndex) => chunkSegmentSchema.parse({
            segmentId: row.id, transcriptionJobId: row.transcriptionJobId, sequence: row.sequence, sessionId: row.sessionId, speakerId: row.speakerId,
            speakerName: row.speakerName, startedAt: row.startedAt.toISOString(),
            endedAt: row.endedAt.toISOString(), startMs: row.startedAt.getTime() - origin,
            endMs: row.endedAt.getTime() - origin, text, partIndex, partCount: parts.length,
        }));
    });
    const chunks: TranscriptChunkData[] = [];
    let start = 0;
    while (start < segments.length) {
        let end = start;
        let content = "";
        while (end < segments.length) {
            const next = embeddingText(segments.slice(start, end + 1));
            if (Buffer.byteLength(next, "utf8") > MAX_EMBEDDING_BYTES) break;
            content = next;
            end++;
            if (estimateTokens(content) >= TARGET_CHUNK_TOKENS) break;
        }
        if (end === start) throw new Error("Transcript segment exceeds embedding input budget");
        chunks.push({ content, segments: segments.slice(start, end) });
        if (end === segments.length) break;
        let nextStart = end;
        // Never carry the entire previous chunk or crowd out the next new segment.
        while (nextStart > Math.max(start + 1, end - 2)) {
            const candidate = nextStart - 1;
            if (estimateTokens(embeddingText(segments.slice(candidate, end))) > MAX_OVERLAP_TOKENS
                || Buffer.byteLength(embeddingText(segments.slice(candidate, end + 1)), "utf8") > MAX_EMBEDDING_BYTES) break;
            nextStart = candidate;
        }
        start = nextStart;
    }
    return chunks;
}
