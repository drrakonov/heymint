import { GoogleGenerativeAI } from "@google/generative-ai";
import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import Groq from "groq-sdk";
import { getMeetingInsightAccess } from "../services/meetingInsightAccess.service";

import { meetingTrace, traceError } from "../utils/meetingTrace";

const prisma = new PrismaClient()
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const EMBED_MODEL = "gemini-embedding-001"

async function getEmbbedText(text: string):Promise<number[]> {
    const model = genAI.getGenerativeModel({ model:EMBED_MODEL })
    const result = await model.embedContent({ 
        content: { role: "user", parts: [{ text }] }, 
        outputDimensionality: 768 
    } as any)
    return result.embedding.values
}


export const handleSummaryChat = async (req: Request, res: Response): Promise<any> => {
    try {
        const meetingCode = req.params.id;
        const { question } = req.body;
        const userId = (req as any).user?.id as string | undefined;

        if(!meetingCode || !question || !userId) {
            return res.status(400).json({ success: false, message: "meetingCode and question is required" })
        }

        meetingTrace("chat.requested", { meetingCode: String(meetingCode) });
        const access = await getMeetingInsightAccess(prisma, String(meetingCode), userId);

        meetingTrace("chat.access_checked", { meetingCode: String(meetingCode), found: Boolean(access), allowed: access?.canAccess });
        if(!access) {
            return res.status(404).json({ success: false, message: "Meeting not found" })
        }

        if (!access.canAccess) {
            return res.status(403).json({ success: false, message: "Only past participants can access this meeting chat" });
        }

        const summary = await prisma.summary.findUnique({
            where: { meetingId: access.meeting.id },
            select: { content: true }
        });

        meetingTrace("chat.embedding_started", { meetingId: access.meeting.id });
        const questionEmbedding = await getEmbbedText(question)
        const vectorString = `[${questionEmbedding.join(",")}]`; 

        //vector similarity search using pgvector
        const relevantChunks = await prisma.$queryRaw<{content: string, similarity: number}[]>`                                                         
            SELECT content, 1 - (embedding <=> ${vectorString}::vector) AS similarity                                                                   
            FROM "TranscriptChunk"                                                                                                                      
            WHERE "meetingId" = ${access.meeting.id}
            ORDER BY embedding <=> ${vectorString}::vector                                                                                              
            LIMIT 5                                                                                                                                     
        `;

        meetingTrace("chat.context_loaded", { meetingId: access.meeting.id, chunks: relevantChunks.length, hasSummary: Boolean(summary) });
        const chunksExist = relevantChunks && relevantChunks.length > 0;
        const summaryExists = summary && summary.content !== "Empty";

        if (!chunksExist && !summaryExists) {                                                                                           
            return res.status(200).json({                                                                                                               
                success: true,                                                                                                                          
                answer: "I don't have enough context from this meeting to answer that."                                                                 
            });                                                                                                                                         
        } 

        // Build the context for the LLM
        let contextText = "";
        if (summaryExists) {
            contextText += `--- MEETING SUMMARY ---\n${summary.content}\n\n`;
        }
        if (chunksExist) {
            contextText += `--- RELEVANT TRANSCRIPT EXCERPTS ---\n${relevantChunks.map(c => c.content).join("\n\n")}`;
        }
                
        // Ask the LLM to answer based ONLY on the context                                                                                           
        meetingTrace("chat.answer_started", { meetingId: access.meeting.id });
        const response = await groq.chat.completions.create({                                                                                           
            model: "openai/gpt-oss-20b",                                                                                                                
            temperature: 0.2, // slightly higher to allow natural summarizing                                                                                                                           
            messages: [                                                                                                                                 
                {                                                                                                                                       
                    role: "system",                                                                                                                     
                    content: `You are an AI assistant for a meeting platform. Answer the user's question using the provided meeting summary and transcript excerpts. You can infer general topics if asked what the meeting was about. If the answer is completely unrelated to the provided context, politely say you don't know.`     
                },                                                                                                                                      
                {                                                                                                                                       
                    role: "user",                                                                                                                       
                    content: `CONTEXT:\n${contextText}\n\nQUESTION: ${question}`                                                            
                }                                                                                                                                       
            ]                                                                                                                                           
        });   

        meetingTrace("chat.answer_finished", { meetingId: access.meeting.id });
        return res.status(200).json({                                                                                                                   
            success: true,                                                                                                                              
            answer: response.choices[0].message.content                                                                                                 
        });

    } catch(err) {
        meetingTrace("chat.failed", { meetingCode: String(req.params.id), ...traceError(err) });
        return res.status(500).json({ success: false, message: "Failed to get chat response" });
    }
}
