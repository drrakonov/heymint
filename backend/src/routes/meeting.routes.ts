import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import { createGetStreamToken, handleMeetingSetup } from '../controllers/meeting.controller';
import { authenticate, validateMeetingInput } from '../middlewares/auth.middleware';

const router = express.Router();


router.post("/token", authenticate, expressAsyncHandler(createGetStreamToken));
router.post("/setup-meeting", validateMeetingInput, authenticate, expressAsyncHandler(handleMeetingSetup));

export default router;