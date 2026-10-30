import { PrismaClient } from "@prisma/client";
import { getMeetingInsightAccess } from "../services/meetingInsightAccess.service";

import { meetingTrace, traceError } from "../utils/meetingTrace";

const prisma = new PrismaClient();
export const getMeetingSummary = async (req: any, res: any) => {
    try {
        const { id } = req.params; // this is the meetingCode
        const userId = req.user?.id;
        meetingTrace("insights.requested", { meetingCode: String(id), authenticated: Boolean(userId) });

        if (!userId) {
            return res.status(401).json({ success: false, message: "User is not authenticated" });
        }

        const access = await getMeetingInsightAccess(prisma, String(id), userId);

        meetingTrace("insights.access_checked", { meetingCode: String(id), found: Boolean(access), allowed: access?.canAccess });
        if (!access) {
            return res.status(404).json({ success: false, message: "Meeting not found" });
        }

        if (!access.canAccess) {
            return res.status(403).json({ success: false, message: "Only past participants can access these meeting insights" });
        }

        if (access.isExpired) {
            return res.status(410).json({ success: false, status: "expired", message: "This meeting expired without starting. There are no meeting insights." });
        }

        const insightData = await prisma.meeting.findUnique({
            where: { id: access.meeting.id },
            select: {
                summary: { select: { content: true } },
                transcriptionJobs: {
                    orderBy: { createdAt: "desc" },
                    select: { status: true, attempts: true }
                }
            }
        });

        const meetingDetails = access.meeting;

        const jobs = insightData?.transcriptionJobs || [];
        const maximumAttempts = Number(process.env.TRANSCRIPTION_WORKER_MAX_ATTEMPTS || 5);
        const pending = jobs.find(job => ["WAITING", "PENDING", "PROCESSING"].includes(job.status)
            || (job.status === "FAILED" && job.attempts < maximumAttempts));
        const failed = jobs.some(job => job.status === "FAILED" && job.attempts >= maximumAttempts);
        meetingTrace("insights.state", { meetingCode: String(id), meetingId: access.meeting.id,
            hasSummary: Boolean(insightData?.summary), jobs: jobs.length, pending: Boolean(pending), failed });
        // A silent or failed rejoin must not hide an earlier usable summary.
        if (!insightData?.summary || pending) {
            if (pending || !jobs.length) {
                return res.status(202).json({ success: false, status: pending?.status.toLowerCase() || "waiting_for_recording",
                    message: "Meeting insights are being generated", meeting: meetingDetails });
            }
            if (failed) {
                return res.status(500).json({ success: false, status: "failed",
                    message: "Meeting insights could not be generated", meeting: meetingDetails });
            }
            return res.status(200).json({ success: false, status: "no_speech",
                message: "No speech was detected in this meeting. Summary and chat are unavailable.", meeting: meetingDetails });
        }

        return res.status(200).json({ success: true, summary: insightData.summary.content, meeting: meetingDetails });
    } catch (err) {
        meetingTrace("insights.failed", { meetingCode: String(req.params.id), ...traceError(err) });
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
