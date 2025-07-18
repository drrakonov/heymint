import { Response, Request, NextFunction } from "express"
import jwt from 'jsonwebtoken'
import { z } from "zod"


const authSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6, "Password must be atleast 6 characters")
});

export const validateAuth = (req: Request, res: Response, next: NextFunction): any => {
    try {
        authSchema.parse(req.body);
        next();
    }catch(err) {
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

        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as {
            userId: string
        };
        (req as any).userId = decoded.userId;
        next();

    }catch(err) {
        res.status(401).json({ message: "Invalid token" })
    }

}