import { Response, Request, NextFunction } from "express"
import jwt from 'jsonwebtoken'

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
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