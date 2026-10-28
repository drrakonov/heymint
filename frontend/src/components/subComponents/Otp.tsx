import { useAuth } from "@/context/AuthContext";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "../ui/input-otp";
import { AuthBotton } from "./AuthButton";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import axios from "axios";

interface OtpTimerProps {
    expiryMinutes: number;
    onExpire: () => void;
    resetKey: number;
}

const OtpTimer = ({ expiryMinutes, onExpire, resetKey }: OtpTimerProps) => {
    const [timeLeft, setTimeLeft] = useState(expiryMinutes * 60);

    useEffect(() => {
        setTimeLeft(expiryMinutes * 60);
    }, [resetKey, expiryMinutes]);

    useEffect(() => {
        if (timeLeft <= 0) {
            onExpire();
            return;
        }

        const interval = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [timeLeft, onExpire]);

    if (timeLeft <= 0) return null;

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
        <p className="pt-3 text-xs text-text-secondary">
            Code expires in{" "}
            <span className="font-semibold">
                {minutes}:{seconds.toString().padStart(2, "0")}
            </span>
        </p>
    );
};

const Otp = ({ email, password }: { email: string; password: string }) => {
    const { signup } = useAuth();
    const navigate = useNavigate();
    const [otp, setOtp] = useState("");
    const [resetKey, setResetKey] = useState(0);
    const [expired, setExpired] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleOtpVerificaton = async () => {
        if (otp.length !== 6 || isSubmitting) {
            if (otp.length !== 6) toast.error("Enter the complete six-digit code");
            return;
        }
        setIsSubmitting(true);
        try {
            const success = await signup(email, password, otp);
            if (success) navigate("/dashboard");
        } catch (err) {
            console.log("Failed to signup", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const resendOtp = async () => {
        try {
            if (email === "" || password == "") {
                toast.error("Try again!");
                navigate("/auth/signup");
                return;
            }
            const res = await api.post("/api/auth/send-otp", {
                email
            });
            if (res.data.success) {
                setExpired(false);
                setResetKey((prev) => prev + 1);
            }else {
                toast.error("Try again");
                navigate("/auth/signup");
            }
        } catch (error: unknown) {
            if (axios.isAxiosError(error) && error.response?.status === 409) {
                toast.error("An account with this email already exists");
            }
            console.error("Failed to resend OTP", error);
        }
    };

    return (
        <div className="liquid-glass flex w-full flex-col items-center justify-center rounded-[28px] p-6 text-center sm:p-8">
            <span className="eyebrow">One last step</span>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight">Verify your email</h1>
            <p className="mb-6 mt-2 text-sm text-text-secondary">We sent a six-digit code to <span className="text-white/85">{email}</span>.</p>

            <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                </InputOTPGroup>
            </InputOTP>

            {!expired ? (
                <OtpTimer expiryMinutes={3} onExpire={() => setExpired(true)} resetKey={resetKey} />
            ) : (
                <>
                    <p className="mt-3 text-xs text-text-secondary">Didn't receive the code?</p>
                    <button
                        onClick={resendOtp}
                        className="text-xs font-medium text-primary hover:underline"
                    >
                        Send another code
                    </button></>
            )}

            <div className="w-full pt-5">
                <AuthBotton disabled={otp.length !== 6 || isSubmitting} onClick={handleOtpVerificaton} label={isSubmitting ? "Verifying…" : "Verify and continue"} />
            </div>
        </div>
    );
};

export default Otp;
