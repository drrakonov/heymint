import { streamClient } from "../utils/streamClient";
import { meetingTrace } from "../utils/meetingTrace";

const starts = new Map<string, Promise<void>>();
const recordingRunning = (status?: string) => status === "active" || status === "starting";

// Coalesce overlapping requests in this process. Provider state is rechecked after
// conflicts as another API instance may also be starting the same capture.
export function ensureMeetingCapture(meetingCode: string): Promise<void> {
    const existing = starts.get(meetingCode);
    if (existing) return existing;
    const task = start(meetingCode).finally(() => { starts.delete(meetingCode); });
    starts.set(meetingCode, task);
    return task;
}
async function start(meetingCode: string) {
    const call = streamClient.video.call("default", meetingCode);
    const { call: current } = await call.get();
    if (current.ended_at || !current.current_session_id || current.session?.ended_at) {
        throw new Error("Meeting session is not active");
    }
    const sessionId = current.current_session_id;
    meetingTrace("recording.call_state", { meetingCode, sessionId,
        transcribing: current.transcribing, recordingStatus: current.egress.individual_recording?.status });
    if (recordingRunning(current.egress.individual_recording?.status) && current.transcribing) return;
    if (current.egress.individual_recording?.status === "stopping") throw new Error("Recording is still stopping; retry shortly");

    if (!recordingRunning(current.egress.individual_recording?.status)) {
        if (current.settings?.individual_recording?.mode !== "auto-on") {
            await call.update({ settings_override: { individual_recording: { mode: "auto-on", output_types: ["audio_only"] } } });
        }
        meetingTrace("recording.stream_start_requested", { meetingCode, sessionId });
        try { await call.startRecording({ recording_type: "individual" }); }
        catch (error) {
            const fresh = (await call.get()).call;
            if (fresh.current_session_id !== sessionId || !recordingRunning(fresh.egress.individual_recording?.status)) throw error;
        }
        meetingTrace("recording.stream_start_accepted", { meetingCode, sessionId });
    }
    if (!current.transcribing) {
        meetingTrace("transcription.stream_start_requested", { meetingCode, sessionId });
        try { await call.startTranscription({ language: "auto" }); }
        catch (error) {
            const fresh = (await call.get()).call;
            // Never roll back working audio capture because transcription failed.
            if (fresh.current_session_id !== sessionId || !fresh.transcribing) throw error;
        }
        meetingTrace("transcription.stream_start_accepted", { meetingCode, sessionId });
    }
}
