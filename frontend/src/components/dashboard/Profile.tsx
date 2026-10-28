import { ArrowUpRight, Edit3, LogOut, Mail, ShieldCheck, UserRound, LockKeyhole, Globe2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { useAvatarStore } from "@/store/avatarStore";
import { avatarList } from "@/lib/constants";
import { useUserStore } from "@/store/userStore";
import { useState } from "react";
import PageHeader from "../workspace/PageHeader";

export default function Profile() {
  const {logout} = useAuth();
  const user = useUserStore(state => state.user);
  const avatar = useAvatarStore(state => state.activeAvatarIndex);
  const [loggingOut, setLoggingOut] = useState(false);
  return <div className="page-shell">
    <PageHeader eyebrow="Your account" title="Make yourself at home." description="Your identity, your workspace, your conversations."/>
    <div className="grid items-start gap-6 lg:grid-cols-[1.6fr_1fr]">
      <div className="space-y-6">
        <section className="workspace-panel">
          <div className="account-banner"><span className="absolute left-6 top-5 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[.18em] text-primary/70"><ShieldCheck size={13}/> Personal workspace</span></div>
          <div className="relative px-6 pb-6">
            <Avatar className="-mt-9 h-20 w-20 rounded-2xl border-4 border-[#102019] bg-[#1b3025]"><AvatarImage src={avatarList[avatar]}/><AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback></Avatar>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4"><div className="min-w-0"><h2 className="break-words text-2xl font-semibold tracking-tight">{user?.name}</h2><p className="mt-1 break-all text-sm text-text-secondary">{user?.email}</p></div><Link to="/dashboard/profile-update" className="workspace-action glass-control"><Edit3 size={15}/> Edit profile</Link></div>
          </div>
        </section>
        <section className="workspace-panel">
          <div className="panel-heading"><h2>Account details</h2><span className="text-[11px] text-text-secondary">Visible only to you</span></div>
          {[{icon:UserRound,label:"Display name",value:user?.name,note:"How you appear in meetings"},{icon:Mail,label:"Email address",value:user?.email,note:"The email associated with your account"},{icon:ShieldCheck,label:"Sign-in method",value:user?.provider === "google" ? "Google" : "Email and password",note:"Used to sign in to HeyMint"}].map(({icon:Icon,label,value,note})=><div className="account-detail" key={label}><Icon className="mt-1 shrink-0 text-text-secondary" size={17}/><div className="min-w-0 flex-1"><p className="text-xs text-text-secondary">{label}</p><p className="mt-1 break-words text-sm font-medium">{value}</p><p className="mt-1 text-xs text-text-secondary/70">{note}</p></div></div>)}
        </section>
      </div>
      <div className="space-y-6">
        <section className="workspace-panel p-6"><span className="section-icon"><LockKeyhole size={19}/></span><h2 className="mt-5 text-lg font-semibold tracking-tight">Your meeting privacy</h2><p className="mt-2 text-sm leading-6 text-text-secondary">Access follows the room you join.</p><div className="mt-5 space-y-5"><div className="flex gap-3"><LockKeyhole size={16} className="mt-1 shrink-0 text-primary"/><div><h3 className="text-sm font-medium">Protected meetings</h3><p className="mt-1 text-xs leading-5 text-text-secondary">Insights are available to the host and verified past participants.</p></div></div><div className="flex gap-3"><Globe2 size={16} className="mt-1 shrink-0 text-primary"/><div><h3 className="text-sm font-medium">Free meetings</h3><p className="mt-1 text-xs leading-5 text-text-secondary">Any signed-in user can explore the summary and meeting chat.</p></div></div></div><Link to="/dashboard/help" className="mt-6 flex items-center gap-2 border-t border-white/8 pt-4 text-xs text-primary">About meeting access <ArrowUpRight size={13}/></Link></section>
        <section className="workspace-panel p-6"><h2 className="text-sm font-semibold">Done for now?</h2><p className="mt-2 text-xs leading-5 text-text-secondary">Sign out of HeyMint on this browser.</p><button disabled={loggingOut} onClick={async()=>{setLoggingOut(true);try{await logout();}finally{setLoggingOut(false);}}} className="workspace-action mt-5 border border-white/10 text-text-secondary hover:border-danger/30 hover:text-danger"><LogOut size={15}/>{loggingOut ? "Signing out…" : "Sign out"}</button></section>
      </div>
    </div>
  </div>;
}
