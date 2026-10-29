/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { jwtDecode } from "jwt-decode";
import api from "../lib/axios";
import { useAuthStore } from "@/store/authStore";
import { useUserStore } from "@/store/userStore";
import toast from 'react-hot-toast';

type AuthContextType = {
  accessToken: string | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  retry: () => void;
  signup: (email: string, password: string, otp: string) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
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

  const [isLoading, setIsLoading] = useState(Boolean(accessToken));
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt(value => value + 1), []);
  // Token rotation keeps the same session; don't replace the user or reset a live call.
  let sessionId: string | null = null;
  if (accessToken) {
    try { sessionId = jwtDecode<{ userId: string }>(accessToken).userId || "unknown"; }
    catch { sessionId = "unknown"; }
  }
  useEffect(() => {
    if (!sessionId) { clearUser(); setIsLoading(false); setError(null); return; }
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    Promise.all([api.get("/api/user/me"), api.post("/api/meeting/token")])
      .then(([profile, credentials]) => {
        if (!cancelled) setUser({ ...profile.data, streamToken: credentials.data.token, apiKey: credentials.data.apiKey });
      })
      .catch(() => { if (!cancelled) setError("We couldn’t load your account. Check your connection and try again."); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [sessionId, attempt, clearUser, setUser]);

  const signup = async (email: string, password: string, otp: string) => {
    if (!email || !password) {
      toast.error("Please fill all the entries");
      return false;
    }

    try {
      const res = await api.post("/api/auth/signup", { email, password, otp });
      const { accessToken } = res.data;
      setAccessToken(accessToken);
      return true;
    } catch (err) {
      console.error(err);
      toast.error("Signup failed");
      return false;
    }
  };

  const login = async (email: string, password: string) => {
    if (!email || !password) {
      toast.error("Please fill all the entries");
      return false;
    }

    try {
      const res = await api.post("/api/auth/login", { email, password });
      const { accessToken } = res.data;
      setAccessToken(accessToken);

      return true;
    } catch (err) {
      console.error(err);
      toast.error("Login failed");
      return false;
    }
  };

  const googleOAuth = async () => {
    try {
      const backendURL = import.meta.env.VITE_BACKEND_URL;
      const bytes = crypto.getRandomValues(new Uint8Array(32));
      const encode = (value: Uint8Array) => btoa(String.fromCharCode(...value)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
      const verifier = encode(bytes);
      sessionStorage.setItem("googleVerifier", verifier);
      const challenge = encode(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))));
      window.location.href = `${backendURL}/api/auth/google?challenge=${challenge}`;
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
    }
  };



  return (
    <AuthContext.Provider value={{ accessToken, isLoading, error, retry, signup, user, logout, login, handleGoogleAuth, setAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
