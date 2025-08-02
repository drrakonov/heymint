import { createContext, useContext, useState, type ReactNode } from "react";
import axios from "axios";

// Define the types for AuthContext
type AuthContextType = {
  accessToken: string | null;
  user: any; // you can define a User type instead of any
  signup: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
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
      const res = await axios.post(
        "http://localhost:3000/api/auth/signup",
        {
          email,
          password
        },
        {
          withCredentials: true
        }
      );

      const { accessToken, message } = res.data;
      setAccessToken(accessToken);
      localStorage.setItem("accessToken", accessToken);
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };


  const login = async (email: string, password: string) => {
    if (!email || !password) {
      alert("Please fill all the entries");
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:3000/api/auth/login",
        {
          email,
          password
        }, {
          withCredentials: true
        }
      );

      const { accessToken, message } = res.data;
      setAccessToken(accessToken);
      localStorage.setItem("accessToken", accessToken);
    }catch(err) {
      console.error(err);
      alert("Something went wrong");
    }
  }

  const logout = async () => {
    const token = localStorage.getItem("accessToken");

    await axios.post(
      "http://localhost:3000/api/auth/logout",
      {},
      {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setAccessToken(null);
    localStorage.removeItem("accessToken");
  };


  return (
    <AuthContext.Provider value={{ accessToken, signup, user, logout, login }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
