import { Response, Request } from "express"
import Fs from "fs"
import { Groq } from "groq-sdk";
import fs from "fs"
import { PrismaClient } from "@prisma/client";

const groq = new Groq();
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
            return res.status(500).json({
                success: false,
                message: "Failed to get transcription"
            })
        }

        try {
            //Get the summary from LLM
            summary = await groq.chat.completions.create({
                model: "llama-3.1-8b-instant",
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
            return res.status(500).json({
                success: false,
                message: "Failed to get summary"
            })
        }
       

        try {
            //Save the summary in the DB
            await prisma.summary.create({data: {
                content: summary.choices[0].message.content || "Empty",
                meetingId,
            }})
        }catch(err) {
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
        return res.status(500).json({
            success: false,
            message: "Failed to summarize the meeting!"
        })
    } finally {
        const filePath = req.file?.path;
        if(filePath) fs.unlinkSync(filePath)     
    }
}