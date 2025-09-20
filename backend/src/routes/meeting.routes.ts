import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import { createGetStreamToken, deleteMeeting, getAllBookedMeetings, getAllMeetings, handleMeetingSetup, isProtectedMeetingValidation, validateJoinAccess, validateProtectedPassword } from '../controllers/meeting.controller';
import { authenticate, validateMeetingInput } from '../middlewares/auth.middleware';

const router = express.Router();


router.post("/token", authenticate, expressAsyncHandler(createGetStreamToken));
router.post("/setup-meeting", validateMeetingInput, authenticate, expressAsyncHandler(handleMeetingSetup));
router.get("/get-meetings", authenticate, expressAsyncHandler(getAllMeetings));
router.get("/get-booked-meetings", authenticate, expressAsyncHandler(getAllBookedMeetings));
router.post("/delete-meeting", authenticate, expressAsyncHandler(deleteMeeting));
router.get("/get-isProtected", authenticate, expressAsyncHandler(isProtectedMeetingValidation));
router.post("/get-meeting-validation", authenticate, expressAsyncHandler(validateProtectedPassword));
router.get("/validate-access", authenticate, expressAsyncHandler(validateJoinAccess))

export default router;