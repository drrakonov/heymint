import { Response, Request } from "express"
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export const getMeetingSummary = async (req: any, res: any) => {
    try {
        const { id } = req.params; // this is the meetingCode
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: "User is not authenticated" });
        }

        const meeting = await prisma.meeting.findUnique({
            where: { meetingCode: String(id) },
            select: {
                id: true,
                title: true,
                startingTime: true,
                isPaid: true,
                createdById: true,
                summary: { select: { content: true } },
                transcriptionJobs: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                    select: { status: true, attempts: true }
                },
                purchases: {
                    where: { userId },
                    take: 1,
                    select: { id: true }
                }
            }
        });

        if (!meeting) {
            return res.status(404).json({ success: false, message: "Meeting not found" });
        }

        if (meeting.isPaid && meeting.createdById !== userId && meeting.purchases.length === 0) {
            return res.status(403).json({ success: false, message: "You do not have access to these meeting insights" });
        }

        const meetingDetails = {
            id: meeting.id,
            title: meeting.title,
            startingTime: meeting.startingTime,
            isPaid: meeting.isPaid,
            createdById: meeting.createdById
        };

        const job = meeting.transcriptionJobs[0];

        if (!meeting.summary || (job && job.status !== "COMPLETED")) {
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

        return res.status(200).json({ success: true, summary: meeting.summary.content, meeting: meetingDetails });
    } catch (err) {
        console.error("Failed to fetch summary:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
