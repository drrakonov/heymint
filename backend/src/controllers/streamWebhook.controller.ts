import { Prisma, PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { streamClient } from "../utils/streamClient";

const prisma = new PrismaClient();

const getCallId = (callCid: string) => {
    const separatorIndex = callCid.indexOf(":");
    return separatorIndex === -1 ? callCid : callCid.slice(separatorIndex + 1);
};

const getMeetingId = async (callCid: string) => {
    const meetingCode = getCallId(callCid);
    const meeting = await prisma.meeting.findUnique({
        where: { meetingCode },
        select: { id: true }
    });

    if (!meeting) throw new Error(`Meeting ${meetingCode} was not found for Stream transcription`);
    return meeting.id;
};

const createWaitingJob = async (callCid: string, sourceId: string) => {
    const meetingId = await getMeetingId(callCid);

    try {
        await prisma.transcriptionJob.create({
            data: { sourceId, meetingId, status: "WAITING" }
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return;
        throw error;
    }
};

const enqueueReadyTranscript = async (
    callCid: string,
    sourceId: string,
    transcription: {
        session_id: string;
        url: string;
        filename: string;
    }
) => {
    const meetingId = await getMeetingId(callCid);

    try {
        await prisma.transcriptionJob.create({
            data: {
                sourceId,
                meetingId,
                sessionId: transcription.session_id,
                transcriptionUrl: transcription.url,
                filename: transcription.filename,
                status: "PENDING"
            }
        });
        return;
    } catch (error) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
            throw error;
        }
    }

    await prisma.transcriptionJob.updateMany({
        where: { sourceId, status: { in: ["WAITING", "FAILED"] } },
        data: {
            meetingId,
            sessionId: transcription.session_id,
            transcriptionUrl: transcription.url,
            filename: transcription.filename,
            status: "PENDING",
            availableAt: new Date(),
            leaseToken: null,
            leaseExpiresAt: null,
            lastError: null
        }
    });
};

export const handleStreamWebhook = async (req: Request, res: Response): Promise<any> => {
    const signature = req.headers["x-signature"];

    if (typeof signature !== "string") {
        return res.status(401).json({ success: false, message: "Missing Stream signature" });
    }

    let event;

    try {
        event = streamClient.verifyAndParseWebhook(req.body, signature);
    } catch (error) {
        console.error("Failed to verify Stream webhook", error);
        return res.status(401).json({ success: false, message: "Invalid Stream signature" });
    }

    try {
        if (event.type === "call.transcription_started") {
            await createWaitingJob(event.call_cid, event.egress_id);
            return res.sendStatus(200);
        }

        if (event.type === "call.transcription_ready") {
            await enqueueReadyTranscript(event.call_cid, event.egress_id, event.call_transcription);
            return res.sendStatus(200);
        }

        if (event.type === "call.transcription_failed") {
            const meetingId = await getMeetingId(event.call_cid);
            const maximumAttempts = Number(process.env.TRANSCRIPTION_WORKER_MAX_ATTEMPTS || 5);

            try {
                await prisma.transcriptionJob.create({
                    data: {
                        sourceId: event.egress_id,
                        meetingId,
                        status: "FAILED",
                        attempts: maximumAttempts,
                        lastError: event.error || "Stream transcription failed"
                    }
                });
            } catch (error) {
                if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
                    throw error;
                }
                await prisma.transcriptionJob.updateMany({
                    where: { sourceId: event.egress_id, status: { not: "COMPLETED" } },
                    data: {
                        status: "FAILED",
                        attempts: maximumAttempts,
                        lastError: event.error || "Stream transcription failed",
                        leaseToken: null,
                        leaseExpiresAt: null
                    }
                });
            }
            return res.sendStatus(200);
        }

        if (event.type !== "call.session_ended") return res.sendStatus(200);

        const call = streamClient.video.call(event.call.type, event.call.id);
        const callResponse = await call.get();
        const stopOperations: Promise<unknown>[] = [];

        if (callResponse.call.egress.individual_recording?.status === "active") {
            stopOperations.push(call.stopRecording({ recording_type: "individual" }));
        }
        if (callResponse.call.transcribing) {
            stopOperations.push(call.stopTranscription());
        }

        await Promise.all(stopOperations);
        return res.sendStatus(200);
    } catch (error) {
        console.error(`Failed to handle Stream webhook ${event.type}`, error);
        return res.sendStatus(500);
    }
};
