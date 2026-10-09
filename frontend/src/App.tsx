import { lazy, Suspense, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Outlet,
  Navigate,
  useParams,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { DashboardShell, Protected } from "./components/heymint/shell";
import { Brand, Pending } from "./components/heymint/common";
import { Button } from "./components/ui/button";
import { Link } from "./lib/router";
import Landing from "./features/Landing";
import { AuthPage, Callback } from "./features/AuthPages";
const Dashboard = lazy(() => import("./features/Dashboard"));
const MeetingsPage = lazy(() =>
  import("./features/Meetings").then((m) => ({ default: m.MeetingsPage })),
);
const SetupPage = lazy(() =>
  import("./features/SetupPages").then((m) => ({ default: m.SetupPage })),
);
const JoinPage = lazy(() =>
  import("./features/SetupPages").then((m) => ({ default: m.JoinPage })),
);
const ProfilePage = lazy(() =>
  import("./features/AccountPages").then((m) => ({ default: m.ProfilePage })),
);
const PaymentsPage = lazy(() =>
  import("./features/AccountPages").then((m) => ({ default: m.PaymentsPage })),
);
const HelpPage = lazy(() =>
  import("./features/AccountPages").then((m) => ({ default: m.HelpPage })),
);
const InsightsPage = lazy(() =>
  import("./features/Insights").then((m) => ({ default: m.InsightsPage })),
);
const Room = lazy(() => import("./features/Room"));
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: true },
  },
});
function AuthRoute({ signup = false }: { signup?: boolean }) {
  const [search] = useSearchParams();
  return (
    <AuthPage
      key={String(signup)}
      signup={signup}
      returnTo={search.get("returnTo") || undefined}
    />
  );
}
function SetupRoute() {
  const [search] = useSearchParams();
  return <SetupPage scheduled={search.get("scheduled") === "true"} />;
}
function MeetingRoute({ insights = false }: { insights?: boolean }) {
  const { id = "" } = useParams();
  return (
    <Protected>
      {insights ? (
        <DashboardShell>
          <InsightsPage key={id} code={id} />
        </DashboardShell>
      ) : (
        <Room key={id} code={id} />
      )}
    </Protected>
  );
}
function PageNavigation() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = `${pathname.includes("meeting/") ? "Conversation" : pathname.includes("dashboard") ? "Workspace" : pathname.includes("auth") ? "Welcome" : "A better space to connect"} · HeyMint`;
  }, [pathname]);
  return null;
}
function NotFound() {
  return (
    <main className="session-loading">
      <Brand />
      <h1>This room is still an idea.</h1>
      <p>The page you’re looking for isn’t here.</p>
      <Button asChild>
        <Link to="/dashboard">Open your workspace</Link>
      </Button>
    </main>
  );
}
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <PageNavigation />
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: "#171e22",
                color: "#eef8f2",
                border: "1px solid #34413e",
              },
            }}
          />
          <Suspense
            fallback={
              <div className="session-loading">
                <Brand />
                <Pending>Opening your space</Pending>
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route
                path="/auth"
                element={<Navigate to="/auth/login" replace />}
              />
              <Route path="/auth/login" element={<AuthRoute />} />
              <Route path="/auth/signup" element={<AuthRoute signup />} />
              <Route path="/auth/callback" element={<Callback />} />
              <Route
                path="/dashboard"
                element={
                  <DashboardShell>
                    <Outlet />
                  </DashboardShell>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="meetings" element={<MeetingsPage />} />
                <Route path="bookings" element={<MeetingsPage bookings />} />
                <Route path="insights" element={<MeetingsPage insights />} />
                <Route path="payments" element={<PaymentsPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route
                  path="profile-update"
                  element={<Navigate to="/dashboard/profile" replace />}
                />
                <Route path="help" element={<HelpPage />} />
                <Route path="addmeeting" element={<SetupRoute />} />
                <Route path="joinmeeting" element={<JoinPage />} />
              </Route>
              <Route path="/meeting/:id" element={<MeetingRoute />} />
              <Route
                path="/meeting/:id/insights"
                element={<MeetingRoute insights />}
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
