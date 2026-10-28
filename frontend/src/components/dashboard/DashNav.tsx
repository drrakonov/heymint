import { ArrowDownLeft, Plus, ChevronRight, Leaf } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import ProfileLogo from "../subComponents/ProfileLogo";
const names: Record<string,string> = { profile:"My profile", meetings:"Meetings", help:"Help center", addmeeting:"Create a meeting", joinmeeting:"Join a meeting", "profile-update":"Edit profile" };
export default function DashNav() {
  const {pathname} = useLocation();
  return <header className="workspace-topbar">
    <Link to="/dashboard" className="flex shrink-0 items-center gap-2 text-xl font-semibold tracking-tight" aria-label="HeyMint home"><span className="brand-mark"><Leaf size={19}/></span><span>hey<span className="text-primary">Mint</span><span className="text-primary">.</span></span></Link>
    <div className="ml-8 hidden items-center gap-3 text-xs text-text-secondary lg:flex"><span>Workspace</span><ChevronRight size={13}/><span className="text-white/80">{names[pathname.split('/')[2]] || "Overview"}</span></div>
    <div className="ml-auto flex items-center gap-2 sm:gap-3"><Link to="/dashboard/joinmeeting" className="topbar-action glass-control" aria-label="Join meeting"><ArrowDownLeft size={16}/><span className="hidden sm:inline">Join</span></Link><Link to="/dashboard/addmeeting" className="topbar-action mint-button" aria-label="Create meeting"><Plus size={16}/><span className="hidden sm:inline">New meeting</span></Link><span className="mx-1 hidden h-6 w-px bg-white/10 sm:block"/><ProfileLogo/></div>
  </header>;
}
