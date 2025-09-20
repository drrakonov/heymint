"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.demoPayement = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const demoPayement = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, meetingId } = req.body;
    try {
        if (!userId || !meetingId) {
            throw new Error("userId or meetindId not found");
        }
        const isAvail = yield prisma.meeting.findUnique({
            where: {
                id: meetingId,
            },
            select: {
                price: true,
                createdById: true
            }
        });
        if ((isAvail === null || isAvail === void 0 ? void 0 : isAvail.createdById) === userId) {
            return res.status(200).json({ success: true, message: "He is the owner!" });
        }
        if (!isAvail) {
            throw new Error("Meeting not found");
        }
        try {
            yield prisma.meetingPurchase.create({
                data: {
                    userId,
                    meetingId,
                    amountPaid: isAvail.price
                }
            });
            const tnxId = crypto.randomUUID();
            yield prisma.payment.create({
                data: {
                    userId,
                    meetingId,
                    tnxId,
                    status: 'succsess',
                }
            });
        }
        catch (err) {
            console.log("DB Error", err);
            throw new Error("DB Error");
        }
        res.status(200).json({ success: true, message: "Payment successfull" });
    }
    catch (err) {
        console.log("Payment failed", err);
        return res.status(500).json({ success: false, message: "Payment failed" });
    }
});
exports.demoPayement = demoPayement;
