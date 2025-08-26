import { StreamClient, UserRequest } from "@stream-io/node-sdk"
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";



const prisma = new PrismaClient();

const getStreamApiKey = process.env.STREAM_API_KEY!;
const getStreamApiSecret = process.env.STREAM_SECRET_KEY!;

const client = new StreamClient(getStreamApiKey, getStreamApiSecret);

export const createGetStreamToken = async (req: Request, res: Response): Promise<any> => {
    try {
        const { userId, name } = req.body;
        if(!userId) {
           return res.status(400).json({ success: false, message: "UserId not found" }); 
        }

        const newUser: UserRequest = {
            name: name || "unknown",
            id: userId,
            role: 'user'
        }

        await client.upsertUsers([newUser]);
        const validity = 60 * 60;

        const token = client.generateUserToken({
            user_id: userId,
            validity_in_seconds: validity
        });

        const apiKey = getStreamApiKey;
        res.status(200).json({ success: true, message: "Token generated successfully", token, apiKey })

    }catch(err) {
        return res.status(500).json({ success: false, message: "get stream token generation failed" })
    }
}


export const handleMeetingSetup = async (req: Request, res: Response):Promise<any> => {
    try {
        const { 
            title, 
            description, 
            isScheduled, 
            isPaid, 
            price,  
            startingTime, 
            createdBy,
            isProtected, 
            password,
            meetingCode
        } = req.body;


        await prisma.meeting.create({
            data: {
                title: title,
                desc: description,
                password: isProtected ? password : null,
                isProtected: isProtected,
                createdById: createdBy,
                startingTime: isScheduled ? startingTime : new Date(),
                price: isPaid ? price : 0,
                isPaid: isPaid,
                meetingCode: meetingCode
            }
        })

        return res.status(201).json({ success: true, message: "meeting details stored" });


    }catch(err) {
        console.log(err);
        return res.status(500).json({ success: false, message: "meeting setup failed" })
    }
} 