import axios from "axios";
import { jwtDecode } from "jwt-decode";

interface JwtPayload {
  exp: number;
}

const api = axios.create({
  baseURL: "http://localhost:3000",
  withCredentials: true,
});

// -----------------------------
// State
// -----------------------------
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];
let refreshTimer: NodeJS.Timeout | null = null;

// -----------------------------
// Helpers
// -----------------------------
function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function scheduleTokenRefresh(token: string) {
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    const expiresAt = decoded.exp * 1000; // exp is in seconds
    const now = Date.now();

    // Refresh 1 minute before expiry
    const refreshIn = expiresAt - now - 60_000;

    if (refreshTimer) clearTimeout(refreshTimer);

    if (refreshIn > 0) {
      refreshTimer = setTimeout(refreshAccessToken, refreshIn);
      console.log(`⏳ Scheduled token refresh in ${refreshIn / 1000}s`);
    } else {
      // Already expired → refresh immediately
      refreshAccessToken();
    }
  } catch (err) {
    console.error("Failed to decode JWT", err);
  }
}

async function refreshAccessToken() {
  if (isRefreshing) return; // prevent parallel calls
  isRefreshing = true;

  try {
    const { data } = await api.post("/api/auth/refresh");
    const newToken = data.accessToken;

    // Save new token
    localStorage.setItem("accessToken", newToken);
    api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;

    // Schedule proactive refresh again
    scheduleTokenRefresh(newToken);

    // Resolve any queued requests
    onRefreshed(newToken);
  } catch (err) {
    console.error("Refresh token failed", err);
    localStorage.removeItem("accessToken"); // <-- Remove token!
    if (window.location.pathname !== "/auth") {
      window.location.href = "/auth/login";
    }
  } finally {
    isRefreshing = false;
  }
}

// -----------------------------
// Interceptor (reactive)
// -----------------------------
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          addRefreshSubscriber((token: string) => {
            originalRequest.headers["Authorization"] = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;

      try {
        await refreshAccessToken();
        const token = localStorage.getItem("accessToken");
        if (token) {
          originalRequest.headers["Authorization"] = `Bearer ${token}`;
        }
        return api(originalRequest);
      } catch (err) {
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

// -----------------------------
// Initialization
// -----------------------------
const token = localStorage.getItem("accessToken");
if (token) {
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    const expiresAt = decoded.exp * 1000;
    const now = Date.now();
    if (expiresAt > now) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      scheduleTokenRefresh(token);
    } else {
      localStorage.removeItem("accessToken");
    }
  } catch (err) {
    localStorage.removeItem("accessToken");
  }
}

export default api;
