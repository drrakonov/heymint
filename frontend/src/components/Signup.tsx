import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import PasswordInput from "./subComponents/PasswordInput";
import Otp from "./subComponents/Otp";
import google from "@/assets/logo/google.svg";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import axios from "axios";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fillingOtp, setFillingOtp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { handleGoogleAuth } = useAuth();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await api.post("/api/auth/send-otp", { email: email.trim() });
      if (res.data.success) setFillingOtp(true);
      else toast.error("Could not send your code. Please try again.");
    } catch (error) {
      toast.error(axios.isAxiosError(error) && error.response?.status === 409
        ? "An account with this email already exists"
        : "Could not send your code. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (fillingOtp) return <Otp email={email.trim()} password={password}/>;
  return <section>
    <span className="eyebrow">Make room for more</span>
    <h1 className="mt-3 text-4xl font-semibold tracking-tight">Start something good.</h1>
    <p className="mt-3 text-sm leading-6 text-text-secondary">Create your account. Bring your next conversation to HeyMint.</p>
    <button type="button" onClick={handleGoogleAuth} className="glass-control mt-8 flex h-12 w-full items-center justify-center gap-3 rounded-xl text-sm font-medium"><img src={google} alt="" className="h-5 w-5"/> Continue with Google</button>
    <div className="my-6 flex items-center gap-4 text-[11px] text-text-secondary"><span className="h-px flex-1 bg-white/10"/>or use your email<span className="h-px flex-1 bg-white/10"/></div>
    <form onSubmit={submit} className="space-y-5">
      <div><label htmlFor="signup-email" className="mb-2 block text-sm font-medium">Email address</label><input id="signup-email" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" className="glass-input w-full px-4 py-3 text-sm"/></div>
      <div><label htmlFor="password" className="mb-2 block text-sm font-medium">Create a password</label><PasswordInput value={password} onChange={e=>setPassword(e.target.value)} required minLength={6} autoComplete="new-password"/><p className="mt-2 text-xs text-text-secondary">Use at least 6 characters.</p></div>
      <button type="submit" disabled={isSubmitting} className="mint-button flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold disabled:opacity-50">{isSubmitting ? "Sending code…" : <>Continue with email <ArrowRight size={16}/></>}</button>
    </form>
    <p className="mt-7 text-center text-sm text-text-secondary">Already have an account? <Link to="/auth/login" className="font-medium text-primary hover:underline">Sign in</Link></p>
  </section>;
}
