import { useUserStore } from "@/store/userStore";
import { StreamCall, StreamTheme } from "@stream-io/video-react-sdk";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MeetingSetup from "./MeetingSetup";
import MeetingRoom from "./MeetingRoom";
import { useGetCallById } from "@/hooks/useGetCallById";
import Loader from "../subComponents/Loader";
import api from "@/lib/axios";


const MeetingShower = () => {
    const { id } = useParams();
    const { user } = useUserStore();
    const [isSetUpComplete, setIsSetUpComplete] = useState(false);
    const { call, isCallLoading } = useGetCallById(id ?? "");
    const navigate = useNavigate();

    useEffect(() => {
        const validateAccess = async () => {
            if(!user) {
                navigate("/dashboard");
                return;
            }
            const access = await api.get("/api/meeting/validate-access", {
                params: {
                    userId: user.id,
                    meetingCode: id
                }
            });

            console.log("its", access.data.success);

            if (!access.data.success) {
                navigate("/dashboard");
                return;
            }
        }
        validateAccess();
        setIsSetUpComplete(false);
    }, [id]);

    if (isCallLoading || !user) return <Loader />;
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
    );
};

export default MeetingShower;