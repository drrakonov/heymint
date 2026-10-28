import { createHash } from "crypto";

type TraceFields = Record<string, string | number | boolean | null | undefined>;

// Temporary diagnostics: pass identifiers, counts and states only, never payloads.
export const meetingTrace = (stage: string, fields: TraceFields = {}) => {
    console.log("[MeetingTrace]", JSON.stringify({ at: new Date().toISOString(), stage, ...fields }));
};

export const traceError = (error: unknown): TraceFields => {
    const value = error as { name?: unknown; code?: unknown; status?: unknown; statusCode?: unknown } | null;
    const safeLabel = (label: unknown) => typeof label === "string" && /^[a-zA-Z0-9_.-]{1,80}$/.test(label) ? label : undefined;
    const knownReasons = [
        "Stream transcript did not contain speech segments",
        "Meeting transcript is empty after persistence",
        "Failed to store transcript embeddings",
        "Transcription worker timing and retry settings must be positive numbers",
    ];
    return {
        errorType: safeLabel(value?.name) || "UnknownError",
        errorCode: typeof value?.code === "number" ? value.code : safeLabel(value?.code),
        httpStatus: typeof value?.status === "number" ? value.status : typeof value?.statusCode === "number" ? value.statusCode : undefined,
        reason: error instanceof Error && knownReasons.includes(error.message) ? error.message : undefined,
    };
};

export const traceRuntime = (service: "api" | "worker") => {
    let databaseTarget = "missing";
    try {
        const url = new URL(process.env.DATABASE_URL || "");
        const target = `${url.hostname.replace("-pooler", "")}${url.pathname}?schema=${url.searchParams.get("schema") || "public"}`;
        databaseTarget = createHash("sha256").update(target).digest("hex").slice(0, 12);
    } catch { databaseTarget = process.env.DATABASE_URL ? "invalid" : "missing"; }
    meetingTrace("runtime.started", {
        service,
        revision: process.env.RENDER_GIT_COMMIT?.slice(0, 12) || "local",
        databaseTarget,
        streamApp: process.env.STREAM_API_KEY ? createHash("sha256").update(process.env.STREAM_API_KEY).digest("hex").slice(0, 12) : "missing",
        streamSecretConfigured: Boolean(process.env.STREAM_SECRET_KEY),
        summaryKeyConfigured: Boolean(process.env.GROQ_API_KEY),
        embeddingKeyConfigured: Boolean(process.env.GEMINI_API_KEY),
    });
};
