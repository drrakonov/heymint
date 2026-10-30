type StreamTranscriptLine = {
    type?: string;
    start_time?: string;
    stop_time?: string;
    start_ts?: number | string;
    stop_ts?: number | string;
    speaker_id?: string;
    user_id?: string;
    text?: string;
};


export function parseStreamSpeech(rawTranscript: string, baseTime: number) {
    const lines = rawTranscript.split(/\r?\n/).filter(line => line.trim());
    const speech = lines
        .map((line) => {
            try {
                const value = JSON.parse(line);
                if (!value || typeof value !== "object" || Array.isArray(value) || typeof value.type !== "string") {
                    throw new Error("Invalid transcript line");
                }
                if (value.type === "speech" && typeof value.text !== "string") throw new Error("Invalid speech text");
                return value as StreamTranscriptLine;
            } catch {
                throw new Error("Stream transcript contains invalid JSON");
            }
        })
        .filter((line): line is StreamTranscriptLine => Boolean(line && line.type === "speech" && typeof line.text === "string" && line.text.trim()))
        .map((line) => {
            let startedAt: Date;
            let endedAt: Date;

            if (line.start_time && line.stop_time) {
                startedAt = new Date(line.start_time);
                endedAt = new Date(line.stop_time);
            } else if (line.start_ts !== undefined && line.stop_ts !== undefined) {
                const s = Number(line.start_ts);
                const e = Number(line.stop_ts);
                startedAt = new Date(baseTime + s);
                endedAt = new Date(baseTime + e);
            } else {
                startedAt = new Date(NaN);
                endedAt = new Date(NaN);
            }

            const speakerId = line.speaker_id || line.user_id || "unknown";

            return {
                ...line,
                speaker_id: speakerId,
                startedAt,
                endedAt
            };
        })
        .map(line => {
            if (!Number.isFinite(line.startedAt.getTime()) || !Number.isFinite(line.endedAt.getTime()) || line.endedAt < line.startedAt) {
                throw new Error("Stream speech segment has invalid timestamps");
            }
            return line;
        })
        .sort((first, second) => first.startedAt.getTime() - second.startedAt.getTime());



    return speech;
}
