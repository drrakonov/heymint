import { StreamClient, UserRequest } from "@stream-io/node-sdk"
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { Bookings, Meeting } from "../utils/Types";



const prisma = new PrismaClient();

const getStreamApiKey = process.env.STREAM_API_KEY!;
const getStreamApiSecret = process.env.STREAM_SECRET_KEY!;

const client = new StreamClient(getStreamApiKey, getStreamApiSecret, { timeout: 15000 });

export const createGetStreamToken = async (req: Request, res: Response): Promise<any> => {
    try {
        const { userId, name } = req.body;
        if (!userId) {
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

    } catch (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: "get stream token generation failed" })
    }
}


export const handleMeetingSetup = async (req: Request, res: Response): Promise<any> => {
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


    } catch (err) {
        return res.status(500).json({ success: false, message: "meeting setup failed" })
    }
}

export const getAllMeetings = async (req: Request, res: Response): Promise<any> => {
    try {

        const { userId } = req.query

        const meeting = await prisma.meeting.findMany({
            select: {
                id: true,
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

        const meetingPurchased = await prisma.meetingPurchase.findMany({
            where: {
                userId: String(userId)
            },
            select: { meetingId: true }
        });

        const meetings: Meeting[] = meeting.map(m => ({
            meetingId: m.id,
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

        const purchases = meetingPurchased.map(p => p.meetingId);


        res.status(201).json({ success: true, message: "Fetched all the meetings", meetings, purchases });
    } catch (err) {
        console.log("Failed to get meetings", err);
        return res.status(500).json({ success: false, message: "failed to get all the meetings" });
    }
}

export const getAllBookedMeetings = async (req: Request, res: Response): Promise<any> => {
    try {
        const { userId } = req.query

        if (!userId) {
            throw new Error("userId not found");
        }

        const purchasedMeetings = await prisma.meetingPurchase.findMany({
            where: {
                userId: String(userId)
            },
            include: {
                meeting: {
                    include: {
                        createdBy: true
                    }
                }
            }
        });


        const bookings: Bookings[] = purchasedMeetings.map((b) => ({
            meetingId: b.meeting.id,
            title: b.meeting.title,
            hostName: b.meeting.createdBy.name,
            description: b.meeting.desc,
            price: b.meeting.price,
            isProtected: b.meeting.isProtected,
            meetingTime: String(b.meeting.startingTime),
            meetingCode: b.meeting.meetingCode,
            isInstant: b.meeting.isScheduled ? false : true,
            createdById: b.meeting.createdById
        }));

        res.status(201).json({ success: true, message: "All booked meetings", bookings })

    } catch (err) {
        console.log("Failed to get booked meetings", err);
        return res.status(500).json({ success: false, message: "Failed to get booked meetings" })
    }
}



export const deleteMeeting = async (req: Request, res: Response): Promise<any> => {
    try {
        const { meetingCode, userId } = req.body;

        if (!meetingCode || !userId) throw new Error("missing meetingCode or userID");

        const meeting = await prisma.meeting.findUnique({
            where: { meetingCode },
        });

        if (!meeting) {
            return res.status(404).json({ success: false, message: "Meeting not found" });
        }

        if (meeting.createdById !== userId) {
            return res.status(403).json({ success: false, message: "You are not authorized to delete this meeting" });
        }

        await prisma.$transaction([
            prisma.meetingPurchase.deleteMany({ where: { meetingId: meeting.id } }),
            prisma.payment.deleteMany({ where: { meetingId: meeting.id } }),
            prisma.meeting.delete({ where: { id: meeting.id } }),
        ]);

        res.status(200).json({ success: true, message: "Meeting and related records deleted successfully" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Failed to delete meeting" })
    }
}


export const isProtectedMeetingValidation = async (req: Request, res: Response): Promise<any> => {
    try {
        const meetingCode = req.query.meetingCode as string;
        const userId = req.query.userId as string;

        if (!meetingCode) {
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
        if (userId === meeting?.createdById) isProtected = false;
        res.status(201).json({ success: true, isProtected });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to validate meeting" });
    }
}

export const validateProtectedPassword = async (req: Request, res: Response): Promise<any> => {
    try {
        const { meetingPassword, meetingCode } = req.body;
        if (!meetingCode || !meetingCode) {
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

        if (!meeting) {
            throw new Error("Failed to fetch the meeting details");
        }

        if (meeting.password === meetingPassword) {
            res.status(200).json({ success: true, message: "Password is correct", isMatched: true });
        } else {
            res.status(401).json({ success: true, message: "Password is incorrect", isMatched: false });
        }
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to validate the protected meeting" })
    }
}

export const validateJoinAccess = async (req: Request, res: Response): Promise<any> => {
    const { userId, meetingCode } = req.query

    try {
        if (!userId || !meetingCode) throw new Error("userId or meetingCode not found");

        const meeting = await prisma.meeting.findUnique({
            where: { meetingCode: String(meetingCode) }
        })
        if (!meeting) {
            return res.json({ success: false, message: "Meeting does not exists" });
        }

        if (meeting.isPaid) {
            const purchase = await prisma.meetingPurchase.findFirst({
                where: {
                    userId: String(userId),
                    meeting: {
                        meetingCode: String(meetingCode)
                    }
                }
            });

            if(!purchase) {
                return res.json({ success: false, message: "Meeting is not purchased" });
            }
        }

        res.status(200).json({ success: true, message: "Can join" });

    } catch (err) {
        console.log("Failed to validate the access to join the meeting", err);
        return res.status(500).json({ success: false, message: "Failed to validate join access" });
    }
}