import { useSidebarStore } from "@/store/sidebarStore";
import { ChevronFirst, ChevronLast } from "lucide-react";
import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";


const SideBarContext = createContext<{ expanded: boolean }>({ expanded: true });
const Sidebar = ({ children }: { children: ReactNode }) => {
  const { expanded, setExpanded, toggleExpanded } = useSidebarStore();
  

  useEffect(() => {
    const handleSidebar = () => {
      if (window.innerWidth < 768) {
        setExpanded(false);
      } else {
        setExpanded(true);
      }
    };
    handleSidebar();

    window.addEventListener("resize", handleSidebar);
    return () => window.removeEventListener("resize", handleSidebar);
  }, []);


  return (
    <aside className="h-screen">
      <nav className="h-full flex flex-col bg-surface border-r shadow-sm">
        <div className={`p-4 pb-2 flex items-center transition-all ${expanded ? "justify-end" : "justify-center"}`}>
          <button onClick={() => toggleExpanded()}>
            {expanded ?
              <ChevronFirst className="rounded-lg bg-primary hover:bg-accent text-slate-100" />
              :
              <ChevronLast className="rounded-lg bg-primary hover:bg-accent text-slate-100" />
            }
          </button>
        </div>
        <SideBarContext.Provider value={{ expanded }} >
          <ul className="flex-1 px-3">
            {children}
          </ul>
        </SideBarContext.Provider>
      </nav>
    </aside>
  )
}

export function SidebarItems({ icon, text, to }: any) {
  const { expanded } = useContext(SideBarContext);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = location.pathname === to 
  return (
    <li
      onClick={() => navigate(to)}
      className={`text-white relative flex items-center py-2 px-3 my-1
    font-medium rounded-md cursor-pointer transition-colors group
    ${isActive ?
          "bg-gradient-to-tr from-accent to-primary"
          :
          "hover:bg-accent/40 text-gray-100"
        }
    `} >
      {icon}
      < span className={`overflow-hidden transition-all
        ${expanded ? "w-42 ml-3" : "w-0"}
        `} > {text}
      </span >

      {!expanded && (<div className={`
          absolute left-full rounded-md px-2 py-1 ml-6 bg-accent/20 
          text-sm text-white invisible opacity-20 -translate-x-3 transition-all
          group-hover:visible group-hover:opacity-100 group-hover:translate-x-0
          `}>{text}</div>
      )}

    </li >
  )
}




export default Sidebar;