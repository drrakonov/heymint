import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import { demoPayement } from '../controllers/payment.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validatePaymentInput } from '../middlewares/payment.middleware';

const router = express.Router();

router.post("/demo-payment", validatePaymentInput, authenticate, expressAsyncHandler(demoPayement));

export default router