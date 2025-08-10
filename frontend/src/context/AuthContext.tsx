import { createContext, useContext, type ReactNode } from "react";
import api from "../lib/axios";
import { useAuthStore } from "@/store/authStore";
import { useUserStore } from "@/store/userStore";

type AuthContextType = {
  accessToken: string | null;
  user: any;
  signup: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  handleGoogleAuth: () => Promise<void>;
  getUserInfo: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const { user, clearUser, setUser } = useUserStore();

  const { } = useAuthStore()

  const getUserInfo = async () => {
    try {
      const res = await api.get("/api/user/me");
      const userData = res.data;

      if (!userData) {
        alert("User not found");
        return;
      }
      setUser(userData);
    } catch (err) {
      console.error("Error fetching user info:", err);
    }
  };

  const signup = async (email: string, password: string) => {
    if (!email || !password) {
      alert("Please fill all the entries");
      return;
    }

    try {
      const res = await api.post("/api/auth/signup", { email, password });
      const { accessToken } = res.data;
      setAccessToken(accessToken);
      localStorage.setItem("accessToken", accessToken);

      // Set default Authorization for future requests
      api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
      getUserInfo();
      
    } catch (err) {
      console.error(err);
      alert("Signup failed");
    }
  };

  const login = async (email: string, password: string) => {
    if (!email || !password) {
      alert("Please fill all the entries");
      return;
    }

    try {
      const res = await api.post("/api/auth/login", { email, password });
      const { accessToken } = res.data;
      setAccessToken(accessToken);
      localStorage.setItem("accessToken", accessToken);

      api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
      getUserInfo();
    } catch (err) {
      console.error(err);
      alert("Login failed");
    }
  };

  const googleOAuth = async () => {
    try {
      window.location.href = "http://localhost:3000/api/auth/google"
    } catch (err) {
      console.log(err);
      alert("Failed to sign-in with google")
    }
  }

  const handleGoogleAuth = async () => {
    await googleOAuth();
  
  }


  const logout = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch (err) {
      console.error("Logout error", err);
    } finally {
      setAccessToken(null);
      clearUser();
      localStorage.removeItem("accessToken");
      delete api.defaults.headers.common["Authorization"];
    }
  };

  return (
    <AuthContext.Provider value={{ accessToken, signup, user, logout, login, handleGoogleAuth, getUserInfo }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
