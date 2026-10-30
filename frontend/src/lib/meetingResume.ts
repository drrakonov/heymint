export type MeetingResume = { at: number; micEnabled: boolean; cameraEnabled: boolean; micDevice?: string; cameraDevice?: string };
const key = (userId: string, meetingId: string) => `meeting-resume:${userId}:${meetingId}`;
export function readMeetingResume(userId: string, meetingId: string): MeetingResume | null {
    if ((performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined)?.type !== "reload") return null;
    try {
        const value = JSON.parse(sessionStorage.getItem(key(userId, meetingId)) || "null");
        if (!value || !Number.isFinite(value.at) || Date.now() - value.at > 120_000 || value.at > Date.now()
            || typeof value.micEnabled !== "boolean" || typeof value.cameraEnabled !== "boolean") return null;
        return { ...value, micDevice: typeof value.micDevice === "string" ? value.micDevice : undefined,
            cameraDevice: typeof value.cameraDevice === "string" ? value.cameraDevice : undefined };
    } catch { return null; }
}
export function saveMeetingResume(userId: string, meetingId: string, value: Omit<MeetingResume, "at">) {
    try { sessionStorage.setItem(key(userId, meetingId), JSON.stringify({ ...value, at: Date.now() })); } catch { /* Storage may be unavailable. */ }
}
export function clearMeetingResume(userId: string, meetingId: string) {
    try { sessionStorage.removeItem(key(userId, meetingId)); } catch { /* Storage may be unavailable. */ }
}
