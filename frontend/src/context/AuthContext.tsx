import { createContext, useContext, useState, type ReactNode } from "react";
import api from "../lib/axios";

type AuthContextType = {
  accessToken: string | null;
  user: any;
  signup: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [accessToken, setAccessToken] = useState<string | null>(
    () => localStorage.getItem("accessToken")
  );
  const [user, setUser] = useState<any>(null);

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
    } catch (err) {
      console.error(err);
      alert("Login failed");
    }
  };

  const logout = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch (err) {
      console.error("Logout error", err);
    } finally {
      setAccessToken(null);
      localStorage.removeItem("accessToken");
      delete api.defaults.headers.common["Authorization"];
    }
  };

  return (
    <AuthContext.Provider value={{ accessToken, signup, user, logout, login }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
