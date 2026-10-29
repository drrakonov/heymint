import { ArrowRight, ArrowUpRight, CalendarClock, CheckCheck, Globe2, LockKeyhole, Plus, Video, Sparkles, Link2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/axios";
import { useUserStore } from "@/store/userStore";
import PageHeader from "../workspace/PageHeader";

type Meeting = { meetingId:string; title:string; meetingCode:string; createdById:string; isComplete:boolean; isExpired?:boolean; isDraft?:boolean; isProtected:boolean; meetingTime:string; canAccessInsights:boolean; hostName:string; isInstant:boolean };
export default function Dashboard() {
  const user=useUserStore(state=>state.user);
  const [meetings,setMeetings]=useState<Meeting[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(false);
  const [reload,setReload]=useState(0);
  useEffect(()=>{let cancelled=false;setLoading(true);setError(false);api.get('/api/meeting/get-meetings').then(res=>{if(!cancelled)setMeetings(res.data.meetings || []);}).catch(()=>{if(!cancelled)setError(true);}).finally(()=>{if(!cancelled)setLoading(false);});return()=>{cancelled=true;};},[reload]);
  const mine=meetings.filter(m=>m.createdById===user?.id);
  const upcoming=mine.filter(m=>!m.isComplete && !m.isExpired && !m.isDraft).sort((a,b)=>new Date(a.meetingTime).getTime()-new Date(b.meetingTime).getTime());
  const completed=meetings.filter(m=>m.isComplete&&m.canAccessInsights).sort((a,b)=>new Date(b.meetingTime).getTime()-new Date(a.meetingTime).getTime());
  const stats=[{label:"Your meetings",value:mine.length,icon:Video},{label:"Upcoming rooms",value:upcoming.length,icon:CalendarClock},{label:"Past conversations",value:completed.length,icon:CheckCheck}];
  return <div className="page-shell">
    <PageHeader eyebrow="Workspace overview" title={`Welcome back, ${user?.name?.split(' ')[0] || 'there'}.`} description="A place for your next conversation. A home for everything after it." action={<span className="hidden items-center gap-2 text-xs text-text-secondary md:flex"><CalendarClock size={14}/>{new Date().toLocaleDateString(undefined,{month:'short',day:'numeric',weekday:'short'})}</span>}/>
    <section className="grid gap-4 md:grid-cols-[1.5fr_1fr]">
      <div className="workspace-panel relative flex min-h-56 items-center overflow-hidden p-6 sm:p-8" style={{background:'radial-gradient(ellipse at 100% 0%, #66bb9130, transparent 65%), linear-gradient(130deg,#183126,#0e1b15)'}}>
        <div className="relative z-10 max-w-sm"><span className="mb-4 flex items-center gap-2 text-[11px] text-primary"><span className="h-1.5 w-1.5 rounded-full bg-primary"/> ROOM FOR YOUR NEXT IDEA</span><h2 className="text-[28px] font-semibold leading-tight tracking-tight">Great things start<br/>with a conversation.</h2><Link to="/dashboard/addmeeting" className="workspace-action mint-button mt-6"><Plus size={16}/> Create a meeting</Link></div>
        <Video className="pointer-events-none absolute -right-5 bottom-4 h-40 w-40 -rotate-12 text-primary/[.06]" strokeWidth={.7}/>
      </div>
      <div className="workspace-panel flex flex-col justify-between p-6 sm:p-8"><span className="section-icon"><Link2 size={20}/></span><div><h2 className="mt-4 text-lg font-semibold">Have an invite?</h2><p className="mt-2 text-sm leading-6 text-text-secondary">Jump into a room with its link or meeting code.</p></div><Link to="/dashboard/joinmeeting" className="mt-5 flex items-center justify-between border-t border-white/8 pt-4 text-sm font-medium text-primary">Join a meeting <ArrowRight size={16}/></Link></div>
    </section>
    <section className="my-6 grid grid-cols-3 divide-x divide-white/8 rounded-2xl border border-white/8 bg-white/[.015]">{stats.map(({label,value,icon:Icon})=><div key={label} className="px-3 py-5 sm:px-6"><div className="flex items-center justify-between gap-2"><p className="text-2xl font-semibold tracking-tight">{loading||error ? '—' : value}</p><Icon className="hidden text-text-secondary/60 sm:block" size={17}/></div><p className="mt-1 text-[11px] text-text-secondary sm:text-xs">{label}</p></div>)}</section>
    {error ? <div role="alert" className="workspace-panel p-6"><p className="text-sm">We couldn’t load your meetings.</p><button onClick={()=>setReload(v=>v+1)} className="mt-3 text-sm text-primary">Try again</button></div> : <div className="grid items-start gap-6 xl:grid-cols-[1.4fr_1fr]">
      <section className="workspace-panel"><div className="panel-heading"><h2>Your upcoming rooms</h2><Link to="/dashboard/meetings" className="flex items-center gap-1 text-xs text-text-secondary hover:text-primary">View all <ArrowUpRight size={14}/></Link></div>
        {loading ? <div className="h-44 animate-pulse bg-white/[.02]" aria-label="Loading meetings"/> : upcoming.length ? upcoming.slice(0,4).map(m=><Link key={m.meetingId} to={`/dashboard/meetings?search=${encodeURIComponent(m.title)}`} className="workspace-data-row"><span className="section-icon"><Video size={17}/></span><div className="min-w-0 flex-1"><h3 className="truncate text-sm font-medium">{m.title}</h3><p className="mt-1 text-xs text-text-secondary">{m.isInstant ? 'Instant room' : new Date(m.meetingTime).toLocaleString(undefined,{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</p></div>{m.isProtected ? <LockKeyhole size={14} className="text-text-secondary"/> : <Globe2 size={14} className="text-text-secondary"/>}<ArrowUpRight size={15} className="text-primary"/></Link>) : <div className="workspace-empty"><CalendarClock size={27} className="mb-4 text-primary/60"/><h3 className="text-sm font-medium">Your next meeting starts here.</h3><p className="mt-2 text-xs leading-5 text-text-secondary">Create a room now or schedule a conversation for later.</p><Link to="/dashboard/addmeeting" className="mt-5 text-xs font-medium text-primary">Create your first room <span aria-hidden="true">→</span></Link></div>}
      </section>
      <section className="workspace-panel"><div className="panel-heading"><h2 className="flex items-center gap-2"><Sparkles size={15} className="text-primary"/> Meeting memory</h2><Link to="/dashboard/meetings?tab=past" className="text-xs text-text-secondary hover:text-primary">Explore</Link></div>{loading ? <div className="h-44 animate-pulse bg-white/[.02]"/> : completed.length ? completed.slice(0,3).map(m=><Link to={`/meeting/${m.meetingCode}/insights`} key={m.meetingId} className="workspace-data-row"><div className="min-w-0 flex-1"><h3 className="truncate text-sm font-medium">{m.title}</h3><p className="mt-1 text-xs text-text-secondary">{new Date(m.meetingTime).toLocaleDateString(undefined,{month:'short',day:'numeric'})} · Open summary & chat</p></div><ArrowUpRight size={16} className="text-primary"/></Link>) : <div className="workspace-empty"><Sparkles size={27} className="mb-4 text-primary/60"/><h3 className="text-sm font-medium">Keep the useful parts.</h3><p className="mt-2 text-xs leading-5 text-text-secondary">After a meeting, return here for its summary, decisions, and conversation.</p></div>}</section>
    </div>}
  </div>;
}
