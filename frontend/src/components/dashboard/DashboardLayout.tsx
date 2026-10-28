import { CalendarClock, LayoutDashboard, LifeBuoy, User } from "lucide-react";
import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";
import { useSidebarStore } from "@/store/sidebarStore";
import DashNav from "./DashNav";
import Sidebar, { SidebarItems } from "../subComponents/Sidebar";
import SidebarMobile from "../subComponents/SidebarMobile";

export default function DashboardLayout() {
  const { expanded } = useSidebarStore();
  const { pathname } = useLocation();
  const content = useRef<HTMLElement>(null);
  useEffect(() => { content.current?.scrollTo({top: 0}); }, [pathname]);
  return <main className={`workspace-app mint-app-bg ${expanded ? "nav-expanded" : "nav-collapsed"}`}>
    <DashNav />
    <div className="workspace-rail"><Sidebar>
      <SidebarItems icon={<LayoutDashboard size={19}/>} text="Overview" to="/dashboard"/>
      <SidebarItems icon={<CalendarClock size={19}/>} text="Meetings" to="/dashboard/meetings"/>
      <SidebarItems icon={<User size={19}/>} text="My profile" to="/dashboard/profile"/>
      <SidebarItems icon={<LifeBuoy size={19}/>} text="Help center" to="/dashboard/help"/>
    </Sidebar></div>
    <section ref={content} className="workspace-content"><Outlet/></section>
    <SidebarMobile/>
  </main>;
}
