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
            createdById: true,
            participants: {
                where: { userId },
                take: 1,
                select: { id: true }
            }
        }
    });

    if (!meeting) {
        return null;
    }

    const canAccess = !meeting.isProtected
        || meeting.createdById === userId
        || meeting.participants.length > 0;

    return {
        canAccess,
        meeting: {
            id: meeting.id,
            title: meeting.title,
            startingTime: meeting.startingTime,
            isProtected: meeting.isProtected,
            createdById: meeting.createdById
        }
    };
};
