import { CallingState, type Call } from "@stream-io/video-react-sdk";
import api from "./axios";
import toast from "react-hot-toast";

const joins = new WeakMap<Call, Promise<void>>();
export function enterMeeting(call: Call, userId: string): Promise<void> {
    const pending = joins.get(call);
    if (pending) return pending;
    const operation = (async () => {
        if (call.state.callingState !== CallingState.JOINED) await call.join();
        void recordAttendance(call.id);
        if (call.state.createdBy?.id === userId) void ensureCapture(call);
    })().finally(() => joins.delete(call));
    joins.set(call, operation);
    return operation;
}
async function recordAttendance(id: string) {
    for (let attempt = 0; attempt < 5; attempt++) {
        try { await api.post(`/api/meeting/${id}/participants`, undefined, { timeout: 5000 }); return; }
        catch { if (attempt < 4) await new Promise(resolve => setTimeout(resolve, 750 * (attempt + 1))); }
    }
    toast.error("Attendance could not be confirmed. Your protected insights may be delayed.");
}
async function ensureCapture(call: Call) {
    for (let attempt = 0; attempt < 3; attempt++) {
        if (call.state.callingState !== CallingState.JOINED || call.state.endedAt) return;
        try { await api.post(`/api/meeting/${call.id}/recording/start`, undefined, { timeout: 45_000 }); return; }
        catch { if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 1500 * (attempt + 1))); }
    }
    toast.error("Recording or transcription could not be confirmed. Check the meeting service logs.");
}
