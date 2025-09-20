import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';


const paymentSchema = z.object({
    userId: z.uuid("Invalid user ID"),
    meetingId: z.uuid("Invalid meeting ID")
});

export const validatePaymentInput = (req: Request, res: Response, next: NextFunction): any => {
    try {
        paymentSchema.parse(req.body);
        next();
    }catch(err) {
        return res.status(400).json({ sucess: false, message: "Validation error" })
    }
}