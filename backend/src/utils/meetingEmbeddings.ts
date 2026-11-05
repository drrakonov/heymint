import { GoogleGenerativeAI, TaskType, type EmbedContentRequest } from "@google/generative-ai";
import { MAX_EMBEDDING_BYTES } from "./transcriptChunks";

export { TaskType };
export async function embedMeetingText(text: string, taskType: TaskType): Promise<number[]> {
    if (taskType === TaskType.RETRIEVAL_DOCUMENT && Buffer.byteLength(text, "utf8") > MAX_EMBEDDING_BYTES) {
        throw new Error("Embedding document exceeds safe input budget");
    }
    if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is required for meeting embeddings");
    const model = new GoogleGenerativeAI(process.env.GEMINI_API_KEY).getGenerativeModel(
        { model: "gemini-embedding-001" }, { timeout: 15_000 },
    );
    const request: EmbedContentRequest & { outputDimensionality: number } = {
        content: { role: "user", parts: [{ text }] }, taskType, outputDimensionality: 768,
    };
    const result = await model.embedContent(request);
    const vector = result.embedding.values;
    if (vector.length !== 768 || !vector.every(Number.isFinite) || !vector.some(value => value !== 0)) {
        throw new Error("Invalid meeting embedding");
    }
    return vector;
}
