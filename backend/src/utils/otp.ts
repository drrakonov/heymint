import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const generateOtp = () => {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const n = array[0] % 1_000_000;
    return n.toString().padStart(6, "0");
}

export const verifyOtp = async (email: string, otp: string) => {
    try {
        const record = await prisma.otp.findFirst({ where: { email, code: otp } });
        if (!record) return false;

        if (record.expiresAt < new Date())
            return false;
        await prisma.otp.delete({ where: { id: record.id } });
        
        return true;
    } catch (err) {
        console.log("Failed to verify OTP", err);
    }
}
