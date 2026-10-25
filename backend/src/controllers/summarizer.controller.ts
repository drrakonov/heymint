import { PrismaClient } from "@prisma/client";
import { getMeetingInsightAccess } from "../services/meetingInsightAccess.service";

const prisma = new PrismaClient();
export const getMeetingSummary = async (req: any, res: any) => {
    try {
        const { id } = req.params; // this is the meetingCode
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: "User is not authenticated" });
        }

        const access = await getMeetingInsightAccess(prisma, String(id), userId);

        if (!access) {
            return res.status(404).json({ success: false, message: "Meeting not found" });
        }

        if (!access.canAccess) {
            return res.status(403).json({ success: false, message: "Only past participants can access these meeting insights" });
        }

        const insightData = await prisma.meeting.findUnique({
            where: { id: access.meeting.id },
            select: {
                summary: { select: { content: true } },
                transcriptionJobs: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                    select: { status: true, attempts: true }
                }
            }
        });

        const meetingDetails = access.meeting;

        const job = insightData?.transcriptionJobs[0];

        if (!insightData?.summary || (job && job.status !== "COMPLETED")) {
            const maximumAttempts = Number(process.env.TRANSCRIPTION_WORKER_MAX_ATTEMPTS || 5);
            const hasPermanentlyFailed = job?.status === "FAILED" && job.attempts >= maximumAttempts;

            if (hasPermanentlyFailed) {
                return res.status(500).json({
                    success: false,
                    status: "failed",
                    message: "Meeting insights could not be generated",
                    meeting: meetingDetails
                });
            }

            return res.status(202).json({
                success: false,
                status: job?.status?.toLowerCase() || "waiting_for_recording",
                message: "Meeting insights are being generated",
                meeting: meetingDetails
            });
        }

        return res.status(200).json({ success: true, summary: insightData.summary.content, meeting: meetingDetails });
    } catch (err) {
        console.error("Failed to fetch summary:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
