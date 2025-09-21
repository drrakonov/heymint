import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import { demoPayement } from '../controllers/payment.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validatePaymentInput } from '../middlewares/payment.middleware';
import { getAllPayments } from '../controllers/meeting.controller';
import limiter from '../middlewares/ratelimiter.middleware';

const router = express.Router();

router.post("/demo-payment", limiter, validatePaymentInput, authenticate, expressAsyncHandler(demoPayement));
router.get("/get-payments", authenticate, expressAsyncHandler(getAllPayments));

export default router