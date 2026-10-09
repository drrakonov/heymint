import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  backend,
  getSessionGeneration,
  errorMessage,
  refreshAccessToken,
  safeReturn,
  setToken,
  storedToken,
  type User,
} from "@/lib/api";
interface AuthValue {
  user: User | null;
  loading: boolean;
  error: string;
  callbackPath: string | null;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
  reloadUser: () => Promise<void>;
  retry: () => void;
}
const AuthContext = createContext<AuthValue | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [callbackPath, setCallbackPath] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const queryClient = useQueryClient();
  const reloadUser = useCallback(async () => {
    const next = await backend.me();
    if (!next.id)
      throw new Error("The backend returned an invalid user profile.");
    setUser(next);
  }, []);
  useEffect(() => {
    let alive = true;
    const url = new URL(window.location.href);
    const access = url.searchParams.get("access");
    if (access) {
      setToken(access);
      url.searchParams.delete("access");
      window.history.replaceState(
        window.history.state,
        "",
        url.pathname + url.search + url.hash,
      );
      setCallbackPath(
        safeReturn(
          sessionStorage.getItem("heymint:return") ||
            url.searchParams.get("returnTo"),
        ),
      );
      sessionStorage.removeItem("heymint:return");
    }
    const generation = getSessionGeneration();
    setLoading(true);
    setError("");
    (async () => {
      try {
        if (!storedToken()) {
          try {
            await refreshAccessToken();
          } catch (e) {
            if (alive && access) setError(errorMessage(e));
            return;
          }
        }
        const next = await backend.me();
        if (!next.id)
          throw new Error("The backend returned an invalid user profile.");
        if (alive && generation === getSessionGeneration()) setUser(next);
      } catch (e) {
        if (alive && generation === getSessionGeneration())
          setError(errorMessage(e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    const expire = () => {
      setUser(null);
      setError("Your session has expired. Please sign in again.");
      queryClient.clear();
    };
    window.addEventListener("heymint:session-expired", expire);
    return () => {
      alive = false;
      window.removeEventListener("heymint:session-expired", expire);
    };
  }, [attempt, queryClient]);
  const signIn = async (token: string) => {
    if (!token) throw new Error("No access token was returned by the backend.");
    setToken(token);
    queryClient.clear();
    setError("");
    await reloadUser();
  };
  const signOut = async () => {
    await backend.logout();
    setToken(null);
    setUser(null);
    setCallbackPath(null);
    setError("");
    queryClient.clear();
  };
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        callbackPath,
        signIn,
        signOut,
        reloadUser,
        retry: () => setAttempt((n) => n + 1),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("AuthProvider is required.");
  return context;
}
