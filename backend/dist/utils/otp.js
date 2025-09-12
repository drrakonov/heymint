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
exports.verifyOtp = exports.generateOtp = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const generateOtp = () => {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const n = array[0] % 1000000;
    return n.toString().padStart(6, "0");
};
exports.generateOtp = generateOtp;
const verifyOtp = (email, otp) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const record = yield prisma.otp.findFirst({ where: { email, code: otp } });
        if (!record)
            return false;
        if (record.expiresAt < new Date())
            return false;
        yield prisma.otp.delete({ where: { id: record.id } });
        return true;
    }
    catch (err) {
        console.log("Failed to verify OTP", err);
    }
});
exports.verifyOtp = verifyOtp;
