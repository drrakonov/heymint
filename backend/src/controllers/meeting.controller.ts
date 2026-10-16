import { UserRequest } from "@stream-io/node-sdk"
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { Bookings, Meeting, Payments } from "../utils/Types";
import { streamClient } from "../utils/streamClient";



const prisma = new PrismaClient();

const getStreamApiKey = process.env.STREAM_API_KEY!;
const client = streamClient;

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
            where: {
                isComplete: undefined,
                OR: [ { isDeleted: false }, { isComplete: true } ]
            },
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
                isComplete: true,
                meetingCode: true
            },
        });

        const meetingPurchased = await prisma.meetingPurchase.findMany({
            where: {
                userId: String(userId),
                meeting: {
                    isComplete: undefined,
                    OR: [ { isDeleted: false }, { isComplete: true } ]
            }
            },
            select: { meetingId: true }
        });

        const meetings: Meeting[] = meeting.map((m : any) => ({
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
            createdById: m.createdById,
            isComplete: m.isComplete
        }))

        const purchases = meetingPurchased.map((p : any) => p.meetingId);


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
                userId: String(userId),
                meeting: {
                    isComplete: undefined,
                    OR: [ { isDeleted: false }, { isComplete: true } ]
            }
            },
            include: {
                meeting: {
                    include: {
                        createdBy: true
                    }
                }
            }
        });


        const bookings: Bookings[] = purchasedMeetings.map((b : any) => ({
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

export const getAllPayments = async (req: Request, res: Response): Promise<any> => {
    try {
        const { userId } = req.query;
        if(!userId) throw new Error("userId not found");

        const getPayments = await prisma.payment.findMany({
            where: { userId: String(userId) },
            include: {
                meeting: {
                    select: {
                        title: true,
                        price: true
                    }
                }
            }
        });

        const payments: Payments[] = getPayments.map((payment : any) => ({
            id: payment.tnxId,
            meetingName: payment.meeting.title,
            amount: payment.meeting.price,
            status: payment.status,
            date: payment.createdAt,
            paymentMethod: "UPI"
        }));

        return res.status(201).json({ success: true, message: "All payments", payments });

    }catch(err) {
        console.log("Failed to get payments", err);
        return res.status(500).json({ success: false, message: "Failed get the payments" })
    }
}



export const deleteMeeting = async (req: Request, res: Response): Promise<any> => {
    try {
        const { meetingCode, userId, isComplete } = req.body;

        if (!meetingCode || !userId) throw new Error("missing meetingCode or userID");

        const meeting = await prisma.meeting.findUnique({
            where: { meetingCode },
        });

        if (!meeting) {
            return res.status(404).json({ success: false, message: "Meeting not found" });
        }

        if (meeting.createdById !== userId || (!isComplete && meeting.isPaid)) {
            return res.status(403).json({ success: false, message: "You are not authorized to delete this meeting or you can't delete paid meetings" });
        }
        await prisma.meeting.update({
            where: { id: meeting.id },
            data: {
                isDeleted: true,
                isComplete
            }
        })

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
                createdById: true,
                isComplete: true
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

        if (meeting.isPaid && meeting.createdById != userId) {
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


export const startMeetingRecording = async (req: any, res: Response): Promise<any> => {
    try {
        const meetingCode = req.params.meetingCode as string;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: "User is not authenticated" });
        }

        if (!meetingCode) {
            return res.status(400).json({ success: false, message: "Meeting code is required" });
        }

        const meeting = await prisma.meeting.findUnique({
            where: { meetingCode }
        });

        if (!meeting) {
            return res.status(404).json({ success: false, message: "Meeting not found" });
        }

        if (meeting.createdById !== userId) {
            return res.status(403).json({ success: false, message: "Only the meeting host can start recording" });
        }

        const call = client.video.call("default", meetingCode);
        const callResponse = await call.get();

        if (callResponse.call.ended_at || !callResponse.call.current_session_id) {
            return res.status(409).json({ success: false, message: "Meeting session is not active" });
        }

        const isRecording = callResponse.call.egress.individual_recording?.status === "active";
        const isTranscribing = callResponse.call.transcribing;

        //  Configure the call settings to ensure recording and transcription are available
        await call.update({
            settings_override: {
                individual_recording: {
                    mode: "available",
                    output_types: ["audio_only"],
                },
                transcription: {
                    mode: "available",
                    language: "auto"
                }
            },
        });

        let recordingStartedByRequest = false;

        if (!isRecording) {
            await call.startRecording({ recording_type: "individual" });
            recordingStartedByRequest = true;
        }

        try {
            if (!isTranscribing) {
                await call.startTranscription({ language: "auto" });
            }
        } catch (error) {
            if (recordingStartedByRequest) {
                await call.stopRecording({ recording_type: "individual" }).catch(console.error);
            }
            throw error;
        }

        return res.status(200).json({
            success: true,
            message: isRecording && isTranscribing
                ? "Recording and transcription are already active"
                : "Recording and transcription started successfully"
        });
    } catch (err) {
        console.log("Failed to start meeting recording", err);
        return res.status(500).json({ success: false, message: "Failed to start meeting recording" });
    }
}


export const stopMeetingRecording = async (req: any, res: Response): Promise<any> => {
    try {
        const meetingCode = req.params.meetingCode as string;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: "User is not authenticated" });
        }

        if (!meetingCode) {
            return res.status(400).json({ success: false, message: "Meeting code is required" });
        }

        const meeting = await prisma.meeting.findUnique({
            where: { meetingCode },
            select: { id: true }
        });

        if (!meeting) {
            return res.status(404).json({ success: false, message: "Meeting not found" });
        }

        const call = client.video.call("default", meetingCode);
        const callResponse = await call.get();
        const recordingStatus = callResponse.call.egress.individual_recording?.status;
        const isTranscribing = callResponse.call.transcribing;

        if (recordingStatus !== "active" && !isTranscribing) {
            return res.status(200).json({ success: true, message: "Recording and transcription are already stopped" });
        }

        const stopOperations: Promise<unknown>[] = [];
        if (recordingStatus === "active") {
            stopOperations.push(call.stopRecording({ recording_type: "individual" }));
        }
        if (isTranscribing) {
            stopOperations.push(call.stopTranscription());
        }
        await Promise.all(stopOperations);

        return res.status(200).json({ success: true, message: "Recording and transcription stopped successfully" });
    } catch (err) {
        console.log("Failed to stop meeting recording", err);
        return res.status(500).json({ success: false, message: "Failed to stop meeting recording" });
    }
}
