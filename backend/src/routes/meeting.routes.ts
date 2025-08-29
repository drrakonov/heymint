import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import { createGetStreamToken, deleteMeeting, getAllMeetings, handleMeetingSetup, isProtectedMeetingValidation } from '../controllers/meeting.controller';
import { authenticate, validateMeetingInput } from '../middlewares/auth.middleware';

const router = express.Router();


router.post("/token", authenticate, expressAsyncHandler(createGetStreamToken));
router.post("/setup-meeting", validateMeetingInput, authenticate, expressAsyncHandler(handleMeetingSetup));
router.get("/get-meetings", authenticate, expressAsyncHandler(getAllMeetings));
router.post("/delete-meeting", authenticate, expressAsyncHandler(deleteMeeting));
router.get("/get-isProtected", authenticate, expressAsyncHandler(isProtectedMeetingValidation));

export default router;