import { CalendarClock, ClipboardList, CreditCard, LayoutDashboard, LifeBuoy, Settings, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const SidebarMobile = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const items = [
    { icon: <LayoutDashboard size={20} />, to: "/dashboard" },
    { icon: <CalendarClock size={20} />, to: "/dashboard/meetings" },
    { icon: <ClipboardList size={20} />, to: "/dashboard/bookings" },
    { icon: <CreditCard size={20} />, to: "/dashboard/payments" },
    { icon: <User size={20} />, to: "/dashboard/profile" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-14 bg-surface border-t border-gray-700 flex justify-around items-center sm:hidden z-50">
      {items.map(({ icon, to }, i) => {
        const isActive = location.pathname === to;
        return (
          <button
            key={i}
            onClick={() => navigate(to)}
            className={`p-2 rounded-md ${
              isActive ? "text-primary" : "text-gray-400"
            }`}
          >
            {icon}
          </button>
        );
      })}
    </div>
  );
};

export default SidebarMobile;
