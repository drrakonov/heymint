import express from "express";
import { authenticate, validateUpdateProfile } from "../middlewares/auth.middleware";
import expressAsyncHandler from "express-async-handler";
import { getAllMeetingToDashboard, getDashboardStats, getUserInfo, updateUserProfile } from "../controllers/user.controller";

const router = express.Router();

router.get("/me", authenticate, expressAsyncHandler(getUserInfo));
router.post("/update-user", validateUpdateProfile, expressAsyncHandler(updateUserProfile))
router.get("/get-dashboard-stats", authenticate, expressAsyncHandler(getDashboardStats));
router.get("/get-dashboard-allmeetings", authenticate, expressAsyncHandler(getAllMeetingToDashboard));

export default router;
