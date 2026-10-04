import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { PrismaClient } from "@prisma/client";
import { GoogleGenerativeAI, TaskType } from "@google/generative-ai"

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const EMBED_MODEL = "gemini-embedding-001"
const BATCH_SIZE = 50;

async function embedBatch(texts: string[]): Promise<number[][]> {
    const model = genAI.getGenerativeModel({ model: EMBED_MODEL })
    const results = await Promise.all(
        texts.map(text => model.embedContent({ 
            content: { role: "user", parts: [{ text }] }, 
            outputDimensionality: 768 
        } as any))
    );
    return results.map(res => res.embedding.values);
}


async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
    for(let i = 0; i < attempts; i++) {
        try {
            return await fn();
        }catch(err) {
            if (i >= attempts - 1) throw err;
            await new Promise((r) => setTimeout(r, 500 * 2 ** i));
        }
    }
    throw new Error("Retry attempts exhausted");
}



export async function chunkTheTranscription(meetingId: string) {
    try {
        const summaryRecord = await prisma.summary.findUnique({
            where: {
                meetingId
            },
            select: {
                transcription: true
            }
        })

        if(!summaryRecord?.transcription) {
            throw new Error(`No transcription found for meeting ${meetingId}`)
        }


        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000, // Target length of characters per chunk
            chunkOverlap: 50 // Number of characters shared between adjacent chunks
        })

        const chunks = await splitter.splitText(summaryRecord.transcription);
        const embeddings: number[][] = []

        for(let i = 0; i < chunks.length; i += BATCH_SIZE) {
            const batch = chunks.slice(i, i + BATCH_SIZE);
            embeddings.push(...(await withRetry(() => embedBatch(batch))))
        }
        
        try {
            await prisma.$transaction(async (tx) => {
                await tx.$executeRaw `DELETE FROM "TranscriptChunk" WHERE "meetingId" = ${meetingId}`;

                for(let i = 0; i < chunks.length; i++) {
                    const vector = `[${embeddings[i].join(",")}]`;
                    await tx.$executeRaw`
                        INSERT INTO "TranscriptChunk" (id, content, "meetingId", embedding)
                        VALUES (gen_random_uuid(), ${chunks[i]}, ${meetingId}, ${vector}::vector)
                    `;
                }
            })
        }catch(err) {
            console.error("Failed to store embeddings into vector database: ", err);
            throw new Error("Failed to store transcript embeddings")
        }

    }catch(err) {
        console.error(err);
        throw err
    } 
}
