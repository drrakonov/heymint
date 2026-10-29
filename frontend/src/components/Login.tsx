import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import PasswordInput from "./subComponents/PasswordInput";
import google from "@/assets/logo/google.svg";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, handleGoogleAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;
  const destination = typeof from === "string" && from.startsWith("/") && !from.startsWith("//") ? from : "/dashboard";

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (await login(email.trim(), password)) navigate(destination, { replace: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  return <section>
    <span className="eyebrow">Welcome back</span>
    <h1 className="mt-3 text-4xl font-semibold tracking-tight">Your next chapter.</h1>
    <p className="mt-3 text-sm leading-6 text-text-secondary">Sign in to your meetings and everything they leave behind.</p>
    <button type="button" onClick={handleGoogleAuth} className="glass-control mt-8 flex h-12 w-full items-center justify-center gap-3 rounded-xl text-sm font-medium"><img src={google} alt="" className="h-5 w-5"/> Continue with Google</button>
    <div className="my-6 flex items-center gap-4 text-[11px] text-text-secondary"><span className="h-px flex-1 bg-white/10"/>or use your email<span className="h-px flex-1 bg-white/10"/></div>
    <form onSubmit={submit} className="space-y-5">
      <div><label htmlFor="login-email" className="mb-2 block text-sm font-medium">Email address</label><input id="login-email" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" className="glass-input w-full px-4 py-3 text-sm"/></div>
      <div><label htmlFor="password" className="mb-2 block text-sm font-medium">Password</label><PasswordInput value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password"/></div>
      <button type="submit" disabled={isSubmitting} className="mint-button flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold disabled:opacity-50">{isSubmitting ? "Signing in…" : <>Sign in <ArrowRight size={16}/></>}</button>
    </form>
    <p className="mt-7 text-center text-sm text-text-secondary">New to HeyMint? <Link to="/auth/signup" className="font-medium text-primary hover:underline">Create an account</Link></p>
  </section>;
}
