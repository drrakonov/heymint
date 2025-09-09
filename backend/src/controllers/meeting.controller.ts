import { StreamClient, UserRequest } from "@stream-io/node-sdk"
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { Meeting } from "../utils/Types";



const prisma = new PrismaClient();

const getStreamApiKey = process.env.STREAM_API_KEY!;
const getStreamApiSecret = process.env.STREAM_SECRET_KEY!;

const client = new StreamClient(getStreamApiKey, getStreamApiSecret, { timeout: 15000 });

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
        console.log(err);
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
                isScheduled: isScheduled,
                price: isPaid ? price : 0,
                isPaid: isPaid,
                meetingCode: meetingCode
            }
        })

        return res.status(201).json({ success: true, message: "meeting details stored" });


    }catch(err) {
        return res.status(500).json({ success: false, message: "meeting setup failed" })
    }
} 

export const getAllMeetings = async (req: Request, res: Response): Promise<any> => {
    try {
        const meeting = await prisma.meeting.findMany({
            select: {
                title: true,
                desc: true,
                isPaid: true,
                isProtected: true,
                password: true,
                createdAt: true,
                startingTime: true,
                isScheduled: true,
                price: true,
                createdBy: {
                    select: {
                        name: true
                    }
                },
                createdById: true,
                meetingCode: true
            },
        });

        const meetings: Meeting[] = meeting.map(m => ({
            title: m.title,
            description: m.desc,
            type: m.isPaid ? "Paid" : "Free",
            hostName: m.createdBy.name,
            price: m.price,
            meetingTime: String(m.startingTime),
            isProtected: m.isProtected,
            isInstant: m.isScheduled ? false : true,
            meetingCode: m.meetingCode,
            createdById: m.createdById
        }))


        res.status(201).json({ success: true, message: "Fetched all the meetings", meetings });
    }catch(err) {
        return res.status(500).json({ success: false, message: "failed to get all the meetings" });
    }
}



export const deleteMeeting = async (req: Request, res: Response): Promise<any> => {
    try {
        const { meetingCode, userId } = req.body;

        if(!meetingCode || !userId) throw new Error("missing meetingCode or userID");

        await prisma.meeting.delete({
            where: {
                createdById: userId,
                meetingCode: meetingCode,
            }
        })

        res.status(200).json({ success: true, message: "Meeting deleted" });
    }catch(err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Failed to delete meeting" })
    }
}


export const isProtectedMeetingValidation = async (req: Request, res: Response): Promise<any> => {
    try {
        const meetingCode = req.query.meetingCode as string;
        const userId = req.query.userId as string;

        if(!meetingCode) {
            throw new Error("meetingCode or userId is missing");
        }

        const meeting = await prisma.meeting.findUnique({
            select: {
                isProtected: true,
                createdById: true
            },
            where: {
                meetingCode: meetingCode,
            }
        })
        let isProtected = meeting?.isProtected;
        if(userId === meeting?.createdById) isProtected = false;
        res.status(201).json({ success: true, isProtected });
    }catch(err) {
        res.status(500).json({ success: false, message: "Failed to validate meeting" });
    }
}

export const validateProtectedPassword = async (req: Request, res: Response):Promise<any> => {
    try {
        const  { meetingPassword, meetingCode } = req.body;
        if(!meetingCode || !meetingCode) {
            return res.status(400).json({ success: false, message: "meetingCode, meetingPassword or userId is missing" });
        }

        const meeting = await prisma.meeting.findUnique({
            select: {
                password: true
            },
            where: {
                meetingCode: meetingCode,
            }
        });

        if(!meeting) {
            throw new Error("Failed to fetch the meeting details");
        }

        if(meeting.password === meetingPassword) {
            res.status(200).json({ success: true, message: "Password is correct", isMatched: true });
        }else {
            res.status(401).json({ success: true, message: "Password is incorrect", isMatched: false });
        }
    }catch(err) {
        return res.status(500).json({ success: false, message: "Failed to validate the protected meeting" })
    }
}