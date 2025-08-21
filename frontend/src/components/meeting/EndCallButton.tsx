import { useCall, useCallStateHooks } from "@stream-io/video-react-sdk";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import toast from 'react-hot-toast';

const EndCallButton = () => {
    const call = useCall();
    const navigate = useNavigate();
    
    if(!call) {
        throw new Error(
            'useStreamCall must be used with in stream component'
        )
    }

    const { useLocalParticipant } = useCallStateHooks();
    const localParticipant = useLocalParticipant();

    const isMeetingOwner = localParticipant && call.state.createdBy && localParticipant.userId === call.state.createdBy.id;

    if(!isMeetingOwner) return null;

    const endCall = () => {
        call.endCall();
        toast.success("meeting ended for everyone")
        navigate("/dashboard");
    }
    return (
        <Button onClick={endCall} className="bg-danger hover:bg-danger/50">
            End Call for everyone
        </Button>
    )
}

export default EndCallButton;