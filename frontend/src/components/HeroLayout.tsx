import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { ArrowUpRight } from "lucide-react";
import appLogo from "../assets/logo/heyMintLogo.png";
import { useAuthStore } from "@/store/authStore";

export default function HeroLayout() {
  const setAccessToken = useAuthStore(s=>s.setAccessToken);
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(()=>{ const token=new URLSearchParams(location.search).get("access"); if(token){setAccessToken(token);localStorage.setItem("accessToken",token);window.history.replaceState({},document.title,window.location.pathname+window.location.hash);navigate("/dashboard");}},[location,setAccessToken,navigate]);
  return <div className="min-h-screen bg-surface-bl">
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-5">
      <nav className="liquid-glass mx-auto flex h-15 max-w-6xl items-center justify-between rounded-full px-3 sm:px-5">
        <Link to="/" className="relative"><img src={appLogo} alt="HeyMint" className="w-24 sm:w-28"/></Link>
        <div className="relative hidden items-center gap-7 text-xs text-white/60 md:flex"><a href="#experience" className="hover:text-white">Experience</a><a href="#experience" className="hover:text-white">How it works</a></div>
        <Link to="/auth/login" className="mint-button relative flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold">Enter HeyMint <ArrowUpRight size={14}/></Link>
      </nav>
    </header>
    <main><Outlet/></main>
    <footer className="border-t border-white/[.06] bg-[#030806] px-5 py-10 text-white/45"><div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><img src={appLogo} alt="HeyMint" className="w-24 opacity-80"/><p className="text-xs">Meet. Remember. Move forward.</p><div className="flex gap-6 text-xs"><a href="#experience">Experience</a><Link to="/auth/login">Sign in</Link></div></div></footer>
  </div>;
}
