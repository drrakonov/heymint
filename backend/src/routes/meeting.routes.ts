import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import { createGetStreamToken, deleteMeeting, getAllBookedMeetings, getAllMeetings, handleMeetingSetup, isProtectedMeetingValidation, startMeetingRecording, stopMeetingRecording, validateJoinAccess, validateProtectedPassword } from '../controllers/meeting.controller';
import { authenticate, validateMeetingInput } from '../middlewares/auth.middleware';
import { getMeetingSummary } from '../controllers/summarizer.controller';
import { handleSummaryChat } from "../controllers/chat.controller"

const router = express.Router();

router.post("/token", authenticate, expressAsyncHandler(createGetStreamToken));
router.post("/setup-meeting", validateMeetingInput, authenticate, expressAsyncHandler(handleMeetingSetup));
router.get("/get-meetings", authenticate, expressAsyncHandler(getAllMeetings));
router.get("/get-booked-meetings", authenticate, expressAsyncHandler(getAllBookedMeetings));
router.post("/delete-meeting", authenticate, expressAsyncHandler(deleteMeeting));
router.get("/get-isProtected", authenticate, expressAsyncHandler(isProtectedMeetingValidation));
router.post("/get-meeting-validation", authenticate, expressAsyncHandler(validateProtectedPassword));
router.get("/validate-access", authenticate, expressAsyncHandler(validateJoinAccess))


//Meeting Summary Routes
router.get("/summary/:id", authenticate, expressAsyncHandler(getMeetingSummary));
router.post("/chat/:id", authenticate, expressAsyncHandler(handleSummaryChat));

//Meeting Recording Routes
router.post("/:meetingCode/recording/start", authenticate, expressAsyncHandler(startMeetingRecording));
router.post("/:meetingCode/recording/stop", authenticate, expressAsyncHandler(stopMeetingRecording));

export default router;
