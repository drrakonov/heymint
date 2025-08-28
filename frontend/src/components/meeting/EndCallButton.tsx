import { useCall, useCallStateHooks } from "@stream-io/video-react-sdk";
import { useNavigate, useParams } from "react-router-dom";
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

    if (!isMeetingOwner) return null;

    const endCall = async () => {
        call.endCall();
        const res = await api.post("/api/meeting/delete-meeting", {
            userId: user?.id,
            meetingCode: id,
        });
        if (!res.data.success) {
            toast.error("Failed to delete the call record");
        } else {
            toast.success("meeting ended for everyone")
        }
        navigate("/dashboard");
    }
    return (
        <Button onClick={endCall} className="bg-danger hover:bg-danger/50">
            End Call for everyone
        </Button>
    )
}

export default EndCallButton;