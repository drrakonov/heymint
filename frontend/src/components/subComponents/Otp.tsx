import { useAuth } from "@/context/AuthContext";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "../ui/input-otp";
import { AuthBotton } from "./AuthButton";
import { Heading } from "./Heading";
import { SubHeading } from "./SubHeading";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "@/lib/axios";

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
        <p className="text-sm text-gray-600 pt-2">
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

    const handleOtpVerificaton = async () => {
        try {
            await signup(email, password, otp);
            navigate("/dashboard");
        } catch (err) {
            console.log("Failed to signup", err);
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
        } catch (err: any) {
            if(err.response?.status === 409) {
                toast.success("User already exists");
            }
            console.log("Failed to resend OTP", err);
        }
    };

    return (
        <div className="w-full w-20vh text-center p-5 flex flex-col justify-center items-center border-2 border-surface-2 shadow-inner shadow-surface-2 rounded-2xl">
            <Heading label={"Enter OTP"} />
            <SubHeading label={`code sent to ${email}`} />

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
                    <p className="text-text-secondary text-xs mt-2">Didn't recieved the code?</p>
                    <button
                        onClick={resendOtp}
                        className="text-text-secondary text-xs hover:underline"
                    >
                        resend
                    </button></>
            )}

            <div className="pt-4">
                <AuthBotton onClick={handleOtpVerificaton} label={"Submit"} />
            </div>
        </div>
    );
};

export default Otp;
