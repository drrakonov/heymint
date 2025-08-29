import { DeviceSettings, useCall, VideoPreview } from "@stream-io/video-react-sdk";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import { useUserStore } from "@/store/userStore";
import { useParams } from "react-router-dom";
import PasswordInput from "../subComponents/PasswordInput";

const MeetingSetup = ({ setIsSetUpComplete }: {
    setIsSetUpComplete: (value: boolean) => void
}) => {
    const [isMicToggleOn, setIsMicToggleOn] = useState(false);
    const [isCamToggleOn, setIsCamToggleOn] = useState(false);
    const [isMeetingProtected, setIsMeetingProtected] = useState(false);
    const [password, setPassword] = useState("");

    const call = useCall();
    const { user } = useUserStore();
    const { meetingCode } = useParams();


    if (!call) {
        throw new Error("useCall must be in streamCall componenet");
    }

    const handleProtectedMeetingAndValidate = async () => {
        try {
            const res = await api.get("/api/meeting/get-isProtected", {
                params: {
                    userId: user?.id,
                    meetingCode
                }
            })

            if (!res.data.success) throw new Error(res.data.message);
            return res.data.isProtected;
        } catch (err) {
            toast.error("Failed to join");
            console.error("Failed to validate the meeting", err);
        }
    }

    const handleJoinMeeting = async () => {
        try {
            call.join();
            setIsSetUpComplete(true);

        } catch (err) {
            toast.error("Failed to join")
            console.error("Failed to join the meeting", err);
        }

    }

    useEffect(() => {
        async () => {
            const isProtected = await handleProtectedMeetingAndValidate();
            setIsMeetingProtected(isProtected);
        }
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
                <div className="relative w-[300px] sm:w-[400px] md:w-[600px] h-[300px] sm:h-[400px] md:h-[500px]">
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
                    <DeviceSettings />
                </div>
                {isMeetingProtected ? (
                    <PasswordInput value={password}
                        onChange={(e) => setPassword(e.target.value)} />
                ) : (
                    <Button
                        onClick={handleJoinMeeting}
                    >
                        Join Meeting
                    </ Button>
                )}

            </div>
        </div>
    )
}

export default MeetingSetup;
