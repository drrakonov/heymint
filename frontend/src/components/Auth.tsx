import { Link, Outlet } from "react-router-dom";
import { ArrowLeft, ArrowRight, Video, FileText, MessageSquare } from "lucide-react";
import BrandLogo from "./BrandLogo";

export default function AuthLayout() {
  return (
    <div className="auth-layout mint-app-bg min-h-dvh text-text-primary">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 sm:px-10">
        <Link to="/" aria-label="HeyMint home"><BrandLogo className="w-28 sm:w-32"/></Link>
        <Link to="/" className="flex items-center gap-2 text-xs text-text-secondary hover:text-white"><ArrowLeft size={14}/> Back to home</Link>
      </header>
      <main className="mx-auto grid w-full max-w-7xl items-center gap-12 px-6 pb-12 pt-4 sm:px-10 lg:min-h-[calc(100dvh-100px)] lg:grid-cols-2 lg:gap-20 lg:py-12">
        <div className="mx-auto w-full max-w-[420px]"><Outlet/></div>
        <aside className="hidden lg:block">
          <div className="workspace-panel overflow-hidden p-9 xl:p-12" style={{background:'radial-gradient(ellipse at 100% 0%, #67c69c26, transparent 70%), #0c1b14'}}>
            <span className="eyebrow">Meet. Remember. Move forward.</span>
            <h2 className="mt-6 text-5xl font-semibold leading-[1.08] tracking-[-.05em]">Good conversations<br/><span className="text-primary">stay with you.</span></h2>
            <p className="mt-5 max-w-sm text-sm leading-6 text-text-secondary">A place to meet, capture what matters, and pick up exactly where you left off.</p>
            <div className="mt-12 space-y-3">
              {[{icon:Video,title:'A room for your people',text:'Instant and scheduled video meetings.'},{icon:FileText,title:'The details, remembered',text:'Summaries, decisions, and next steps.'},{icon:MessageSquare,title:'Keep asking questions',text:'Answers grounded in your meeting.'}].map(({icon:Icon,title,text},index)=><div key={title} className="flex items-center gap-4 rounded-2xl border border-white/8 bg-white/[.025] p-4"><span className="section-icon"><Icon size={18}/></span><div className="flex-1"><h3 className="text-sm font-medium">{title}</h3><p className="mt-1 text-xs text-text-secondary">{text}</p></div><span className="text-xs text-primary/40">0{index+1}</span></div>)}
            </div>
            <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-5 text-xs text-text-secondary"><span>From conversation to clarity.</span><ArrowRight size={16} className="text-primary"/></div>
          </div>
        </aside>
      </main>
    </div>
  );
}
