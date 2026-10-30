import { Prisma, PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { streamClient } from "../utils/streamClient";

import { meetingTrace, traceError } from "../utils/meetingTrace";

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

    meetingTrace("webhook.meeting_lookup", { callCid, meetingCode, found: Boolean(meeting), meetingId: meeting?.id });
    if (!meeting) throw new Error(`Meeting ${meetingCode} was not found for Stream transcription`);
    return meeting.id;
};

const createWaitingJob = async (callCid: string, sourceId: string) => {
    const meetingId = await getMeetingId(callCid);

    try {
        const job = await prisma.transcriptionJob.create({
            data: { sourceId, meetingId, status: "WAITING" }
        });
        meetingTrace("job.created", { callCid, meetingId, sourceId, jobId: job.id, status: job.status });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            meetingTrace("job.waiting_duplicate", { callCid, meetingId, sourceId });
            return;
        }
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
        const job = await prisma.transcriptionJob.create({
            data: {
                sourceId,
                meetingId,
                sessionId: transcription.session_id,
                transcriptionUrl: transcription.url,
                filename: transcription.filename,
                status: "PENDING"
            }
        });
        meetingTrace("job.created", { callCid, meetingId, sourceId, jobId: job.id, sessionId: job.sessionId, status: job.status });
        return;
    } catch (error) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
            throw error;
        }
    }

    const updated = await prisma.transcriptionJob.updateMany({
        where: { meetingId, sourceId, status: { in: ["WAITING", "FAILED"] } },
        data: {
            meetingId,
            sessionId: transcription.session_id,
            transcriptionUrl: transcription.url,
            filename: transcription.filename,
            status: "PENDING",
            attempts: 0,
            availableAt: new Date(),
            leaseToken: null,
            leaseExpiresAt: null,
            lastError: null
        }
    });
    meetingTrace("job.ready_update", { callCid, meetingId, sourceId, sessionId: transcription.session_id, updatedRows: updated.count, outcome: updated.count ? "PENDING" : "existing_job_not_waiting_or_failed" });
};

export const handleStreamWebhook = async (req: Request, res: Response): Promise<any> => {
    const requestId = res.locals.meetingTraceId as string | undefined;
    const signature = req.headers["x-signature"];

    if (typeof signature !== "string") {
        meetingTrace("webhook.signature_missing", { requestId });
        return res.status(401).json({ success: false, message: "Missing Stream signature" });
    }

    let event;

    try {
        event = streamClient.verifyAndParseWebhook(req.body, signature);
        meetingTrace("webhook.verified", { requestId, type: event.type, callCid: "call_cid" in event ? event.call_cid : undefined, rawBody: Buffer.isBuffer(req.body) });
    } catch (error) {
        meetingTrace("webhook.verification_failed", { requestId, rawBody: Buffer.isBuffer(req.body), ...traceError(error) });
        return res.status(401).json({ success: false, message: "Invalid Stream signature" });
    }

    try {
        if (event.type === "call.transcription_started") {
            meetingTrace("transcription.started", { requestId, callCid: event.call_cid, sourceId: event.egress_id });
            await createWaitingJob(event.call_cid, event.egress_id);
            return res.sendStatus(200);
        }

        if (event.type === "call.transcription_ready") {
            meetingTrace("transcription.ready", { requestId, callCid: event.call_cid, sourceId: event.egress_id, sessionId: event.call_transcription?.session_id, hasTranscriptUrl: Boolean(event.call_transcription?.url) });
            await enqueueReadyTranscript(event.call_cid, event.egress_id, event.call_transcription);
            return res.sendStatus(200);
        }

        if (event.type === "call.transcription_failed") {
            meetingTrace("transcription.failed", { requestId, callCid: event.call_cid, sourceId: event.egress_id, hasProviderError: Boolean(event.error) });
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
                    where: { meetingId, sourceId: event.egress_id, status: { in: ["WAITING", "FAILED"] } },
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

        if (event.type === "call.session_started") {
            await prisma.meeting.updateMany({
                where: { meetingCode: getCallId(event.call_cid), startedAt: null },
                data: { startedAt: event.created_at }
            });
            meetingTrace("meeting.started", { requestId, callCid: event.call_cid });
            return res.sendStatus(200);
        }

        if (event.type === "call.ended") {
            await prisma.meeting.updateMany({
                where: { meetingCode: getCallId(event.call_cid), isComplete: false },
                data: { isComplete: true }
            });
            meetingTrace("meeting.completed", { requestId, callCid: event.call_cid, source: "call.ended" });
            return res.sendStatus(200);
        }

        if (event.type !== "call.session_ended") {
            meetingTrace("webhook.ignored", { requestId, type: event.type });
            return res.sendStatus(200);
        }

        const call = streamClient.video.call(event.call.type, event.call.id);
        const callResponse = await call.get();
        meetingTrace("session.ended", { requestId, callCid: event.call_cid, recordingStatus: callResponse.call.egress.individual_recording?.status, transcribing: callResponse.call.transcribing });
        // Ignore a delayed event belonging to an older session. Never stop a new session.
        const session = callResponse.call.session;
        if ((callResponse.call.current_session_id && callResponse.call.current_session_id !== event.session_id)
            || (session && session.id !== event.session_id)) {
            meetingTrace("session.stale_end_ignored", { requestId, callCid: event.call_cid });
            return res.sendStatus(200);
        }
        if (!callResponse.call.ended_at && session && !session.ended_at) {
            meetingTrace("session.active_end_ignored", { requestId, callCid: event.call_cid });
            return res.sendStatus(200);
        }
        await prisma.meeting.updateMany({
            where: { meetingCode: getCallId(event.call_cid), isComplete: false },
            data: { isComplete: true }
        });
        meetingTrace("meeting.completed", { requestId, callCid: event.call_cid, source: "session_ended" });
        const stopOperations: Promise<unknown>[] = [];

        if (callResponse.call.egress.individual_recording?.status === "active") {
            stopOperations.push(call.stopRecording({ recording_type: "individual" }));
        }
        if (callResponse.call.transcribing) {
            stopOperations.push(call.stopTranscription());
        }

        await Promise.all(stopOperations);
        meetingTrace("session.stop_finished", { requestId, callCid: event.call_cid, operations: stopOperations.length });
        return res.sendStatus(200);
    } catch (error) {
        meetingTrace("webhook.handler_failed", { requestId, type: event.type, callCid: "call_cid" in event ? event.call_cid : undefined, ...traceError(error) });
        return res.sendStatus(500);
    }
};
