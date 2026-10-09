import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "@/lib/router";
import {
  ArrowRight,
  ArrowUpRight,
  Eye,
  EyeOff,
  ShieldCheck,
  Quote,
  Video,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Brand, Pending, ErrorState } from "@/components/heymint/common";
import { useAuth } from "@/context/AuthContext";
import { backend, errorMessage, safeReturn } from "@/lib/api";
export function AuthPage({
  signup = false,
  returnTo,
}: {
  signup?: boolean;
  returnTo?: string;
}) {
  const { user, loading, signIn, error: sessionError } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [sending, setSending] = useState(false);
  const [expiry, setExpiry] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [error, setError] = useState("");
  useEffect(() => {
    if (user && !loading)
      void navigate({ to: safeReturn(returnTo), replace: true });
  }, [user, loading, navigate, returnTo]);
  useEffect(() => {
    if (!expiry) return;
    const update = () =>
      setRemaining(Math.max(0, Math.ceil((expiry - Date.now()) / 1000)));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [expiry]);
  const sendOtp = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address first.");
      return;
    }
    setSending(true);
    setError("");
    try {
      await backend.sendOtp(email);
      setExpiry(Date.now() + 180000);
      setOtp("");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSending(false);
    }
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setError("");
    try {
      if (signup && (!expiry || remaining <= 0))
        throw new Error(
          "Request a fresh verification code. Codes expire after 3 minutes.",
        );
      const data = signup
        ? await backend.signup(email, password, otp)
        : await backend.login(email, password);
      await signIn(data.accessToken);
      await navigate({ to: safeReturn(returnTo), replace: true });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setPending(false);
    }
  };
  const google = () => {
    sessionStorage.setItem("heymint:return", safeReturn(returnTo));
    window.location.assign(
      `${(import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "")}/api/auth/google`,
    );
  };
  return (
    <div className="auth-layout">
      <aside className="auth-story">
        <Brand />
        <div className="auth-story-content">
          <span className="eyebrow">GOOD TOGETHER.</span>
          <h2>
            A little less
            <br />
            friction.
            <br />
            <span>
              A lot more
              <br />
              connection.
            </span>
          </h2>
          <div className="auth-art" aria-hidden>
            <div />
            <span>
              <Video />
            </span>
            <span>
              <Sparkles />
            </span>
          </div>
          <Quote className="size-6 text-primary" />
          <p>
            The best ideas don’t happen alone.
            <br />
            Make a little space for what comes next.
          </p>
        </div>
        <span className="auth-story-footer">
          YOUR NEXT GOOD CONVERSATION STARTS HERE.
        </span>
      </aside>
      <main className="auth-form-side">
        <div className="auth-top">
          <Brand />
          <Link to="/">
            Back to HeyMint
            <ArrowUpRight />
          </Link>
        </div>
        <div className="auth-form-wrap">
          <p className="eyebrow">
            {signup ? "A FRESH START" : "YOUR PEOPLE. YOUR PLACE."}
          </p>
          <h1>{signup ? "Make yourself at home." : "Welcome back."}</h1>
          <p className="page-description">
            {signup
              ? "Good conversations are just around the corner."
              : "Pick up right where the conversation left off."}
          </p>
          <Button
            variant="outline"
            className="google-button"
            onClick={google}
            disabled={pending}
          >
            <svg viewBox="0 0 24 24" aria-hidden>
              <path
                fill="currentColor"
                d="M21.6 12.2c0-.7-.1-1.4-.2-2.1H12v4h5.4a4.6 4.6 0 0 1-2 3v2.5h3.3c2-1.9 2.9-4.5 2.9-7.4ZM12 22c2.7 0 5-1 6.7-2.4l-3.3-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.7-5.6-4H3v2.6A10 10 0 0 0 12 22ZM6.4 14.1A6 6 0 0 1 6 12c0-.7.1-1.4.4-2.1V7.3H3A10 10 0 0 0 2 12c0 1.7.4 3.3 1 4.7l3.4-2.6ZM12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.9A9.7 9.7 0 0 0 12 2a10 10 0 0 0-9 5.3l3.4 2.6c.8-2.3 3-4 5.6-4Z"
              />
            </svg>
            Continue with Google
          </Button>
          <div className="auth-divider">
            <span />
            {signup ? "or sign up with email" : "or continue with email"}
            <span />
          </div>
          <form onSubmit={submit} className="form-stack">
            <label className="field-label">
              Email address
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setExpiry(0);
                  setOtp("");
                }}
                disabled={pending || sending}
              />
            </label>
            <label className="field-label">
              Password
              <div className="password-field">
                <input
                  type={visible ? "text" : "password"}
                  required
                  minLength={6}
                  autoComplete={signup ? "new-password" : "current-password"}
                  placeholder={
                    signup ? "At least 6 characters" : "Your password"
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={pending}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setVisible(!visible)}
                  aria-label={visible ? "Hide password" : "Show password"}
                >
                  {visible ? <EyeOff /> : <Eye />}
                </Button>
              </div>
            </label>
            {signup && (
              <div>
                <div className="otp-heading">
                  <label htmlFor="otp" className="field-label">
                    Verification code
                  </label>
                  <Button
                    variant="link"
                    size="sm"
                    type="button"
                    onClick={sendOtp}
                    disabled={sending || pending || remaining > 150}
                  >
                    {sending ? (
                      <Pending />
                    ) : expiry ? (
                      "Resend code"
                    ) : (
                      "Send code"
                    )}
                  </Button>
                </div>
                <input
                  id="otp"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  placeholder="6-digit email code"
                  autoComplete="one-time-code"
                  disabled={pending}
                />
                {expiry > 0 && (
                  <p className="field-hint" role="status">
                    {remaining > 0
                      ? `Check your inbox. Expires in ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}.`
                      : "Your code has expired. Request a new one."}
                  </p>
                )}
              </div>
            )}
            {(error || sessionError) && (
              <p className="form-error" role="alert">
                {error || sessionError}
              </p>
            )}
            <Button
              size="lg"
              type="submit"
              className="w-full"
              disabled={
                pending || sending || (signup && (!expiry || remaining <= 0))
              }
            >
              {pending ? (
                <Pending>
                  {signup ? "Creating your account" : "Signing in"}
                </Pending>
              ) : (
                <>
                  {signup ? "Create your account" : "Sign in"}
                  <ArrowRight />
                </>
              )}
            </Button>
          </form>
          <p className="auth-switch">
            {signup ? "Already part of the conversation?" : "New around here?"}{" "}
            <Link
              to={signup ? "/auth/login" : "/auth/signup"}
              search={{ returnTo: safeReturn(returnTo) }}
            >
              {signup ? "Sign in" : "Create an account"}
              <ArrowUpRight className="size-3" />
            </Link>
          </p>
          <div className="auth-trust">
            <ShieldCheck />A workspace that puts your connection first.
          </div>
        </div>
        <footer className="auth-form-footer">
          <span>HeyMint. Better, together.</span>
          <Link to="/dashboard/help">Need a hand?</Link>
        </footer>
      </main>
    </div>
  );
}
export function Callback() {
  const { user, loading, error, retry, callbackPath } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && user)
      void navigate({ to: callbackPath || "/dashboard", replace: true });
  }, [loading, user, navigate, callbackPath]);
  return (
    <div className="session-loading">
      <Brand />
      {loading ? (
        <Pending>Finishing your sign in</Pending>
      ) : (
        <ErrorState
          error={
            new Error(
              error || "No active sign-in was found. Please sign in again.",
            )
          }
          retry={retry}
        />
      )}
      <Button variant="outline" asChild>
        <Link to="/auth/login">Back to sign in</Link>
      </Button>
    </div>
  );
}
