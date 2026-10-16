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

    const leaveCall = async () => {
        try {
            await call.leave();
        } finally {
            navigate("/dashboard");
        }
    };

    const endCall = async () => {
        if (isEnding || !id) return;

        setIsEnding(true);

        try {
            try {
                await api.post(`/api/meeting/${id}/recording/stop`);
            } catch (error) {
                console.error("Failed to stop recording before ending the call", error);
            }

            await call.endCall();

            try {
                const res = await api.post("/api/meeting/delete-meeting", {
                    userId: user?.id,
                    meetingCode: id,
                    isComplete: true
                });

                if (!res.data.success) {
                    throw new Error(res.data.message || "Failed to complete meeting");
                }
            } catch (error) {
                console.error("Meeting ended but could not be marked complete", error);
                toast.error("Meeting ended, but its status could not be updated");
            }

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
            <Button onClick={leaveCall} className="bg-danger hover:bg-danger/80 text-white font-bold">
                Leave
            </Button>
        );
    }

    return (
        <Button onClick={endCall} disabled={isEnding} className="bg-danger hover:bg-danger/80 text-white font-bold">
            {isEnding ? "Ending..." : "End Call for everyone"}
        </Button>
    )
}

export default EndCallButton;
