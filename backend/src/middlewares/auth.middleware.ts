import { Response, Request, NextFunction } from "express"
import jwt, { JwtPayload } from 'jsonwebtoken'
import { z } from "zod"
import { meetingInputType } from "../utils/Types";


const authSignInSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6, "Password must be atleast 6 characters"),
    otp: z.string().max(6)
});
const authLoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6, "Password must be atleast 6 characters"),
});

const updateProfile = z.object({
    newName: z.string()
        .max(20, "Username must be less than 10 characters")
        .min(3, "Username must be atleast 3 characters"),
    id: z.string().uuid("Invalid user ID")

})

export const validateMeetingInput = (req: Request, res: Response, next: NextFunction): any => {
    try {
        meetingInputType.parse(req.body);
        next();
    }catch(err) {
        return res.status(400).json({ success: false, message: "Validation error" })
    }
}

export const validateSignupAuth = (req: Request, res: Response, next: NextFunction): any => {
    try {
        authSignInSchema.parse(req.body);
        next();
    } catch (err) {
        if (typeof err === "object" && err !== null && "errors" in err && Array.isArray((err as any).errors)) {
            return res.status(400).json({ message: (err as any).errors[0].message });
        }
        return res.status(400).json({ message: "Validation error" });
    }
}
export const validateLoginAuth = (req: Request, res: Response, next: NextFunction): any => {
    try {
        authLoginSchema.parse(req.body);
        next();
    } catch (err) {
        if (typeof err === "object" && err !== null && "errors" in err && Array.isArray((err as any).errors)) {
            return res.status(400).json({ message: (err as any).errors[0].message });
        }
        return res.status(400).json({ message: "Validation error" });
    }
}

export const validateUpdateProfile = (req: Request, res: Response, next: NextFunction): any => {
    try {
        updateProfile.parse(req.body);
        next();
    } catch (err) {
        if (typeof err === "object" && err !== null && "errors" in err && Array.isArray((err as any).errors)) {
            return res.status(400).json({ message: (err as any).errors[0].message });
        }
        return res.status(400).json({ message: "Validation error" });
    }
}

export const authenticate = (req: Request, res: Response, next: NextFunction): any => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token" });
    }

    const token = auth.split(" ")[1];
    try {

        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as JwtPayload
        req.user = { id: decoded.userId };
        next();

    } catch (err) {
        res.status(401).json({ message: "Invalid token" })
    }
}