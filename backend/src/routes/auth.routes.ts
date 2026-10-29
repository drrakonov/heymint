import express, { Request, Response } from "express";
import {
  login,
  refresh,
  logout,
  signup,
  setRefreshToken,
  setupOtp,
} from "../controllers/auth.controller";
import asyncHandler from 'express-async-handler'
import { validateLoginAuth, validateSignupAuth,  } from "../middlewares/auth.middleware";
import passport from "passport";
import { generateRefreshToken } from "../utils/jwt";
import { PrismaClient } from "@prisma/client"
import limiter from "../middlewares/ratelimiter.middleware";


const router = express.Router();
const prisma = new PrismaClient();
const frontendUrl = (process.env.CORS_ORIGIN || "http://localhost:5173").replace(/\/$/, "");
// CORS alone does not prevent cross-site cookie-authenticated mutations.
const requireTrustedOrigin: express.RequestHandler = (req, res, next) => {
  const origin = req.get("origin");
  if (origin && origin !== frontendUrl) {
    res.status(403).json({ message: "Untrusted request origin" });
    return;
  }
  next();
};

router.post("/signup", validateSignupAuth, asyncHandler(signup));
router.post("/send-otp",limiter, asyncHandler(setupOtp));
router.post("/login", validateLoginAuth, asyncHandler(login));
router.post("/refresh", requireTrustedOrigin, limiter, asyncHandler(refresh));
router.post("/logout", requireTrustedOrigin, asyncHandler(logout));



router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));


router.get('/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: `${frontendUrl}/auth/login?error=google` }),
  async (req: Request, res: Response) => {
    const user = req.user as any;

    const refreshToken = generateRefreshToken(user.id);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    setRefreshToken(res, refreshToken);
    res.redirect(`${frontendUrl}/auth/callback`);
  }
)

export default router;
