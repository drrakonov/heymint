import { parseStreamSpeech } from "../utils/parseStreamTranscript";
require("dotenv").config();

import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
import { generateAndStoreMeetingSummary } from "../services/meetingSummary.service";

import { meetingTrace, traceError, traceRuntime } from "../utils/meetingTrace";

const prisma = new PrismaClient();

const pollIntervalMs = Number(process.env.TRANSCRIPTION_WORKER_POLL_MS || 5000);
const maxAttempts = Number(process.env.TRANSCRIPTION_WORKER_MAX_ATTEMPTS || 5);
const leaseDurationMs = Number(process.env.TRANSCRIPTION_WORKER_LEASE_MS || 300000);
const heartbeatIntervalMs = Math.max(10000, Math.floor(leaseDurationMs / 3));
const downloadTimeoutMs = Number(process.env.TRANSCRIPTION_DOWNLOAD_TIMEOUT_MS || 60000);

type TranscriptionJobRow = {
    id: string;
    meetingId: string;
    sessionId: string;
    transcriptionUrl: string;
    attempts: number;
    leaseToken: string;
};

type ParsedSegment = {
    sequence: number;
    sessionId: string;
    speakerId: string;
    speakerName: string | null;
    startedAt: Date;
    endedAt: Date;
    startMs: number;
    endMs: number;
    text: string;
};

const delay = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const getErrorMessage = (error: unknown) => {
    if (error instanceof Error) return `${error.name}: ${error.message}`;
    return String(error);
};

const validateConfiguration = () => {
    const values = [pollIntervalMs, maxAttempts, leaseDurationMs, downloadTimeoutMs];
    if (values.some((value) => !Number.isFinite(value) || value <= 0)) {
        throw new Error("Transcription worker timing and retry settings must be positive numbers");
    }
};

const claimNextJob = async (): Promise<TranscriptionJobRow | null> => {
    const leaseToken = randomUUID();
    const leaseExpiresAt = new Date(Date.now() + leaseDurationMs);

    const rows = await prisma.$queryRaw<TranscriptionJobRow[]>`
        WITH next_job AS (
            SELECT id
            FROM "TranscriptionJob"
            WHERE attempts < ${maxAttempts}
              AND "transcriptionUrl" IS NOT NULL
              AND "sessionId" IS NOT NULL
              AND (
                (status IN ('PENDING', 'FAILED') AND "availableAt" <= NOW())
                OR (status = 'PROCESSING' AND "leaseExpiresAt" < NOW())
              )
            ORDER BY "availableAt" ASC, "createdAt" ASC
            FOR UPDATE SKIP LOCKED
            LIMIT 1
        )
        UPDATE "TranscriptionJob" AS job
        SET status = 'PROCESSING',
            attempts = job.attempts + 1,
            "leaseToken" = ${leaseToken},
            "leaseExpiresAt" = ${leaseExpiresAt},
            "lastError" = NULL,
            "updatedAt" = NOW()
        FROM next_job
        WHERE job.id = next_job.id
        RETURNING job.id,
                  job."meetingId",
                  job."sessionId",
                  job."transcriptionUrl",
                  job.attempts,
                  job."leaseToken"
    `;

    return rows[0] ?? null;
};

const renewLease = async (job: TranscriptionJobRow) => {
    const result = await prisma.transcriptionJob.updateMany({
        where: { id: job.id, status: "PROCESSING", leaseToken: job.leaseToken },
        data: { leaseExpiresAt: new Date(Date.now() + leaseDurationMs) }
    });

    if (result.count !== 1) throw new Error(`Lease lost for transcription job ${job.id}`);
};

const downloadTranscript = async (url: string) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), downloadTimeoutMs);

    try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
            throw new Error(`Unable to download Stream transcript (${response.status} ${response.statusText})`);
        }
        return await response.text();
    } finally {
        clearTimeout(timeout);
    }
};

const parseTranscript = async (job: TranscriptionJobRow, rawTranscript: string): Promise<ParsedSegment[]> => {
    const meeting = await prisma.meeting.findUnique({
        where: { id: job.meetingId },
        select: { startingTime: true, createdAt: true }
    });
    const baseTime = (meeting?.startingTime || meeting?.createdAt || new Date()).getTime();

    const speech = parseStreamSpeech(rawTranscript, baseTime);
    if (!speech.length) return [];

    const speakerIds = [...new Set(speech.map((line) => line.speaker_id))];
    const users = await prisma.user.findMany({
        where: { id: { in: speakerIds } },
        select: { id: true, name: true }
    });
    const speakerNames = new Map(users.map((user) => [user.id, user.name]));
    const transcriptStartedAt = speech[0].startedAt.getTime();

    return speech.map((line, sequence) => ({
        sequence,
        sessionId: job.sessionId,
        speakerId: line.speaker_id,
        speakerName: speakerNames.get(line.speaker_id) ?? null,
        startedAt: line.startedAt,
        endedAt: line.endedAt,
        startMs: Math.max(0, line.startedAt.getTime() - transcriptStartedAt),
        endMs: Math.max(0, line.endedAt.getTime() - transcriptStartedAt),
        text: line.text!.trim()
    }));
};

const formatElapsedTime = (milliseconds: number) => {
    const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
};

export const processJob = async (job: TranscriptionJobRow) => {
    const trace = { jobId: job.id, meetingId: job.meetingId, sessionId: job.sessionId, attempt: job.attempts };
    meetingTrace("worker.download_started", trace);
    const rawTranscript = await downloadTranscript(job.transcriptionUrl);
    meetingTrace("worker.download_finished", { ...trace, characters: rawTranscript.length });
    const segments = await parseTranscript(job, rawTranscript);
    meetingTrace("worker.transcript_parsed", { ...trace, segments: segments.length });
    await renewLease(job);
    if (!segments.length) {
        const completed = await prisma.transcriptionJob.updateMany({
            where: { id: job.id, status: "PROCESSING", leaseToken: job.leaseToken },
            data: { status: "COMPLETED", leaseToken: null, leaseExpiresAt: null, lastError: null }
        });
        if (completed.count !== 1) throw new Error(`Lease lost before completing transcription job ${job.id}`);
        meetingTrace("worker.no_speech", { ...trace, outcome: "COMPLETED", retry: false });
        return;
    }

    await prisma.$transaction(async (transaction) => {
        await transaction.transcriptSegment.deleteMany({ where: { transcriptionJobId: job.id } });
        await transaction.transcriptSegment.createMany({
            data: segments.map((segment) => ({
                ...segment,
                meetingId: job.meetingId,
                transcriptionJobId: job.id
            }))
        });
    });

    meetingTrace("worker.segments_stored", { ...trace, segments: segments.length });
    const meetingSegments = await prisma.transcriptSegment.findMany({
        where: { meetingId: job.meetingId },
        orderBy: [{ startedAt: "asc" }, { sequence: "asc" }]
    });
    const meetingStartedAt = meetingSegments[0]?.startedAt.getTime();
    if (meetingStartedAt === undefined) throw new Error("Meeting transcript is empty after persistence");

    const formattedTranscript = meetingSegments.map((segment) => {
        const startMs = segment.startedAt.getTime() - meetingStartedAt;
        const endMs = segment.endedAt.getTime() - meetingStartedAt;
        const speaker = segment.speakerName || segment.speakerId;
        return `[${formatElapsedTime(startMs)} - ${formatElapsedTime(endMs)}] ${speaker}: ${segment.text}`;
    }).join("\n");

    await renewLease(job);
    meetingTrace("worker.summary_started", trace);
    await generateAndStoreMeetingSummary(job.meetingId, formattedTranscript);
    meetingTrace("worker.summary_and_index_finished", trace);

    const completed = await prisma.transcriptionJob.updateMany({
        where: { id: job.id, status: "PROCESSING", leaseToken: job.leaseToken },
        data: {
            status: "COMPLETED",
            leaseToken: null,
            leaseExpiresAt: null,
            lastError: null
        }
    });
    meetingTrace("worker.completion_update", { ...trace, updatedRows: completed.count });
    if (completed.count !== 1) throw new Error(`Lease lost before completing transcription job ${job.id}`);
};

const markFailed = async (job: TranscriptionJobRow, error: unknown) => {
    const retryDelayMinutes = Math.min(60, 2 ** Math.max(0, job.attempts - 1));
    const updated = await prisma.transcriptionJob.updateMany({
        where: { id: job.id, leaseToken: job.leaseToken },
        data: {
            status: "FAILED",
            leaseToken: null,
            leaseExpiresAt: null,
            lastError: getErrorMessage(error).slice(0, 4000),
            availableAt: new Date(Date.now() + retryDelayMinutes * 60_000)
        }
    });
    meetingTrace("worker.failure_saved", { jobId: job.id, meetingId: job.meetingId, updatedRows: updated.count, attempt: job.attempts, willRetry: job.attempts < maxAttempts, retryDelayMinutes });
};

let stopping = false;
const stop = () => { stopping = true; meetingTrace("worker.stopping"); };


const main = async () => {
    validateConfiguration();
    traceRuntime("worker");
    meetingTrace("worker.started", { pollIntervalMs, maxAttempts, leaseDurationMs, downloadTimeoutMs });
    let lastIdleLog = 0;

    while (!stopping) {
        const job = await claimNextJob();
        if (!job) {
            if (Date.now() - lastIdleLog >= 60_000) {
                meetingTrace("worker.idle", { reason: "no_claimable_job" });
                lastIdleLog = Date.now();
            }
            await delay(pollIntervalMs);
            continue;
        }

        const heartbeat = setInterval(() => {
            void renewLease(job).catch((error) => meetingTrace("worker.lease_renewal_failed", { jobId: job.id, ...traceError(error) }));
        }, heartbeatIntervalMs);
        heartbeat.unref();

        try {
            meetingTrace("worker.job_claimed", { jobId: job.id, meetingId: job.meetingId, sessionId: job.sessionId, attempt: job.attempts });
            await processJob(job);
            meetingTrace("worker.job_completed", { jobId: job.id, meetingId: job.meetingId });
        } catch (error) {
            meetingTrace("worker.job_failed", { jobId: job.id, meetingId: job.meetingId, attempt: job.attempts, ...traceError(error) });
            await markFailed(job, error);
        } finally {
            clearInterval(heartbeat);
        }
    }
};

if (require.main === module) {
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
main()
    .catch((error) => {
        meetingTrace("worker.fatal", traceError(error));
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

}
