import { z } from 'zod';

export const meetingInputType = z.object({
    title: z.string().min(2, "title must contain atleast two characters").max(500, "title can have only 500 characters maximum"),
    description: z.string().max(100, "description can have only 1000 characters maximum"),
    isScheduled: z.boolean(),
    isPaid: z.boolean(),
    isProtected: z.boolean(),
    startingTime: z.coerce.date(),
    price: z.number(),
    createdBy: z.uuid(),
    password: z.string().max(30),
    meetingCode: z.string()
});

export type Meeting = {
    title: string
    hostName: string
    description: string
    type: "Free" | "Paid"
    isProtected: boolean
    price?: number
    meetingTime?: string
    isInstant?: boolean
    participantCount?: number
}

export type Bookings = {
  meetingId: string,
  title: string
  hostName: string
  description: string
  price: number
  isProtected: boolean
  meetingTime: string
  isInstant: boolean
  meetingCode: string
  createdById: string
}