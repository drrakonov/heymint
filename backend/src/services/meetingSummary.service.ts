import { PrismaClient } from "@prisma/client";
import { Groq } from "groq-sdk";
import { chunkTheTranscription } from "../utils/chunker";

const prisma = new PrismaClient();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SUMMARY_SYSTEM_PROMPT = `You are a meeting summarizer. You MUST respond with ONLY a valid JSON object (no markdown, no backticks, no extra text). Use this exact structure:
{
  "overview": "2-3 sentence high-level summary of the meeting",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "actionItems": ["action 1", "action 2"],
  "decisions": ["decision 1", "decision 2"]
}
Rules:
- Always return valid JSON, nothing else
- If the transcript is very short or unclear, still return the JSON with your best interpretation
- keyPoints should have 3-6 items
- actionItems can be empty array [] if none were discussed
- decisions can be empty array [] if none were made`;

export const generateAndStoreMeetingSummary = async (
    meetingIdentifier: string,
    transcription: string
) => {
    const meeting = await prisma.meeting.findFirst({
        where: {
            OR: [
                { id: meetingIdentifier },
                { meetingCode: meetingIdentifier }
            ]
        },
        include: { summary: true }
    });

    if (!meeting) {
        throw new Error(`Meeting ${meetingIdentifier} was not found`);
    }

    if (meeting.summary?.transcription === transcription) {
        await chunkTheTranscription(meeting.id);
        return meeting.summary.content;
    }

    const summary = await groq.chat.completions.create({
        model: "openai/gpt-oss-20b",
        temperature: 0,
        messages: [
            { role: "system", content: SUMMARY_SYSTEM_PROMPT },
            { role: "user", content: `Meeting transcript:\n\n${transcription}` },
        ]
    });
    const content = summary.choices[0].message.content || "Empty";

    await prisma.summary.upsert({
        where: { meetingId: meeting.id },
        update: { content, transcription },
        create: {
            content,
            meetingId: meeting.id,
            transcription
        }
    });

    await chunkTheTranscription(meeting.id);

    return content;
};
