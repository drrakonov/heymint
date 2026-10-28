import { useUserStore } from "@/store/userStore";
import { StreamCall, StreamTheme } from "@stream-io/video-react-sdk";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MeetingSetup from "./MeetingSetup";
import MeetingRoom from "./MeetingRoom";
import { useGetCallById } from "@/hooks/useGetCallById";
import Loader from "../subComponents/Loader";
import api from "@/lib/axios";
import { Clock3 } from "lucide-react";


const MeetingShowerContent = () => {
    const { id } = useParams();
    const { user } = useUserStore();
    const [isSetUpComplete, setIsSetUpComplete] = useState(false);
    const [isAccessValidated, setIsAccessValidated] = useState(false);
    const { call, isCallLoading } = useGetCallById(id ?? "");
    const navigate = useNavigate();

    useEffect(() => {
        const validateAccess = async () => {
            if (!user) {
                navigate("/dashboard");
                return;
            }

            try {
                const access = await api.get("/api/meeting/validate-access", {
                    params: {
                        userId: user.id,
                        meetingCode: id
                    }
                });

                if (!access.data.success) {
                    navigate("/dashboard");
                    return;
                }
                setIsAccessValidated(true);
            } catch (error) {
                console.error("Failed to validate meeting access", error);
                navigate("/dashboard");
            }
        };

        setIsSetUpComplete(false);
        setIsAccessValidated(false);
        validateAccess();
    }, [id, user, navigate]);

    if (isCallLoading || !user || !isAccessValidated) return <Loader />;
    if (!call) return (
        <div className="mint-app-bg flex min-h-screen items-center justify-center p-4 text-center text-white">
            <div className="liquid-glass max-w-md rounded-[28px] p-8">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary"><Clock3 size={20}/></span>
                <p className="eyebrow mt-5">Waiting room</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight">The host hasn’t started yet.</h1>
                <p className="mt-3 text-sm leading-6 text-text-secondary">Keep this invite link. Once the host starts the meeting, retry to enter the room.</p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                    <button onClick={() => window.location.reload()} className="mint-button rounded-full px-5 py-2.5 text-sm font-semibold">Retry</button>
                    <button onClick={() => navigate("/dashboard/meetings")} className="glass-control rounded-full px-5 py-2.5 text-sm">Back to meetings</button>
                </div>
            </div>
        </div>
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
    );
};

export default MeetingShowerContent;
