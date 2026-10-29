import { completeGoogleLogin, exchangeGoogleCode, oauthChallengeValid } from "../controllers/oauth.controller";
import express from "express";
import {
  login,
  refresh,
  logout,
  signup,
  setupOtp,
} from "../controllers/auth.controller";
import asyncHandler from 'express-async-handler'
import { validateLoginAuth, validateSignupAuth,  } from "../middlewares/auth.middleware";
import passport from "passport";
import limiter from "../middlewares/ratelimiter.middleware";


const router = express.Router();
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



router.get('/google', (req, res, next) => {
  const challenge = req.query.challenge;
  if (!oauthChallengeValid(challenge)) {
    res.redirect(`${frontendUrl}/auth/login?error=google`);
    return;
  }
  passport.authenticate('google', { scope: ['profile', 'email'], state: challenge })(req, res, next);
});
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${frontendUrl}/auth/login?error=google` }),
  asyncHandler(completeGoogleLogin)
);
router.post('/google/exchange', requireTrustedOrigin, limiter, asyncHandler(exchangeGoogleCode));

export default router;
