export const SCHEDULED_EXPIRY_MS = 24 * 60 * 60 * 1000;

type Lifecycle = { isScheduled: boolean; startingTime: Date; startedAt: Date | null; isComplete: boolean };

export function isMeetingExpired(meeting: Lifecycle, now = Date.now()): boolean {
    return meeting.isScheduled && !meeting.startedAt && !meeting.isComplete
        && meeting.startingTime.getTime() + SCHEDULED_EXPIRY_MS <= now;
}
