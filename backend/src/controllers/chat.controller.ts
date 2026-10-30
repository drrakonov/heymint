import { GoogleGenerativeAI } from "@google/generative-ai";
import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import Groq from "groq-sdk";
import { getMeetingInsightAccess } from "../services/meetingInsightAccess.service";
import { meetingTrace, traceError } from "../utils/meetingTrace";
import {
    buildChatSources, candidateSegmentTexts, CHAT_RESPONSE_FORMAT, CHAT_SYSTEM_PROMPT,
    insufficientAnswer, isExtractionRequest, questionSchema, refusedAnswer,
    RetrievedChunk, validateChatAnswer,
} from "../services/meetingChatPolicy";

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY, timeout: 40_000, maxRetries: 0 });

async function embedQuestion(text: string): Promise<number[]> {
    const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" }, { timeout: 10_000 });
    const result = await model.embedContent({
        content: { role: "user", parts: [{ text }] }, outputDimensionality: 768,
    } as any);
    const vector = result.embedding.values;
    if (vector.length !== 768 || !vector.every(Number.isFinite)) throw new Error("Invalid embedding");
    return vector;
}

export const handleSummaryChat = async (req: Request, res: Response): Promise<any> => {
    const meetingCode = String(req.params.id || "");
    try {
        const userId = (req as any).user?.id as string | undefined;
        if (!userId) return res.status(401).json({ success: false, message: "Please sign in to use meeting chat." });
        const parsed = questionSchema.safeParse(req.body?.question);
        if (!meetingCode || !parsed.success) return res.status(400).json({ success: false, message: "Enter a question between 1 and 2,000 characters." });
        const question = parsed.data;

        meetingTrace("chat.requested", { meetingCode });
        const access = await getMeetingInsightAccess(prisma, meetingCode, userId);
        meetingTrace("chat.access_checked", { meetingCode, found: Boolean(access), allowed: access?.canAccess });
        if (!access) return res.status(404).json({ success: false, message: "Meeting not found" });
        if (!access.canAccess) return res.status(403).json({ success: false, message: "Only the host and past participants can access this meeting chat." });
        if (access.isExpired) return res.status(410).json({ success: false, status: "expired", message: "This meeting expired without starting. There are no meeting insights." });

        if (isExtractionRequest(question)) {
            meetingTrace("chat.request_refused", { meetingId: access.meeting.id, reason: "extraction_pattern" });
            return res.json({ success: true, status: "refused", answer: refusedAnswer, sources: [] });
        }

        const meetingId = access.meeting.id;
        const summary = await prisma.summary.findUnique({ where: { meetingId }, select: { content: true } });
        if (!summary) {
            const jobs = await prisma.transcriptionJob.findMany({ where: { meetingId }, select: { status: true } });
            if (jobs.length && jobs.every(job => job.status === "COMPLETED")) {
                return res.status(409).json({ success: false, status: "no_speech", message: "No speech was detected in this meeting." });
            }
        }

        meetingTrace("chat.embedding_started", { meetingId });
        const vectorString = `[${(await embedQuestion(question)).join(",")}]`;
        // Authorization precedes retrieval; the SQL scope is never chosen by the model.
        const chunks = await prisma.$queryRaw<RetrievedChunk[]>`
            SELECT id, content, 1 - (embedding <=> ${vectorString}::vector) AS similarity
            FROM "TranscriptChunk" WHERE "meetingId" = ${meetingId}
            ORDER BY embedding <=> ${vectorString}::vector LIMIT 5
        `;
        // Keep existing retrieval recall. A similarity cutoff needs calibration on real questions.
        const retrieved = chunks.filter(chunk => typeof chunk.content === "string" && chunk.content.trim());
        const candidateTexts = candidateSegmentTexts(retrieved);
        const [origin, segments] = candidateTexts.length ? await Promise.all([
            prisma.transcriptSegment.findFirst({ where: { meetingId }, orderBy: { startedAt: "asc" }, select: { startedAt: true } }),
            prisma.transcriptSegment.findMany({
                where: { meetingId, text: { in: candidateTexts } }, take: 120,
                orderBy: [{ startedAt: "asc" }, { sequence: "asc" }],
                select: { text: true, speakerId: true, speakerName: true, startedAt: true, endedAt: true },
            }),
        ]) : [null, []];
        const sources = buildChatSources(summary?.content, retrieved, segments, origin?.startedAt);
        meetingTrace("chat.context_loaded", { meetingId, chunks: retrieved.length, sources: sources.length, hasSummary: Boolean(summary) });
        if (!sources.length) return res.json({ success: true, status: "insufficient_context", answer: insufficientAnswer, sources: [] });

        meetingTrace("chat.answer_started", { meetingId });
        const response = await groq.chat.completions.create({
            model: "openai/gpt-oss-20b", temperature: 0.2,
            max_completion_tokens: 3000,
            reasoning_effort: "low",
            response_format: CHAT_RESPONSE_FORMAT,
            messages: [
                { role: "system", content: CHAT_SYSTEM_PROMPT },
                { role: "user", content: JSON.stringify({ type: "untrusted_meeting_sources", sources }) },
                { role: "user", content: JSON.stringify({ type: "meeting_question", question }) },
            ],
        });

        try {
            const choice = response.choices[0];
            if (!choice || choice.finish_reason !== "stop" || !choice.message.content) throw new Error("Incomplete chat response");
            const result = validateChatAnswer(choice.message.content, sources);
            meetingTrace("chat.answer_finished", { meetingId, status: result.status, citations: result.sources.length });
            return res.json({ success: true, ...result });
        } catch {
            // Never return raw model output or validation errors (which can contain source text).
            meetingTrace("chat.output_rejected", { meetingId });
            return res.status(502).json({ success: false, status: "invalid_response", message: "I couldn't produce a reliable answer. Please rephrase your question and try again." });
        }
    } catch (err) {
        meetingTrace("chat.failed", { meetingCode, ...traceError(err) });
        return res.status(503).json({ success: false, message: "Meeting chat is temporarily unavailable. Please try again shortly." });
    }
};
