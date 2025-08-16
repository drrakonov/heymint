import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import { createGetStreamToken } from '../controllers/meeting.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = express.Router();


router.post("/token", authenticate, expressAsyncHandler(createGetStreamToken));

export default router;