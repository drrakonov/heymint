import { useStreamVideoClient, type Call } from "@stream-io/video-react-sdk";
import { useEffect, useState } from "react";
import { useUserStore } from "@/store/userStore";
import api from "@/lib/axios";
import axios from "axios";
import { withTimeout } from "@/lib/withTimeout";

export const useGetCallById = (id: string) => {
    const [call, setCall] = useState<Call>();
    const [isCallLoading, setIsCallLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [passwordRequired, setPasswordRequired] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const client = useStreamVideoClient();
    const userId = useUserStore(state => state.user?.id);

    useEffect(() => {
        if (!client || !userId || !id) return;
        let cancelled = false;
        let room: Call | undefined;
        const controller = new AbortController();
        setIsCallLoading(true);
        setError(null);
        setCall(undefined);
        const load = async () => {
            try {
                const { data } = await api.get("/api/meeting/validate-access", {
                    params: { meetingCode: id }, signal: controller.signal,
                });
                if (cancelled) return;
                room = client.call("default", id);
                await withTimeout(data.isHost ? room.getOrCreate({ data: { starts_at: data.startingTime } }) : room.get());
                if (room.state.endedAt) throw new Error("This meeting has already ended.");
                if (!cancelled) { setPasswordRequired(data.passwordRequired); setCall(room); }
            } catch (error) {
                if (!cancelled) setError(axios.isAxiosError(error)
                    ? error.response?.data?.message || "We couldn’t reach your meeting. Please try again."
                    : error instanceof Error ? error.message : "The host hasn’t opened this room yet. Try again shortly.");
            } finally { if (!cancelled) setIsCallLoading(false); }
        };
        void load();
        return () => {
            cancelled = true;
            controller.abort();
            if (room) {
                void room.camera.disable().catch(() => undefined);
                void room.microphone.disable().catch(() => undefined);
                void room.leave().catch(() => undefined);
            }
        };
    }, [client, id, userId, attempt]);

    return { call, isCallLoading, error, passwordRequired, retry: () => setAttempt(n => n + 1) };
};
