import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000", 
  withCredentials: true
});

// Add interceptor
api.interceptors.response.use(
  res => res,
  async err => {
    const originalRequest = err.config;

    if (err.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshRes = await axios.post(
          "api/auth/refresh",
          {},
          {
            baseURL: "http://localhost:3000",
            withCredentials: true,
          }
        );

        const newAccessToken = refreshRes.data.accessToken;

        // Update default and request header
        api.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        // redirect to login if refresh also fails
        window.location.href = "/auth";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(err);
  }
);

export default api;
