import express from "express";
import { authenticate, validateUpdateProfile } from "../middlewares/auth.middleware";
import expressAsyncHandler from "express-async-handler";
import { getUserInfo, updateUserProfile } from "../controllers/user.controller";

const router = express.Router();

router.get("/me", authenticate, expressAsyncHandler(getUserInfo));
router.post("/update-user", validateUpdateProfile, expressAsyncHandler(updateUserProfile))

export default router;
