import { CalendarClock, LayoutDashboard, LifeBuoy, User } from "lucide-react";
import { NavLink } from "react-router-dom";

const items = [
  { icon: LayoutDashboard, label: "Home", to: "/dashboard", end: true },
  { icon: CalendarClock, label: "Meetings", to: "/dashboard/meetings", end: false },
  { icon: User, label: "Profile", to: "/dashboard/profile", end: false },
  { icon: LifeBuoy, label: "Help", to: "/dashboard/help", end: false },
];

const SidebarMobile = () => (
  <nav aria-label="Dashboard navigation" className="mobile-navigation">
    {items.map(({ icon: Icon, label, to, end }) => (
      <NavLink
        key={to}
        to={to}
        end={end}
        aria-label={label}
        className={({ isActive }) => isActive ? "is-active" : ""}
      >
        <Icon size={18} />
        <span className="text-[11px] font-medium">{label}</span>
      </NavLink>
    ))}
  </nav>
);

export default SidebarMobile;
