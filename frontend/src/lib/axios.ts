import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000", // your backend
  withCredentials: true, // important for sending cookies
});

// Flag to prevent multiple refresh calls at the same time
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Wait until refresh finishes
        return new Promise((resolve) => {
          refreshSubscribers.push((token: string) => {
            originalRequest.headers["Authorization"] = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await api.post("/api/auth/refresh");
        const newToken = data.accessToken;

        // Store new token (localStorage or state)
        localStorage.setItem("accessToken", newToken);

        api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
        onRefreshed(newToken);
      } catch (err) {
        console.error("Refresh token failed", err);
        window.location.href = "/login";
      } finally {
        isRefreshing = false;
      }

      return api(originalRequest);
    }

    return Promise.reject(error);
  }
);

const token = localStorage.getItem("accessToken");
if (token) {
  api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

export default api;
