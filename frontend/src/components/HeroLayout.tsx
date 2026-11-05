import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { ArrowUpRight } from "lucide-react";
import BrandLogo from "./BrandLogo";
import { useAuthStore } from "@/store/authStore";

export default function HeroLayout() {
  const setAccessToken = useAuthStore(s=>s.setAccessToken);
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(()=>{ const token=new URLSearchParams(location.search).get("access"); if(token){setAccessToken(token);localStorage.setItem("accessToken",token);window.history.replaceState({},document.title,window.location.pathname+window.location.hash);navigate("/dashboard");}},[location,setAccessToken,navigate]);
  return <div className="min-h-screen bg-[#090a0b]">
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[.08] bg-[#090a0b] px-4 sm:px-8">
      <nav className="mx-auto flex h-18 max-w-6xl items-center justify-between gap-6">
        <a href="#top" className="relative" aria-label="HeyMint home"><BrandLogo className="w-24 sm:w-28"/></a>
        <div className="relative hidden items-center gap-7 text-xs text-white/60 md:flex"><a href="#experience" className="hover:text-white">Why HeyMint</a><a href="#demo" className="hover:text-white">Try the preview</a><a href="#privacy" className="hover:text-white">Privacy</a></div>
        <Link to="/auth/login" className="mint-button relative flex items-center gap-1.5 min-h-11 rounded-md px-4 py-2 text-xs font-semibold">Get started <ArrowUpRight size={14}/></Link>
      </nav>
    </header>
    <main><Outlet/></main>
    <footer className="border-t border-white/[.06] bg-[#0e0f11] px-5 py-10 text-white/45"><div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><a href="#top" aria-label="HeyMint home"><BrandLogo className="w-24"/></a><p className="text-xs">Meet. Remember. Move forward.</p><div className="flex gap-6 text-xs"><a href="#experience">Why HeyMint</a><Link to="/auth/login">Sign in</Link></div></div></footer>
  </div>;
}
