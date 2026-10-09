import { Link, useNavigate, useRouterState } from "@/lib/router";
import { useEffect, useState, useRef, type ReactNode } from "react";
import {
  LayoutGrid,
  Video,
  CalendarCheck2,
  Sparkles,
  Receipt,
  Settings2,
  CircleHelp,
  LogOut,
  Menu,
  X,
  Plus,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { safeReturn, errorMessage, storedToken } from "@/lib/api";
import { Avatar, Brand, ErrorState, Pending } from "./common";
const nav = [
  { to: "/dashboard", label: "Overview", icon: LayoutGrid },
  { to: "/dashboard/meetings", label: "Meetings", icon: Video },
  { to: "/dashboard/bookings", label: "My bookings", icon: CalendarCheck2 },
  { to: "/dashboard/insights", label: "Meeting insights", icon: Sparkles },
  { to: "/dashboard/payments", label: "Payments", icon: Receipt },
] as const;
export function Protected({ children }: { children: ReactNode }) {
  const { user, loading, error, retry } = useAuth();
  const navigate = useNavigate();
  const location = useRouterState({ select: (s) => s.location });
  useEffect(() => {
    if (!loading && !user && !storedToken())
      void navigate({
        to: "/auth/login",
        search: { returnTo: safeReturn(location.href) },
        replace: true,
      });
  }, [loading, user, navigate, location.href]);
  if (loading)
    return (
      <div className="session-loading">
        <Brand />
        <Pending>Restoring your session</Pending>
      </div>
    );
  if (!user)
    return (
      <div className="session-loading">
        <Brand />
        {error ? (
          <ErrorState error={new Error(error)} retry={retry} />
        ) : (
          <Pending>Opening sign in</Pending>
        )}
        <Button asChild variant="outline">
          <Link
            to="/auth/login"
            search={{ returnTo: safeReturn(location.href) }}
          >
            Sign in
          </Link>
        </Button>
      </div>
    );
  return <>{children}</>;
}
export function DashboardShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(
    () => window.matchMedia("(max-width: 760px)").matches,
  );
  const sidebar = useRef<HTMLElement>(null);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 760px)");
    const update = () => setMobile(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (!open || !mobile) return;
    const previous = document.activeElement as HTMLElement | null;
    const focusable = () =>
      Array.from(
        sidebar.current?.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled])",
        ) || [],
      );
    focusable()[0]?.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const elements = focusable();
      const first = elements[0];
      const last = elements.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", trap);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", trap);
      document.body.style.overflow = "";
      previous?.focus();
    };
  }, [open, mobile]);
  const [pending, setPending] = useState(false);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const listener = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, [open]);
  const logout = async () => {
    setPending(true);
    try {
      await signOut();
      await navigate({ to: "/" });
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setPending(false);
    }
  };
  const current =
    nav.find((n) => n.to === pathname)?.label ||
    (pathname.includes("profile")
      ? "Your profile"
      : pathname.includes("addmeeting")
        ? "New meeting"
        : pathname.includes("joinmeeting")
          ? "Join a meeting"
          : "Help & support");
  return (
    <Protected>
      <div className="app-layout">
        {open && (
          <div
            className="sidebar-backdrop"
            onClick={() => setOpen(false)}
            aria-hidden
          />
        )}
        <aside
          ref={sidebar}
          inert={mobile && !open}
          aria-hidden={mobile && !open}
          className={`app-sidebar ${open ? "is-open" : ""}`}
          aria-label="Main navigation"
        >
          <div className="sidebar-brand">
            <Brand />
            <Button
              variant="ghost"
              size="icon"
              className="mobile-only"
              aria-label="Close navigation"
              onClick={() => setOpen(false)}
            >
              <X />
            </Button>
          </div>
          <p className="nav-label">WORKSPACE</p>
          <nav>
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: true }}
                className="nav-item"
                activeProps={{ className: "nav-item active" }}
              >
                <n.icon />
                <span>{n.label}</span>
                {n.to === "/dashboard/insights" && (
                  <span className="nav-new">AI</span>
                )}
              </Link>
            ))}
          </nav>
          <div className="sidebar-note">
            <span className="note-spark">
              <Sparkles />
            </span>
            <h3>Make space for a good conversation.</h3>
            <Button variant="outline" asChild>
              <Link to="/dashboard/addmeeting">
                Start a meeting
                <ArrowUpRight />
              </Link>
            </Button>
          </div>
          <nav className="sidebar-bottom">
            <Link
              to="/dashboard/profile"
              className="nav-item"
              activeProps={{ className: "nav-item active" }}
            >
              <Settings2 />
              Settings
            </Link>
            <Link
              to="/dashboard/help"
              className="nav-item"
              activeProps={{ className: "nav-item active" }}
            >
              <CircleHelp />
              Help & support
            </Link>
            <Button
              variant="ghost"
              className="nav-item logout"
              disabled={pending}
              onClick={logout}
            >
              {pending ? <Pending /> : <LogOut />}Sign out
            </Button>
          </nav>
          <Link to="/dashboard/profile" className="sidebar-profile">
            <Avatar name={user?.name || user?.email || "You"} />
            <span className="min-w-0">
              <strong>{user?.name || "Your workspace"}</strong>
              <small>{user?.email}</small>
            </span>
          </Link>
        </aside>
        <div className="app-main">
          <header className="app-topbar">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="mobile-only"
                onClick={() => setOpen(!open)}
                aria-label="Open navigation"
                aria-expanded={open}
              >
                <Menu />
              </Button>
              <span className="breadcrumb">
                Workspace<span>/</span>
                <strong>{current}</strong>
              </span>
            </div>
            <div className="topbar-actions">
              <Button variant="ghost" asChild size="sm">
                <Link to="/dashboard/joinmeeting">
                  Join meeting
                  <ArrowUpRight />
                </Link>
              </Button>
              <span className="topbar-divider" />
              <Link to="/dashboard/profile">
                <Avatar
                  name={user?.name || user?.email || "You"}
                  size="small"
                />
              </Link>
            </div>
          </header>
          <main className="dashboard-content">{children}</main>
          <footer className="app-footer">
            <span>Less friction. More connection.</span>
            <span>
              HeyMint
              <Plus className="size-3" />
            </span>
          </footer>
        </div>
      </div>
    </Protected>
  );
}
