import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express"
import bcrypt from 'bcrypt'
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/jwt";




const setRefreshToken = (res: Response, token: string) => {
    res.cookie(process.env.COOKIE_NAME || "refreshToken", token, {
        httpOnly: true,
        secure: process.env.COOKIE_SECURE === "true",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
};




const prisma = new PrismaClient();

export const signup = async (req: Request, res: Response): Promise<any> => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "All fields are required"
        });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        return res.status(409).json({
            message: "User already exists"
        })
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
        data: { name: "user", email, password: hashedPassword }
    })

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    await prisma.refreshToken.create({
        data: {
            token: refreshToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
    });

    setRefreshToken(res, refreshToken);
    res.status(201).json({ accessToken, message: "You are signed in" });

}


export const login = async (req: Request, res: Response): Promise<any> => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "All fields are required"
        });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatched = await bcrypt.compare(password, user.password);
    if (!isMatched) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    await prisma.refreshToken.create({
        data: {
            token: refreshToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
    });

    setRefreshToken(res, refreshToken);
    res.status(200).json({ accessToken, message: "You are loggedin" });
}



export const refresh = async (req: Request, res: Response): Promise<any> => {
    const token = req.cookies?.[process.env.COOKIE_NAME || "refreshToken"];
    if (!token) {
        return res.status(401).json({ message: "token not found" });
    }

    try {

        const decoded = verifyRefreshToken(token) as { userId: string };
        const exists = await prisma.refreshToken.findUnique({ where: { token } });
        if (!exists || exists.expiresAt < new Date()) {
            return res.status(403).json({ message: "Invalid refresh token" });
        }

        const accessToken = generateAccessToken(decoded.userId);
        const newRefreshToken = generateRefreshToken(decoded.userId);
        try {
            await prisma.refreshToken.delete({ where: { token } });
            await prisma.refreshToken.create({
                data: {
                    token: newRefreshToken,
                    userId: decoded.userId,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                },
            });
        } catch (err) {
            res.status(500).json({ message: "Error modifying refresh token" })
        }

        setRefreshToken(res, newRefreshToken);
        res.status(200).json({ accessToken, message: "token refreshed..." })

    } catch (err) {
        res.status(403).json({ message: "Invalid refresh token" })
    }

}

export const logout = async (req: Request, res: Response): Promise<any> => {
    const token = req.cookies?.[process.env.COOKIE_NAME || "refreshToken"];
    if (token) {
        await prisma.refreshToken.deleteMany({ where: { token } });
    }

    res.clearCookie(process.env.COOKIE_NAME || "refreshToken");
    res.status(200).json({ message: "Logged out" });

}