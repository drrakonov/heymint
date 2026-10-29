import { isMeetingExpired } from "../utils/meetingLifecycle";
import { PrismaClient } from "@prisma/client";

export const getMeetingInsightAccess = async (
    prisma: PrismaClient,
    meetingCode: string,
    userId: string
) => {
    const meeting = await prisma.meeting.findUnique({
        where: { meetingCode },
        select: {
            id: true,
            title: true,
            startingTime: true,
            isProtected: true,
            isDeleted: true,
            isScheduled: true,
            startedAt: true,
            isComplete: true,
            createdById: true,
            participants: {
                where: { userId },
                take: 1,
                select: { id: true }
            }
        }
    });

    if (!meeting || meeting.isDeleted) {
        return null;
    }

    const canAccess = !meeting.isProtected
        || meeting.createdById === userId
        || meeting.participants.length > 0;

    return {
        canAccess,
        isExpired: isMeetingExpired(meeting),
        meeting: {
            id: meeting.id,
            title: meeting.title,
            startingTime: meeting.startingTime,
            isProtected: meeting.isProtected,
            createdById: meeting.createdById
        }
    };
};
