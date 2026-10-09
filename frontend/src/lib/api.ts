import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

export interface User {
  id: string;
  name: string;
  email: string;
  provider: string;
}
export interface Meeting {
  meetingId: string;
  title: string;
  description: string;
  type: "Free" | "Paid";
  hostName: string;
  price: number;
  meetingTime: string;
  isProtected: boolean;
  isInstant: boolean;
  meetingCode: string;
  createdById: string;
  isComplete: boolean;
}
export type Booking = Omit<Meeting, "type" | "isComplete">;
export interface Payment {
  id: string;
  meetingName: string;
  amount: number;
  status: string;
  date: string;
  paymentMethod: "UPI";
}
export interface Stats {
  completedMeetings: number;
  myTotalMeetings: number;
  totalEarning: number;
  totalMeetings: number;
  activeUsers: number;
}
export interface Summary {
  overview: string;
  keyPoints: string[];
  actionItems: string[];
  decisions: string[];
  raw?: string;
}
export interface SavedInsights {
  summary: Summary;
  title: string;
  date: string;
  transcription: string;
}
export interface SetupMeeting {
  title: string;
  description: string;
  isScheduled: boolean;
  isPaid: boolean;
  isProtected: boolean;
  startingTime: string;
  price: number;
  createdBy: string;
  password: string;
  meetingCode: string;
}
type Result = { success: boolean; message?: string };
type RetryConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  _session?: number;
};
const authEndpoint = /\/api\/auth\/(login|signup|send-otp|refresh)(?:[/?]|$)/;
const excluded =
  /\/api\/(auth\/(login|signup|send-otp|refresh)|meeting\/get-meeting-validation)(?:[/?]|$)/;
export const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "",
  withCredentials: true,
  timeout: 30000,
});
let refreshPromise: Promise<string> | null = null;
let sessionGeneration = 0;
export const getSessionGeneration = () => sessionGeneration;
export function storedToken() {
  return typeof window === "undefined"
    ? null
    : localStorage.getItem("accessToken");
}
export function setToken(token: string | null) {
  sessionGeneration++;
  writeToken(token);
}
function writeToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem("accessToken", token);
  else localStorage.removeItem("accessToken");
}
export function safeReturn(value: string | null | undefined): string {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    Array.from(value).some((char) => char.charCodeAt(0) <= 32) ||
    value.startsWith("/auth")
  )
    return "/dashboard";
  try {
    const url = new URL(value, "https://heymint.local");
    return url.origin === "https://heymint.local"
      ? url.pathname + url.search + url.hash
      : "/dashboard";
  } catch {
    return "/dashboard";
  }
}
export function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    const generation = sessionGeneration;
    refreshPromise = api
      .post<{ accessToken: string }>("/api/auth/refresh")
      .then(({ data }) => {
        if (!data.accessToken)
          throw new Error(
            "Your session could not be restored. Please sign in again.",
          );
        if (generation !== sessionGeneration)
          throw new Error("The session changed. Please try again.");
        writeToken(data.accessToken);
        return data.accessToken;
      })
      .catch((error) => {
        if (generation === sessionGeneration) writeToken(null);
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}
api.interceptors.request.use((config) => {
  (config as RetryConfig)._session ??= sessionGeneration;
  const token = storedToken();
  if (token && !authEndpoint.test(config.url || ""))
    config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryConfig | undefined;
    if (
      error.response?.status !== 401 ||
      !config ||
      config._retry ||
      excluded.test(config.url || "") ||
      config._session !== sessionGeneration
    )
      throw error;
    config._retry = true;
    try {
      const current = storedToken();
      const token =
        current && config.headers.Authorization !== `Bearer ${current}`
          ? current
          : await refreshAccessToken();
      config.headers.Authorization = `Bearer ${token}`;
      return await api(config);
    } catch (refreshError) {
      if (typeof window !== "undefined" && !storedToken())
        window.dispatchEvent(new Event("heymint:session-expired"));
      throw refreshError;
    }
  },
);
export function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message =
      error.response?.data?.message || error.response?.data?.error;
    if (typeof message === "string") return message;
    if (!error.response)
      return "We couldn’t reach HeyMint. Check your connection and backend URL, then try again.";
    if (error.response.status === 404)
      return "This resource is unavailable. Check that the existing HeyMint backend is connected.";
    return `Something went wrong (${error.response.status}). Please try again.`;
  }
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}
export function requireSuccess<T extends Result>(data: T): T {
  if (!data.success)
    throw new Error(data.message || "This action could not be completed.");
  return data;
}
export function parseSummary(value: unknown): Summary {
  let obj: unknown = value;
  if (typeof value === "string") {
    try {
      obj = JSON.parse(
        value
          .replace(/^```(?:json)?\s*/i, "")
          .replace(/\s*```$/, "")
          .trim(),
      );
    } catch {
      return {
        overview: "",
        keyPoints: [],
        actionItems: [],
        decisions: [],
        raw: value,
      };
    }
  }
  if (!obj || typeof obj !== "object" || Array.isArray(obj))
    return {
      overview: "",
      keyPoints: [],
      actionItems: [],
      decisions: [],
      raw: typeof value === "string" ? value : undefined,
    };
  const data = obj as Record<string, unknown>;
  const strings = (key: string) =>
    Array.isArray(data[key])
      ? (data[key] as unknown[]).filter(
          (v): v is string => typeof v === "string",
        )
      : [];
  if (
    !["overview", "keyPoints", "actionItems", "decisions"].some(
      (k) => k in data,
    )
  )
    return {
      overview: "",
      keyPoints: [],
      actionItems: [],
      decisions: [],
      raw: typeof value === "string" ? value : JSON.stringify(value, null, 2),
    };
  return {
    overview: typeof data.overview === "string" ? data.overview : "",
    keyPoints: strings("keyPoints"),
    actionItems: strings("actionItems"),
    decisions: strings("decisions"),
  };
}
export const backend = {
  sendOtp: (email: string) =>
    api
      .post<{ message: string }>("/api/auth/send-otp", { email })
      .then((r) => r.data),
  login: (email: string, password: string) =>
    api
      .post<{ accessToken: string; message: string }>("/api/auth/login", {
        email,
        password,
      })
      .then((r) => r.data),
  signup: (email: string, password: string, otp: string) =>
    api
      .post<{ accessToken: string; message: string }>("/api/auth/signup", {
        email,
        password,
        otp,
      })
      .then((r) => r.data),
  logout: () => api.post("/api/auth/logout"),
  me: () => api.get<User>("/api/user/me").then((r) => r.data),
  updateName: (id: string, newName: string) =>
    api
      .post<Result>("/api/user/update-user", { id, newName })
      .then((r) => requireSuccess(r.data)),
  stats: () =>
    api
      .get<Result & { dashboardStats: Stats }>("/api/user/get-dashboard-stats")
      .then((r) => requireSuccess(r.data).dashboardStats),
  activeHosted: () =>
    api
      .get<
        Result & {
          myMeetings: { id: string; title: string; type: "paid" | "free" }[];
        }
      >("/api/user/get-dashboard-allmeetings")
      .then((r) => requireSuccess(r.data).myMeetings),
  meetings: (userId: string) =>
    api
      .get<Result & { meetings: Meeting[]; purchases: string[] }>(
        "/api/meeting/get-meetings",
        { params: { userId } },
      )
      .then((r) => requireSuccess(r.data)),
  bookings: (userId: string) =>
    api
      .get<Result & { bookings: Booking[] }>(
        "/api/meeting/get-booked-meetings",
        { params: { userId } },
      )
      .then((r) => requireSuccess(r.data).bookings),
  payments: (userId: string) =>
    api
      .get<Result & { payments: Payment[] }>("/api/payment/get-payments", {
        params: { userId },
      })
      .then((r) => requireSuccess(r.data).payments),
  setup: (data: SetupMeeting) =>
    api
      .post<Result>("/api/meeting/setup-meeting", data)
      .then((r) => requireSuccess(r.data)),
  deleteMeeting: (meetingCode: string, userId: string, isComplete: boolean) =>
    api
      .post<Result>("/api/meeting/delete-meeting", {
        meetingCode,
        userId,
        isComplete,
      })
      .then((r) => requireSuccess(r.data)),
  validateAccess: (userId: string, meetingCode: string) =>
    api
      .get<Result>("/api/meeting/validate-access", {
        params: { userId, meetingCode },
      })
      .then((r) => requireSuccess(r.data)),
  protection: (userId: string, meetingCode: string) =>
    api
      .get<Result & { isProtected: boolean }>("/api/meeting/get-isProtected", {
        params: { userId, meetingCode },
      })
      .then((r) => requireSuccess(r.data).isProtected),
  password: (meetingPassword: string, meetingCode: string) =>
    api
      .post<Result & { isMatched: boolean }>(
        "/api/meeting/get-meeting-validation",
        { meetingPassword, meetingCode },
      )
      .then((r) => {
        requireSuccess(r.data);
        if (!r.data.isMatched)
          throw new Error("That meeting password is incorrect.");
        return r.data;
      }),
  purchase: (userId: string, meetingId: string) =>
    api
      .post<Result>("/api/payment/demo-payment", { userId, meetingId })
      .then((r) => requireSuccess(r.data)),
  insights: (meetingCode: string) =>
    api
      .get<
        Result & {
          summary: string;
          meeting: {
            title?: string;
            startingTime?: string;
            summary?: { transcription?: unknown };
          };
        }
      >(`/api/meeting/summary/${encodeURIComponent(meetingCode)}`)
      .then((r) => {
        const data = requireSuccess(r.data);
        return {
          summary: parseSummary(data.summary),
          title: data.meeting?.title || "Meeting insights",
          date: data.meeting?.startingTime || "",
          transcription:
            typeof data.meeting?.summary?.transcription === "string"
              ? data.meeting.summary.transcription
              : "",
        } satisfies SavedInsights;
      }),
  summarize: (
    meetingCode: string,
    audio: Blob,
    name = "meeting-audio.webm",
  ) => {
    const form = new FormData();
    form.append("audio", audio, name);
    return api
      .post<Result & { message: string }>(
        `/api/meeting/summarize/${encodeURIComponent(meetingCode)}`,
        form,
        { timeout: 180000 },
      )
      .then((r) => parseSummary(requireSuccess(r.data).message));
  },
  chat: (meetingCode: string, question: string) =>
    api
      .post<Result & { answer: string }>(
        `/api/meeting/chat/${encodeURIComponent(meetingCode)}`,
        { question },
      )
      .then((r) => requireSuccess(r.data).answer),
  videoToken: (userId: string, name: string) =>
    api
      .post<Result & { token: string; apiKey: string }>("/api/meeting/token", {
        userId,
        name,
      })
      .then((r) => requireSuccess(r.data)),
};
export const currency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value || 0);
export const dateLabel = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Time unavailable"
    : date.toLocaleString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
};
