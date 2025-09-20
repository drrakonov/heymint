import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

export const demoPayement = async (req: Request, res: Response): Promise<any> => {
    const { userId, meetingId } = req.body;
    try {
        if (!userId || !meetingId) {
            throw new Error("userId or meetindId not found");
        }

        const isAvail = await prisma.meeting.findUnique({
            where: {
                id: meetingId,

            },
            select: {
                price: true,
                createdById: true
            }
        });

        if(isAvail?.createdById === userId) {
            return res.status(200).json({ success: true, message: "He is the owner!" })
        }

        if (!isAvail) {
            throw new Error("Meeting not found");
        }

        try {
            await prisma.meetingPurchase.create({
                data: {
                    userId,
                    meetingId,
                    amountPaid: isAvail.price
                }
            });

            const tnxId = crypto.randomUUID();

            await prisma.payment.create({
                data: {
                    userId,
                    meetingId,
                    tnxId,
                    status: 'succsess',
                }
            });

        } catch (err) {
            console.log("DB Error", err);
            throw new Error("DB Error");
        }


        res.status(200).json({ success: true, message: "Payment successfull" });


    } catch (err) {
        console.log("Payment failed", err);
        return res.status(500).json({ success: false, message: "Payment failed" });
    }
}
