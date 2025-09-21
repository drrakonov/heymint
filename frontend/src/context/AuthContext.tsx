import { createContext, useContext, useEffect, type ReactNode } from "react";
import api from "../lib/axios";
import { useAuthStore } from "@/store/authStore";
import { useUserStore } from "@/store/userStore";
import toast from 'react-hot-toast';

type AuthContextType = {
  accessToken: string | null;
  user: any;
  signup: (email: string, password: string, otp: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  handleGoogleAuth: () => Promise<void>;
  setAccessToken: (token: string) => void;
};

type User = {
  id: string,
  name: string,
  email: string,
  provider: string,
  streamToken: string,
  apiKey: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const { user, clearUser, setUser } = useUserStore();

  useEffect(() => {
    if (accessToken) {
      getUserInfo();
    }
  }, [accessToken]);

  const getUserInfo = async () => {
    try {
      const res = await api.get("/api/user/me");
      const userData = res.data;

      if (!userData) {
        toast.error("User not found");
        return;
      }
      const tokenRes = await api.post("/api/meeting/token", { userId: userData.id, name: userData.name });
      const tokenAndAPIkey = tokenRes.data

      const UserGot: User = {
        name: userData.name,
        id: userData.id,
        email: userData.email,
        provider: userData.provider,
        streamToken: tokenAndAPIkey.token,
        apiKey: tokenAndAPIkey.apiKey
      }

      
      setUser(UserGot);
    } catch (err) {
      console.error("Error fetching user info:", err);
    }
  };

  const signup = async (email: string, password: string, otp: string) => {
    if (!email || !password) {
      toast.error("Please fill all the entries");
      return;
    }

    try {
      const res = await api.post("/api/auth/signup", { email, password, otp });
      const { accessToken } = res.data;
      setAccessToken(accessToken);
      api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
      
    } catch (err) {
      console.error(err);
      toast.error("Signup failed");
    }
  };

  const login = async (email: string, password: string) => {
    if (!email || !password) {
      toast.error("Please fill all the entries");
      return;
    }

    try {
      const res = await api.post("/api/auth/login", { email, password });
      const { accessToken } = res.data;
      setAccessToken(accessToken);
      localStorage.setItem("accessToken", accessToken);

      api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
    } catch (err) {
      console.error(err);
      toast.error("Login failed");
    }
  };

  const googleOAuth = async () => {
    try {
      const backendURL = import.meta.env.VITE_BACKEND_URL;
      window.location.href = `${backendURL}/api/auth/google`
    } catch (err) {
      console.log(err);
      toast.error("Failed to sign-in with google")
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
    <AuthContext.Provider value={{ accessToken, signup, user, logout, login, handleGoogleAuth, setAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
