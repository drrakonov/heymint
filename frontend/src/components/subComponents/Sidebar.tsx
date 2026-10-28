import { useSidebarStore } from "@/store/sidebarStore";
import { ChevronFirst, ChevronLast, ArrowUpRight, Sparkles } from "lucide-react";
import { createContext, useContext, type ReactNode } from "react";
import { NavLink, Link } from "react-router-dom";
import { useUserStore } from "@/store/userStore";

const SideBarContext = createContext({ expanded: true });
export default function Sidebar({ children }: { children: ReactNode }) {
  const { expanded, toggleExpanded } = useSidebarStore();
  const user = useUserStore(state => state.user);
  return <aside className={`workspace-sidebar ${expanded ? "is-expanded" : "is-collapsed"}`}>
    <div className="flex h-14 items-center justify-between px-4">
      {expanded && <span className="text-[10px] font-semibold uppercase tracking-[.18em] text-text-secondary">Workspace</span>}
      <button onClick={toggleExpanded} aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"} className="sidebar-toggle" title={expanded ? "Collapse sidebar" : "Expand sidebar"}>{expanded ? <ChevronFirst size={17}/> : <ChevronLast size={17}/>}</button>
    </div>
    <SideBarContext.Provider value={{expanded}}><nav aria-label="Workspace navigation" className="flex-1"><ul className="space-y-1 px-2">{children}</ul></nav></SideBarContext.Provider>
    {expanded && <Link to="/dashboard/help" className="sidebar-note mx-3 mb-4 rounded-2xl border border-primary/10 bg-primary/5 p-4"><Sparkles size={18} className="mb-3 text-primary"/><p className="text-sm font-medium">More from every meeting.</p><p className="mt-2 text-xs leading-5 text-text-secondary">Your guide to summaries, chat, and protected rooms.</p><span className="mt-4 flex items-center gap-2 text-xs text-primary">Explore HeyMint <ArrowUpRight size={13}/></span></Link>}
    <Link to="/dashboard/profile" className="mx-3 mb-3 flex min-w-0 items-center gap-3 rounded-xl border-t border-white/8 p-2 pt-4" title="Your profile"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">{user?.name?.charAt(0).toUpperCase() || "H"}</span>{expanded && <span className="min-w-0"><span className="block truncate text-sm font-medium">{user?.name || "Your account"}</span><span className="block text-[11px] text-text-secondary">Personal workspace</span></span>}</Link>
  </aside>;
}
export function SidebarItems({ icon, text, to }: { icon: ReactNode; text: string; to: string }) {
  const {expanded} = useContext(SideBarContext);
  return <li><NavLink to={to} end={to === "/dashboard"} aria-label={text} title={!expanded ? text : undefined} className={({isActive})=>`sidebar-link ${isActive ? "is-active" : ""} ${expanded ? "" : "justify-center"}`}><span className="shrink-0">{icon}</span>{expanded && <span>{text}</span>}</NavLink></li>;
}
