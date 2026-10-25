import { z } from 'zod';

export const meetingInputType = z.object({
  title: z.string().min(2, "title must contain atleast two characters").max(500, "title can have only 500 characters maximum"),
  description: z.string().max(100, "description can have only 1000 characters maximum"),
  isScheduled: z.boolean(),
  isProtected: z.boolean(),
  startingTime: z.coerce.date(),
  createdBy: z.uuid(),
  password: z.string().max(30).optional(),
  meetingCode: z.string()
}).superRefine((meeting, context) => {
  if (meeting.isProtected && (!meeting.password || meeting.password.length < 2)) {
    context.addIssue({
      code: "custom",
      path: ["password"],
      message: "Protected meetings require a password"
    });
  }
});

export type Meeting = {
  meetingId: string
  title: string
  hostName: string
  description: string
  type: "Free" | "Protected"
  isProtected: boolean
  meetingTime?: string
  isInstant?: boolean
  participantCount?: number
  meetingCode: string
  createdById: string
  isComplete: boolean
  canAccessInsights: boolean
}

export type DashboardStats = {
  protectedMeetings: number
  totalMeetings: number
  myTotalMeetings: number
  completedMeetings: number
  activeUsers: number
}

export type DashboardMyMeetings = {
  id: string
  type: "protected" | "free"
  title: string
}
