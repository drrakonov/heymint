import { CalendarClock, ClipboardList, CreditCard, LayoutDashboard, LifeBuoy, Settings, User } from "lucide-react";
import { Outlet } from "react-router-dom";
import { useSidebarStore } from "@/store/sidebarStore";
import DashNav from "./DashNav";
import Sidebar, { SidebarItems } from "../subComponents/Sidebar";

const DashboardLayout = () => {
  const { expanded } = useSidebarStore();
  return (
    <main className="relative h-screen flex flex-col">
      <DashNav />
      <div className="flex flex-1 pt-16">
        <div className="fixed">
          <Sidebar>
            <SidebarItems icon={<User size={20} />} text="Profile" to="/dashboard/profile" />
            <SidebarItems icon={<LayoutDashboard size={20} />} text="Dashboard" to="/dashboard" />
            <SidebarItems icon={<CalendarClock size={20} />} text="Meetings" to="/dashboard/meetings" />
            <SidebarItems icon={<ClipboardList size={20} />} text="Bookings" to="/dashboard/bookings" />
            <SidebarItems icon={<CreditCard size={20} />} text="Payments" to="/dashboard/payments" />
            <hr className="my-3 text-slate-400" />
            <SidebarItems icon={<Settings size={20} />} text="Settings" to="/dashboard/settings" />
            <SidebarItems icon={<LifeBuoy size={20} />} text="Help" to="/dashboard/help" />
          </Sidebar>
        </div>
        {/* Main Content */}
        <section className={`flex-1 flex flex-col bg-surface h-full transition-all overflow-y-auto 
          ${expanded ? "pl-65" : "pl-20"}
          `}>
          <Outlet />
        </section>
      </div>
    </main>
  );
};

export default DashboardLayout;
