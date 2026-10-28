import { CalendarClock, LayoutDashboard, LifeBuoy, User } from "lucide-react";
import { NavLink } from "react-router-dom";

const items = [
  { icon: LayoutDashboard, label: "Home", to: "/dashboard", end: true },
  { icon: CalendarClock, label: "Meetings", to: "/dashboard/meetings", end: false },
  { icon: User, label: "Profile", to: "/dashboard/profile", end: false },
  { icon: LifeBuoy, label: "Help", to: "/dashboard/help", end: false },
];

const SidebarMobile = () => (
  <nav aria-label="Dashboard navigation" className="mobile-navigation liquid-glass fixed bottom-3 left-1/2 z-50 flex h-16 w-[calc(100%-24px)] -translate-x-1/2 items-center justify-around rounded-full px-2 sm:hidden">
    {items.map(({ icon: Icon, label, to, end }) => (
      <NavLink
        key={to}
        to={to}
        end={end}
        aria-label={label}
        className={({ isActive }) => `flex h-11 min-w-13 flex-col items-center justify-center gap-0.5 rounded-full px-2 transition-all ${isActive ? "bg-primary/15 text-primary" : "text-white/45"}`}
      >
        <Icon size={18} />
        <span className="text-[9px] font-medium">{label}</span>
      </NavLink>
    ))}
  </nav>
);

export default SidebarMobile;
