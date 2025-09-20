"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePaymentInput = void 0;
const zod_1 = require("zod");
const paymentSchema = zod_1.z.object({
    userId: zod_1.z.uuid("Invalid user ID"),
    meetingId: zod_1.z.uuid("Invalid meeting ID")
});
const validatePaymentInput = (req, res, next) => {
    try {
        paymentSchema.parse(req.body);
        next();
    }
    catch (err) {
        return res.status(400).json({ sucess: false, message: "Validation error" });
    }
};
exports.validatePaymentInput = validatePaymentInput;
