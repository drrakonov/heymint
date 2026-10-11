import { useCall, useCallStateHooks } from "@stream-io/video-react-sdk";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { Button } from "../ui/button";
import toast from 'react-hot-toast';
import api from "@/lib/axios";
import { useUserStore } from "@/store/userStore";

const EndCallButton = () => {
    const call = useCall();
    const navigate = useNavigate();
    const { user } = useUserStore();
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

    const leaveCall = () => {
        call.leave();
        navigate("/dashboard");
    };

    const endCall = async () => {
        if (isEnding) return;
        setIsEnding(true);
        window.dispatchEvent(new Event("stop-recording"));
        call.endCall();
        const res = await api.post("/api/meeting/delete-meeting", {
            userId: user?.id,
            meetingCode: id,
            isComplete: true
        });
        if (!res.data.success) {
            toast.error("Failed to delete the call record");
        } else {
            toast.success("Meeting ended! Generating AI summary...")
        }
        
        // Wait for the actual upload to finish before navigating
        window.addEventListener("upload-complete", () => {
            navigate("/dashboard");
        }, { once: true });

        // Fallback in case of catastrophic failure
        setTimeout(() => navigate("/dashboard"), 15000);
    }

    if (!isMeetingOwner) {
        return (
            <Button onClick={leaveCall} className="bg-danger hover:bg-danger/80 text-white font-bold">
                Leave
            </Button>
        );
    }

    return (
        <Button onClick={endCall} disabled={isEnding} className="bg-danger hover:bg-danger/80 text-white font-bold">
            {isEnding ? "Saving AI Summary..." : "End Call for everyone"}
        </Button>
    )
}

export default EndCallButton;