import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import Loader from "../subComponents/Loader";
import ConnectionError from "../subComponents/ConnectionError";

// Share the exchange across StrictMode effect replays; each handoff is single-use.
let handoff: { code: string; request: Promise<void> } | undefined;
function exchange(code: string, verifier: string) {
  if (handoff?.code === code) return handoff.request;
  const request = api.post("/api/auth/google/exchange", { code, verifier }).then(({ data }) => {
    if (typeof data.accessToken !== "string") throw new Error("Invalid sign-in response");
    useAuthStore.getState().setAccessToken(data.accessToken);
    sessionStorage.removeItem("googleVerifier");
  });
  handoff = { code, request };
  return request;
}
export default function AuthRedirect() {
  const navigate = useNavigate();
  const [error, setError] = useState(false);
  const [credentials] = useState(() => ({
    code: new URLSearchParams(window.location.hash.slice(1)).get("code"),
    verifier: sessionStorage.getItem("googleVerifier"),
  }));
  useEffect(() => {
    let cancelled = false;
    window.history.replaceState(null, "", window.location.pathname);
    const { code, verifier } = credentials;
    if (!code || !verifier) { setError(true); return; }
    void exchange(code, verifier).then(() => {
      if (!cancelled) navigate("/dashboard", { replace: true });
    }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [navigate, credentials]);
  return error ? <ConnectionError message="Google sign-in could not finish. Please start Google sign-in again." onExit={() => navigate("/auth/login")} /> : <Loader />;
}
