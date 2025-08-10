import { create } from "zustand";
import api from "@/lib/axios";

interface AuthState {
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: localStorage.getItem("accessToken"),
  setAccessToken: (token) => {
    if (token) {
      localStorage.setItem("accessToken", token);
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      localStorage.removeItem("accessToken");
      delete api.defaults.headers.common["Authorization"];
    }

    set({ accessToken: token });
  },
}));
