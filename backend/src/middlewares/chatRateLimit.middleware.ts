import { rateLimit } from "express-rate-limit";
import { Request } from "express";

// Mounted after authenticate. All meetings share the user's budget on this API instance.
export const chatRateLimit = rateLimit({
    windowMs: 5 * 60 * 1000,
    limit: 15,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    keyGenerator: (req: Request) => (req as any).user.id,
    message: { success: false, status: "rate_limited", message: "Too many questions. Please wait a few minutes before asking again." },
});
