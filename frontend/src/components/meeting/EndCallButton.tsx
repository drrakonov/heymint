import { clearMeetingResume } from "@/lib/meetingResume";
import { useUserStore } from "@/store/userStore";
import { useCall, useCallStateHooks } from "@stream-io/video-react-sdk";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { Button } from "../ui/button";
import toast from 'react-hot-toast';
import api from "@/lib/axios";
import { PhoneOff } from "lucide-react";

const EndCallButton = () => {
    const call = useCall();
    const userId = useUserStore(state => state.user!.id);
    const navigate = useNavigate();
    const { id } = useParams();

    if (!call) {
        throw new Error(
            'useStreamCall must be used with in stream component'
        )
    }

    const { useLocalParticipant } = useCallStateHooks();
    const localParticipant = useLocalParticipant();

    const isMeetingOwner = localParticipant && call.state.createdBy && localParticipant.userId === call.state.createdBy.id;

    const [isEnding, setIsEnding] = useState(false);

    const leaveCall = async () => {
        try {
            clearMeetingResume(userId, call.id);
            await call.leave();
        } finally {
            navigate("/dashboard");
        }
    };

    const endCall = async () => {
        if (isEnding || !id) return;

        setIsEnding(true);

        try {
            await api.post(`/api/meeting/${id}/end`, undefined, { timeout: 30_000 });
            clearMeetingResume(userId, call.id);
            toast.success("Meeting ended! Generating AI summary...");
            navigate("/dashboard");
        } catch (error) {
            console.error("Failed to end meeting", error);
            toast.error("Failed to end meeting");
            setIsEnding(false);
        }
    }

    if (!isMeetingOwner) {
        return (
            <Button onClick={leaveCall} aria-label="Leave meeting" title="Leave meeting" className="h-10 w-10 shrink-0 rounded-xl bg-danger p-0 font-semibold text-white hover:bg-danger/85 sm:h-11 sm:w-auto sm:px-4">
                <PhoneOff size={18}/><span className="hidden sm:inline">Leave</span>
            </Button>
        );
    }

    return (
        <Button onClick={endCall} disabled={isEnding} aria-label={isEnding ? "Ending meeting" : "End meeting for everyone"} title="End meeting for everyone" className="h-10 w-10 shrink-0 rounded-xl bg-danger p-0 font-semibold text-white hover:bg-danger/85 sm:h-11 sm:w-auto sm:px-4">
            <PhoneOff size={18}/>
            <span className="hidden sm:inline">{isEnding ? "Ending…" : "End for everyone"}</span>
        </Button>
    )
}

export default EndCallButton;
