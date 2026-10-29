import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { refreshAccessToken } from "@/lib/axios";
import Loader from "../subComponents/Loader";
import ConnectionError from "../subComponents/ConnectionError";

export default function AuthRedirect() {
  const navigate = useNavigate();
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setError(false);
    void refreshAccessToken().then(() => {
      if (!cancelled) navigate("/dashboard", { replace: true });
    }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [navigate, attempt]);
  return error ? <ConnectionError message="We couldn’t finish signing you in. Allow cookies for this site and try again." onRetry={() => setAttempt(n => n + 1)} onExit={() => navigate("/auth/login")} /> : <Loader />;
}
