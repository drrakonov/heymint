import { useEffect, useRef, useState } from "react";
import { useCall } from "@stream-io/video-react-sdk";
import { useUserStore } from "@/store/userStore";
import { enterMeeting } from "@/lib/joinMeeting";
import type { MeetingResume } from "@/lib/meetingResume";

export default function ResumeMeeting({ saved, onJoined, onCancel }: {
    saved: MeetingResume; onJoined: () => void; onCancel: () => void;
}) {
    const call = useCall()!;
    const userId = useUserStore(state => state.user!.id);
    const active = useRef(false);
    const task = useRef<Promise<void> | null>(null);
    const [error, setError] = useState(false);
    useEffect(() => {
        let cancelled = false;
        active.current = true;
        if (!task.current) task.current = (async () => {
            if (saved.micDevice) await call.microphone.select(saved.micDevice);
            if (saved.cameraDevice) await call.camera.select(saved.cameraDevice);
            await Promise.all([
                saved.micEnabled ? call.microphone.enable() : call.microphone.disable(),
                saved.cameraEnabled ? call.camera.enable() : call.camera.disable(),
            ]);
            if (!active.current) {
                await Promise.all([call.microphone.disable(), call.camera.disable()]);
                return;
            }
            await enterMeeting(call, userId);
        })();
        void task.current.then(() => { if (!cancelled) onJoined(); }).catch(() => { if (!cancelled) setError(true); });
        return () => { cancelled = true; active.current = false; };
    }, [call, userId, saved, onJoined]);
    return <div className="mint-app-bg flex min-h-dvh items-center justify-center p-6 text-center text-text-primary">
        <div className="workspace-panel max-w-md p-8" role="status">
            <h1 className="text-xl font-semibold">{error ? "Check your devices to rejoin" : "Reconnecting to your meeting…"}</h1>
            <p className="mt-3 text-sm text-text-secondary">{error ? "Your previous microphone or camera may be unavailable." : "Restoring your microphone, camera and meeting connection."}</p>
            {error && <button className="mint-button mt-5 rounded-xl px-5 py-3" onClick={onCancel}>Choose devices</button>}
        </div>
    </div>;
}
