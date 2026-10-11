import { DeviceSettings, useCall, VideoPreview } from "@stream-io/video-react-sdk";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import { useUserStore } from "@/store/userStore";
import { useNavigate, useParams } from "react-router-dom";
import PasswordInput from "../subComponents/PasswordInput";

const MeetingSetup = ({ setIsSetUpComplete }: {
    setIsSetUpComplete: (value: boolean) => void
}) => {
    const [isMicToggleOn, setIsMicToggleOn] = useState(false);
    const [isCamToggleOn, setIsCamToggleOn] = useState(false);
    const [isMeetingProtected, setIsMeetingProtected] = useState(true);
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    const call = useCall();
    const { user } = useUserStore();
    const { id } = useParams();
    const navigate = useNavigate();


    if (!call) {
        throw new Error("useCall must be in streamCall componenet");
    }

    const handleProtectedMeetingAndValidate = async () => {
        try {

            if (!user || !id) {
                toast.error("User not found");
                return;
            }
            setIsLoading(true);
            const res = await api.get("/api/meeting/get-isProtected", {
                params: {
                    meetingCode: id,
                    userId: user.id
                }
            })

            if (!res.data.success) throw new Error(res.data.message);
            setIsLoading(false);
            return res.data.isProtected;
        } catch (err) {
            toast.error("Failed to join");
            console.error("Failed to validate the meeting", err);
        }
    }

    const handleJoinMeeting = async () => {
        if (!user) {
            toast.error("User not found");
            return;
        }
        try {
            
            if (isMeetingProtected) {
                if (password.length < 2) {
                    toast.error("Enter valid password");
                    return;
                }
                const res = await api.post("/api/meeting/get-meeting-validation", {
                    meetingPassword: password,
                    meetingCode: id,
                })

                if (res.data.success) {
                    if (res.data.isMatched) {
                        call.join();
                        setIsSetUpComplete(true);
                        return;
                    } else {
                        toast.error("Enter valid password");
                        return;
                    }

                } else {
                    toast.error("Failed to join");
                    navigate("/dashboard");
                    return;
                }

            } else {
                call.join();
                setIsSetUpComplete(true);
            }

        } catch (err) {
            toast.error("Failed to join")
            console.error("Failed to join the meeting", err);
        }

    }

    useEffect(() => {
        const checkIsProtected = async () => {
            const isProtected = await handleProtectedMeetingAndValidate();

            setIsMeetingProtected(isProtected);
        }
        checkIsProtected();
    }, [])


    useEffect(() => {
        if (isCamToggleOn) {
            call?.camera.disable();
        } else {
            call?.camera.enable();
        }

    }, [isCamToggleOn, call?.camera])

    useEffect(() => {
        if (isMicToggleOn) {
            call?.microphone.disable();
        } else {
            call?.microphone.enable();
        }
    }, [isMicToggleOn, call?.microphone])


    return (
        <div className="flex bg-background h-screen w-full flex-col items-center justify-center gap-3 text-text-primary">
            <div className="flex flex-col items-center justify-center ml-30 mr-30">
                <h1 className="text-2xl sm:text-4xl font-bold mb-5 sm:mb-10">Setup</h1>
                <div className="relative w-[300px] sm:w-[400px] md:w-[500px] h-[300px] sm:h-[400px] md:h-[400px]">
                    <VideoPreview className="absolute inset-0 !w-full !h-full object-cover" />
                </div>
                <div className="flex space-x-2 h-14">
                    <label className="flex justify-center items-center space-x-1">
                        <span className="font-semibold">Mic off</span>
                        <input
                            type="checkbox"
                            checked={isMicToggleOn}
                            onChange={(e) => setIsMicToggleOn(e.target.checked)}
                        />
                    </label>
                    <label className="flex justify-center items-center space-x-1">
                        <span className="font-semibold">Camera off</span>
                        <input
                            type="checkbox"
                            checked={isCamToggleOn}
                            onChange={(e) => setIsCamToggleOn(e.target.checked)}
                        />
                    </label>
                    <div className="rounded-2xl flex items-center"><DeviceSettings /></div>
                </div>
                <div className="flex flex-col justify-center gap-2">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-16">
                            <span className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent"></span>
                            <span className="ml-2">Checking meeting protection...</span>
                        </div>
                    ) : (
                        <>
                            {isMeetingProtected && (
                                <PasswordInput
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            )}
                            <Button onClick={handleJoinMeeting}>
                                Join Meeting
                            </Button>
                        </>
                    )}

                </div>
            </div>
        </div>
    )
}

export default MeetingSetup;
