import { useEffect, useState, type ReactNode, type FormEvent } from "react";
import { Link } from "@/lib/router";
import { LockKeyhole, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { backend, errorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ErrorState, Pending, Brand } from "@/components/heymint/common";
export function AccessGate({
  code,
  children,
}: {
  code: string;
  children: ReactNode;
}) {
  const { user } = useAuth();
  const [state, setState] = useState<
    "loading" | "password" | "ready" | "error"
  >("loading");
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let alive = true;
    setState("loading");
    setError("");
    if (!user) return;
    (async () => {
      try {
        await backend.validateAccess(user.id, code);
        const protectedRoom = await backend.protection(user.id, code);
        if (alive) setState(protectedRoom ? "password" : "ready");
      } catch (e) {
        if (alive) {
          setError(errorMessage(e));
          setState("error");
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [user, code, attempt]);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (pending || !user) return;
    setPending(true);
    setError("");
    try {
      await backend.validateAccess(user.id, code);
      await backend.password(password, code);
      setPassword("");
      setState("ready");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setPending(false);
    }
  };
  if (state === "ready") return <>{children}</>;
  return (
    <div className="permission-gate">
      <Brand />
      {state === "loading" ? (
        <div className="py-16">
          <Pending>Checking your meeting access</Pending>
        </div>
      ) : state === "error" ? (
        <>
          <ErrorState
            error={new Error(error)}
            retry={() => setAttempt((a) => a + 1)}
          />
          <Button variant="outline" asChild>
            <Link to="/dashboard/meetings">Back to meetings</Link>
          </Button>
        </>
      ) : (
        <>
          <LockKeyhole className="text-primary mt-8" />
          <h1>A little privacy. A good conversation.</h1>
          <p>This room is protected. Enter the password shared by your host.</p>
          <form onSubmit={submit} className="form-stack">
            <label className="field-label">
              Meeting password
              <input
                required
                type="password"
                maxLength={30}
                autoComplete="off"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={pending}
              />
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" disabled={pending}>
              {pending ? (
                <Pending>Checking</Pending>
              ) : (
                <>
                  Continue
                  <ArrowRight />
                </>
              )}
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
