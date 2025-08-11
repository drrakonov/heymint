import express, { Request, Response } from "express";
import {
  login,
  refresh,
  logout,
  signup,
  setRefreshToken,
} from "../controllers/auth.controller";
import asyncHandler from 'express-async-handler'
import { authenticate, validateAuth } from "../middlewares/auth.middleware";
import passport from "passport";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";
import { PrismaClient } from "@prisma/client"


const router = express.Router();
const prisma = new PrismaClient();

router.post("/signup", validateAuth, asyncHandler(signup));
router.post("/login", validateAuth, asyncHandler(login));
router.post("/refresh", asyncHandler(refresh));
router.post("/logout", authenticate, asyncHandler(logout));



router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));


router.get('/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: "/auth/login" }),
  async (req: Request, res: Response) => {
    const user = req.user as any;

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
    res.redirect(`${process.env.CORS_ORIGIN}/?access=${accessToken}`);
  }
)

export default router;
