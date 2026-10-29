import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";
import { setRefreshToken } from "./auth.controller";

const prisma = new PrismaClient();
const hash = (value: string) => createHash("sha256").update(value).digest("base64url");
export const oauthChallengeValid = (value: unknown): value is string => typeof value === "string" && /^[A-Za-z0-9_-]{43}$/.test(value);

// Store a short-lived, hashed handoff in the existing token table. It is not a JWT.
export async function completeGoogleLogin(req: Request, res: Response) {
    const frontend = (process.env.CORS_ORIGIN || "http://localhost:5173").replace(/\/$/, "");
    const challenge = req.query.state;
    if (!oauthChallengeValid(challenge)) {
        res.redirect(`${frontend}/auth/login?error=google`);
        return;
    }
    const code = randomBytes(32).toString("base64url");
    await prisma.refreshToken.create({ data: {
        token: `oauth:${hash(code)}:${challenge}`,
        userId: (req.user as { id: string }).id,
        expiresAt: new Date(Date.now() + 120_000),
    }});
    res.setHeader("Cache-Control", "no-store");
    res.redirect(`${frontend}/auth/callback#code=${code}`);
}

export async function exchangeGoogleCode(req: Request, res: Response): Promise<any> {
    const { code, verifier } = req.body;
    if (!oauthChallengeValid(code) || !oauthChallengeValid(verifier)) {
        return res.status(400).json({ message: "Restart Google sign-in." });
    }
    const challenge = hash(verifier);
    const key = `oauth:${hash(code)}:${challenge}`;
    const result = await prisma.$transaction(async tx => {
        const handoff = await tx.refreshToken.findUnique({ where: { token: key } });
        if (!handoff || handoff.expiresAt <= new Date()) return null;
        if (!timingSafeEqual(Buffer.from(handoff.token.split(":")[2]), Buffer.from(challenge))) return null;
        const consumed = await tx.refreshToken.deleteMany({ where: { id: handoff.id, expiresAt: { gt: new Date() } } });
        if (consumed.count !== 1) return null;
        const refreshToken = generateRefreshToken(handoff.userId);
        await tx.refreshToken.create({ data: { token: refreshToken, userId: handoff.userId, expiresAt: new Date(Date.now() + 7 * 86400_000) } });
        return { refreshToken, accessToken: generateAccessToken(handoff.userId) };
    });
    if (!result) return res.status(401).json({ message: "Google sign-in expired or was already used. Please restart it." });
    setRefreshToken(res, result.refreshToken);
    res.setHeader("Cache-Control", "no-store");
    return res.json({ accessToken: result.accessToken });
}
