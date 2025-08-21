import { useUserStore } from "@/store/userStore";
import { StreamCall, StreamTheme } from "@stream-io/video-react-sdk";
import { useState } from "react";
import { useParams } from "react-router-dom";
import MeetingSetup from "./MeetingSetup";
import MeetingRoom from "./MeetingRoom";
import { useGetCallById } from "@/hooks/useGetCallById";
import Loader from "../subComponents/Loader";


const MeetingShower = () => {
    const { id } = useParams();
    const { user } = useUserStore();
    const [isSetUpComplete, setIsSetUpComplete] = useState(false);
    const { call, isCallLoading } = useGetCallById(id ?? "");;

    if (isCallLoading || !user) return <Loader />

    if (!call) return (
        <p className="text-center text-3xl font-bold text-white">
            Call Not Found
        </p>
    );


    return (
        <main className="h-screen w-full">
            <StreamCall call={call}>
                <StreamTheme>
                    {!isSetUpComplete ? (
                        <MeetingSetup setIsSetUpComplete={setIsSetUpComplete} />
                    ) : (
                        <MeetingRoom />
                    )}
                </StreamTheme>
            </StreamCall>

        </main>
    )
}

export default MeetingShower;