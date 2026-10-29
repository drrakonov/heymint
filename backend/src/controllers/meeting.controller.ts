import { isMeetingExpired } from "../utils/meetingLifecycle";
import { UserRequest } from "@stream-io/node-sdk"
import { Request, Response } from "express";
import { Prisma, PrismaClient } from "@prisma/client";
import { Meeting } from "../utils/Types";
import { streamClient } from "../utils/streamClient";



import { meetingTrace, traceError } from "../utils/meetingTrace";

const prisma = new PrismaClient();

const getStreamApiKey = process.env.STREAM_API_KEY!;
const client = streamClient;

export const createGetStreamToken = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = (req.user as { id?: string })?.id;
        const account = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;
        const name = account?.name;
        if (!userId || !account) {
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
            startingTime,
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
                createdById: (req.user as { id: string }).id,
                startingTime: isScheduled ? startingTime : new Date(),
                isScheduled: isScheduled,
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
        const userId = (req as any).user?.id as string | undefined;

        if (!userId) {
            return res.status(401).json({ success: false, message: "User is not authenticated" });
        }

        const meeting = await prisma.meeting.findMany({
            where: {
                isDeleted: false
            },
            select: {
                id: true,
                title: true,
                desc: true,
                isProtected: true,
                createdAt: true,
                startingTime: true,
                isScheduled: true,
                startedAt: true,
                createdBy: {
                    select: {
                        name: true
                    }
                },
                createdById: true,
                isComplete: true,
                meetingCode: true,
                participants: {
                    where: { userId },
                    take: 1,
                    select: { id: true }
                }
            },
        });

        const meetings: Meeting[] = meeting.map((m : any) => ({
            meetingId: m.id,
            title: m.title,
            description: m.desc,
            type: m.isProtected ? "Protected" : "Free",
            hostName: m.createdBy.name,
            meetingTime: String(m.startingTime),
            isProtected: m.isProtected,
            isInstant: m.isScheduled ? false : true,
            meetingCode: m.meetingCode,
            createdById: m.createdById,
            isComplete: m.isComplete,
            isExpired: isMeetingExpired(m),
            isDraft: !m.isScheduled && !m.startedAt && !m.isComplete,
            canAccessInsights: !isMeetingExpired(m) && (!m.isProtected || m.createdById === userId || m.participants.length > 0)
        }))

        res.status(200).json({ success: true, message: "Fetched all the meetings", meetings });
    } catch (err) {
        console.log("Failed to get meetings", err);
        return res.status(500).json({ success: false, message: "failed to get all the meetings" });
    }
}



export const deleteMeeting = async (req: Request, res: Response): Promise<any> => {
    try {
        const { meetingCode, isComplete } = req.body;
        // Older clients used deletion to end calls. Preserve compatibility without deleting history.
        if (isComplete === true) {
            req.params.meetingCode = meetingCode;
            return endMeeting(req, res);
        }
        const userId = (req as any).user?.id as string | undefined;

        if (!meetingCode || !userId) throw new Error("missing meetingCode or userID");

        const meeting = await prisma.meeting.findUnique({
            where: { meetingCode },
        });

        if (!meeting) {
            return res.status(404).json({ success: false, message: "Meeting not found" });
        }

        if (meeting.createdById !== userId) {
            return res.status(403).json({ success: false, message: "Only the meeting host can delete this meeting" });
        }
        if (meeting.startedAt && !meeting.isComplete) {
            return res.status(409).json({ success: false, message: "End the active meeting before deleting it" });
        }
        await prisma.meeting.update({
            where: { id: meeting.id },
            data: { isDeleted: true }
        })

        res.status(200).json({ success: true, message: "Meeting deleted" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Failed to delete meeting" })
    }
}


export const isProtectedMeetingValidation = async (req: Request, res: Response): Promise<any> => {
    try {
        const meetingCode = req.query.meetingCode as string;
        const userId = (req as any).user?.id as string | undefined;

        if (!meetingCode || !userId) {
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

        if (!meeting) {
            return res.status(404).json({ success: false, message: "Meeting not found" });
        }

        let isProtected = meeting?.isProtected;
        if (userId === meeting?.createdById) isProtected = false;
        res.status(200).json({ success: true, isProtected });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to validate meeting" });
    }
}

export const validateProtectedPassword = async (req: Request, res: Response): Promise<any> => {
    try {
        const { meetingPassword, meetingCode } = req.body;
        if (!meetingCode || !meetingPassword) {
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
            res.status(403).json({ success: false, message: "Password is incorrect", isMatched: false });
        }
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to validate the protected meeting" })
    }
}

export const validateJoinAccess = async (req: Request, res: Response): Promise<any> => {
    const { meetingCode } = req.query

    try {
        if (!meetingCode) {
            return res.status(400).json({ success: false, message: "Meeting code is required" });
        }

        const meeting = await prisma.meeting.findUnique({
            where: { meetingCode: String(meetingCode) }
        })
        if (!meeting || meeting.isDeleted) {
            return res.status(404).json({ success: false, message: "Meeting does not exist" });
        }

        if (meeting.isComplete) {
            return res.status(409).json({ success: false, message: "Meeting has already ended" });
        }

        if (isMeetingExpired(meeting)) {
            // A delayed start webhook must not expire a call that actually started.
            try {
                const { call } = await client.video.call("default", meeting.meetingCode).get();
                if (call.session?.started_at) {
                    await prisma.meeting.update({ where: { id: meeting.id }, data: { startedAt: call.session.started_at } });
                    if (call.ended_at || call.session.ended_at) {
                        await prisma.meeting.update({ where: { id: meeting.id }, data: { isComplete: true } });
                        return res.status(409).json({ success: false, message: "Meeting has already ended" });
                    }
                } else {
                    return res.status(410).json({ success: false, message: "This meeting expired 24 hours after its scheduled start" });
                }
            } catch (error) {
                // A missing Stream call is expected for a scheduled meeting nobody started.
                if ((error as { status?: number }).status === 404 || (error as { code?: number }).code === 16) {
                    return res.status(410).json({ success: false, message: "This meeting expired 24 hours after its scheduled start" });
                }
                throw error;
            }
        }
        const isHost = meeting.createdById === (req.user as { id: string }).id;
        res.status(200).json({ success: true, message: "Can join", isHost,
            passwordRequired: meeting.isProtected && !isHost, startingTime: meeting.startingTime });

    } catch (err) {
        console.log("Failed to validate the access to join the meeting", err);
        return res.status(500).json({ success: false, message: "Failed to validate join access" });
    }
}

export const addMeetingParticipant = async (req: Request, res: Response): Promise<any> => {
    try {
        const meetingCode = String(req.params.meetingCode || "");
        const userId = (req as any).user?.id as string | undefined;

        if (!userId) {
            return res.status(401).json({ success: false, message: "User is not authenticated" });
        }

        if (!meetingCode) {
            return res.status(400).json({ success: false, message: "Meeting code is required" });
        }

        const meeting = await prisma.meeting.findUnique({
            where: { meetingCode },
            select: {
                id: true,
                isDeleted: true,
                isComplete: true
            }
        });

        if (!meeting || meeting.isDeleted) {
            return res.status(404).json({ success: false, message: "Meeting not found" });
        }

        if (meeting.isComplete) {
            return res.status(409).json({ success: false, message: "Meeting has already ended" });
        }

        const call = client.video.call("default", meetingCode);
        const connectedParticipants = await call.queryCallParticipants({
            filter_conditions: {
                user_id: { $eq: userId }
            },
            limit: 1
        });
        const connectedParticipant = connectedParticipants.participants.find(
            (participant) => participant.user.id === userId
        );

        if (!connectedParticipant) {
            return res.status(403).json({
                success: false,
                message: "Join the meeting before attendance can be recorded"
            });
        }

        const joinedAt = new Date(connectedParticipant.joined_at);
        await prisma.meeting.updateMany({ where: { id: meeting.id, startedAt: null }, data: { startedAt: joinedAt } });
        const participantKey = {
            meetingId_userId: {
                meetingId: meeting.id,
                userId
            }
        };

        let participant = await prisma.meetingParticipant.findUnique({
            where: participantKey
        });

        if (!participant) {
            try {
                participant = await prisma.meetingParticipant.create({
                    data: {
                        meetingId: meeting.id,
                        userId,
                        firstJoinedAt: joinedAt,
                        lastJoinedAt: joinedAt
                    }
                });
            } catch (error) {
                const isConcurrentInsert = error instanceof Prisma.PrismaClientKnownRequestError
                    && error.code === "P2002";

                if (!isConcurrentInsert) {
                    throw error;
                }
            }
        }

        if (!participant || joinedAt > participant.lastJoinedAt) {
            await prisma.meetingParticipant.updateMany({
                where: {
                    meetingId: meeting.id,
                    userId,
                    lastJoinedAt: { lt: joinedAt }
                },
                data: {
                    lastJoinedAt: joinedAt,
                    joinCount: { increment: 1 }
                }
            });

            participant = await prisma.meetingParticipant.findUnique({
                where: participantKey
            });
        }

        return res.status(200).json({
            success: true,
            message: "Meeting participant recorded",
            participant
        });
    } catch (err) {
        console.log("Failed to record meeting participant", err);
        return res.status(500).json({ success: false, message: "Failed to record meeting participant" });
    }
}


export const startMeetingRecording = async (req: any, res: Response): Promise<any> => {
    meetingTrace("recording.start_requested", { meetingCode: String(req.params.meetingCode), authenticated: Boolean(req.user?.id) });
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

        meetingTrace("recording.host_checked", { meetingCode, meetingId: meeting.id, isHost: meeting.createdById === userId });
        if (meeting.createdById !== userId) {
            return res.status(403).json({ success: false, message: "Only the meeting host can start recording" });
        }

        const call = client.video.call("default", meetingCode);
        const callResponse = await call.get();

        meetingTrace("recording.call_state", { meetingCode, ended: Boolean(callResponse.call.ended_at), sessionId: callResponse.call.current_session_id, transcribing: callResponse.call.transcribing, recordingStatus: callResponse.call.egress.individual_recording?.status });
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
            meetingTrace("recording.stream_start_requested", { meetingCode });
            await call.startRecording({ recording_type: "individual" });
            meetingTrace("recording.stream_start_accepted", { meetingCode });
            recordingStartedByRequest = true;
        }

        try {
            if (!isTranscribing) {
                meetingTrace("transcription.stream_start_requested", { meetingCode });
                await call.startTranscription({ language: "auto" });
                meetingTrace("transcription.stream_start_accepted", { meetingCode });
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
        meetingTrace("recording.start_failed", { meetingCode: String(req.params.meetingCode), ...traceError(err) });
        return res.status(500).json({ success: false, message: "Failed to start meeting recording" });
    }
}


export const stopMeetingRecording = async (req: any, res: Response): Promise<any> => {
    meetingTrace("recording.stop_requested", { meetingCode: String(req.params.meetingCode), authenticated: Boolean(req.user?.id) });
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

        meetingTrace("recording.stop_state", { meetingCode, recordingStatus, transcribing: isTranscribing });
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
        meetingTrace("recording.stop_finished", { meetingCode, operations: stopOperations.length });

        return res.status(200).json({ success: true, message: "Recording and transcription stopped successfully" });
    } catch (err) {
        meetingTrace("recording.stop_failed", { meetingCode: String(req.params.meetingCode), ...traceError(err) });
        return res.status(500).json({ success: false, message: "Failed to stop meeting recording" });
    }
}

// One server operation owns completion; a verified webhook provides a second durable path.
export const endMeeting = async (req: Request, res: Response): Promise<any> => {
    const meetingCode = String(req.params.meetingCode || "");
    try {
        const meeting = await prisma.meeting.findUnique({ where: { meetingCode } });
        if (!meeting || meeting.isDeleted) return res.status(404).json({ success: false, message: "Meeting not found" });
        if (meeting.createdById !== (req.user as { id: string }).id) {
            return res.status(403).json({ success: false, message: "Only the host can end the meeting for everyone" });
        }
        if (meeting.isComplete) return res.json({ success: true });
        const call = client.video.call("default", meetingCode);
        const current = await call.get();
        if (!current.call.ended_at) await call.end();
        await prisma.meeting.update({ where: { id: meeting.id }, data: { isComplete: true } });
        meetingTrace("meeting.completed", { meetingCode, source: "end_request" });
        return res.json({ success: true, message: "Meeting ended" });
    } catch (error) {
        meetingTrace("meeting.end_failed", { meetingCode, ...traceError(error) });
        return res.status(503).json({ success: false, message: "Could not confirm meeting completion. Please retry." });
    }
};
