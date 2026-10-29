import { StreamCall, StreamTheme } from "@stream-io/video-react-sdk";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MeetingSetup from "./MeetingSetup";
import MeetingRoom from "./MeetingRoom";
import { useGetCallById } from "@/hooks/useGetCallById";
import Loader from "../subComponents/Loader";
import ConnectionError from "../subComponents/ConnectionError";

function MeetingContent({ id }: { id: string }) {
    const [isSetUpComplete, setIsSetUpComplete] = useState(false);
    const { call, isCallLoading, error, passwordRequired, retry } = useGetCallById(id);
    const navigate = useNavigate();
    if (isCallLoading) return <Loader />;
    if (error || !call) return <ConnectionError message={error || "This room is not available yet."} onRetry={retry} onExit={() => navigate("/dashboard/meetings")} />;
    return <main className="h-screen w-full">
        <StreamCall call={call}><StreamTheme>
            {!isSetUpComplete ? <MeetingSetup isMeetingProtected={passwordRequired} setIsSetUpComplete={setIsSetUpComplete} /> : <MeetingRoom />}
        </StreamTheme></StreamCall>
    </main>;
}

export default function MeetingShower() {
    const { id = "" } = useParams();
    // Only a different room resets setup. Profile updates and token rotation do not.
    return <MeetingContent key={id} id={id} />;
}
