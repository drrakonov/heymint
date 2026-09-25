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
                        content: "Summarize this meeting transcript and list key action items."
                    },
                    {
                        role: "user",
                        content: transcription.text
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
                await prisma.summary.create({data: {
                    content: summary.choices[0].message.content || "Empty",
                    meetingId: meetingRecord.id,
                }});
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
        if(filePath) fs.unlinkSync(filePath)     
    }
}