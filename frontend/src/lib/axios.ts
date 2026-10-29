import axios from "axios";
import { useAuthStore } from "@/store/authStore";

const options = { baseURL: "/", withCredentials: true, timeout: 15_000 };
const api = axios.create(options);
// Refresh must never pass through the interceptor that waits for refresh.
const sessionApi = axios.create(options);
let refreshPromise: Promise<string> | null = null;

export function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    const previousToken = useAuthStore.getState().accessToken;
    refreshPromise = sessionApi.post("/api/auth/refresh")
      .then(({ data }) => {
        if (typeof data.accessToken !== "string") throw new Error("Invalid session response");
        if (useAuthStore.getState().accessToken !== previousToken) throw new Error("Session changed");
        useAuthStore.getState().setAccessToken(data.accessToken);
        return data.accessToken as string;
      })
      .catch((error: unknown) => {
        if (axios.isAxiosError(error) && [401, 403].includes(error.response?.status ?? 0)
          && useAuthStore.getState().accessToken === previousToken) {
          useAuthStore.getState().setAccessToken(null);
        }
        throw error;
      })
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  else config.headers.delete("Authorization");
  return config;
});

api.interceptors.response.use(response => response, async (error) => {
  const request = error.config;
  // A wrong login or meeting password is not an expired session.
  const excluded = /\/auth\/(login|signup|refresh|logout|send-otp|google)/.test(request?.url ?? "");
  if (!request || excluded || error.response?.status !== 401 || request._retry) throw error;
  request._retry = true;
  const currentToken = useAuthStore.getState().accessToken;
  if (!currentToken) throw error;
  // A concurrent request may already have refreshed the rejected token.
  if (request.headers.Authorization === `Bearer ${currentToken}`) await refreshAccessToken();
  return api(request);
});

export default api;
