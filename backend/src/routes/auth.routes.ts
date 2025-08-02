import express from "express";
import {
  login,
  refresh,
  logout,
  signup,
} from "../controllers/auth.controller";
import asyncHandler from 'express-async-handler'
import { authenticate, validateAuth } from "../middlewares/auth.middleware";

const router = express.Router();


router.post("/signup", validateAuth, asyncHandler(signup));
router.post("/login", validateAuth, asyncHandler(login));
router.post("/refresh", authenticate, asyncHandler(refresh));
router.post("/logout", asyncHandler(logout));

export default router;
