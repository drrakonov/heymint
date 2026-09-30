import { Response, Request } from "express"
import Fs from "fs"
import { Groq } from "groq-sdk";
import fs from "fs"
import { PrismaClient } from "@prisma/client";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const prisma = new PrismaClient();

export const handleMeetingSummarizer = async (req: Request, res: Response): Promise<any> => {
    try {
        const meetingId = req.params.id;
        const filePath = req.file?.path;        

        if(!meetingId || !filePath) {
            return res.status(500).json({
                success: false,
                message: "Something went wrong"
            })
        }

        const audio = fs.createReadStream(filePath);
        let transcription;
        let summary;


        try {
             //Get the audio to text transcription.
            transcription = await groq.audio.transcriptions.create({
                model: "whisper-large-v3",
                file: audio,
                temperature: 0,
            })
        }catch(err) {
            console.error("Something went wrong! ", err);
            return res.status(500).json({
                success: false,
                message: "Failed to get transcription"
            })
        }

        console.log("transcription: ", transcription);

        try {
            //Get the summary from LLM
            summary = await groq.chat.completions.create({
                model: "openai/gpt-oss-20b",
                temperature: 0,
                messages: [
                    {
                        role: "system",
                        content: `You are a meeting summarizer. You MUST respond with ONLY a valid JSON object (no markdown, no backticks, no extra text). Use this exact structure:
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
- decisions can be empty array [] if none were made`
                    },
                    {
                        role: "user",
                        content: `Meeting transcript:\n\n${transcription.text}`
                    },
                ]
            })
        }catch(err) {
            console.error("Something went wrong! ", err);
            return res.status(500).json({
                success: false,
                message: "Failed to get summary"
            })
        }
        console.log("summary", summary.choices[0].message.content);

        try {
            // Find the real meeting ID from the URL param (which is the meetingCode)
            const meetingRecord = await prisma.meeting.findFirst({
                where: {
                    OR: [
                        { id: String(meetingId) },
                        { meetingCode: String(meetingId) }
                    ]
                }
            });

            if (meetingRecord) {
                //Save the summary in the DB using the real UUID
                await prisma.summary.upsert({
                    where: { meetingId: meetingRecord.id },
                    update: { content: summary.choices[0].message.content || "Empty" },
                    create: {
                        content: summary.choices[0].message.content || "Empty",
                        meetingId: meetingRecord.id,
                    }
                });
            }
        }catch(err) {
            console.error("Something went wrong! ", err);
            return res.status(500).json({
                success: false,
                message: "Database query failed"
            })
        }
   
        
        return res.status(200).json({
            success: true,
            message: summary.choices[0].message.content
        })

    } catch(err) {
        console.error("Something went wrong! ", err);
        return res.status(500).json({
            success: false,
            message: "Failed to summarize the meeting!"
        })
    } finally {
        const filePath = req.file?.path;
        if(filePath) {  
            fs.unlinkSync(filePath);
        }
    }
}
export const getMeetingSummary = async (req: any, res: any) => {
    try {
        const { id } = req.params; // this is the meetingCode
        
        const meeting = await prisma.meeting.findUnique({
            where: { meetingCode: String(id) },
            include: { summary: true }
        });

        if (!meeting || !meeting.summary) {
            return res.status(404).json({ success: false, message: "Summary not found" });
        }

        return res.status(200).json({ success: true, summary: meeting.summary.content, meeting });
    } catch (err) {
        console.error("Failed to fetch summary:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
