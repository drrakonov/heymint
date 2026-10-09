import { useQuery } from "@tanstack/react-query";
import { Link } from "@/lib/router";
import {
  ArrowUpRight,
  ArrowRight,
  Plus,
  Video,
  CalendarDays,
  CheckCheck,
  Wallet,
  Globe2,
  Users,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { backend, currency } from "@/lib/api";
import {
  PageHeading,
  EmptyState,
  ErrorState,
  Skeletons,
} from "@/components/heymint/common";
import { useMeetings } from "./queries";
import { MeetingCollection } from "./Meetings";
export default function Dashboard() {
  const { user } = useAuth();
  const stats = useQuery({
    queryKey: ["stats", user?.id],
    queryFn: backend.stats,
    retry: 1,
  });
  const meetings = useMeetings();
  const hosted = useQuery({
    queryKey: ["active-hosted", user?.id],
    queryFn: backend.activeHosted,
    retry: 1,
  });
  const upcoming = (meetings.data?.meetings || [])
    .filter((m) => m.createdById === user?.id && !m.isComplete)
    .sort(
      (a, b) =>
        new Date(a.meetingTime).getTime() - new Date(b.meetingTime).getTime(),
    )
    .slice(0, 3);
  return (
    <>
      <PageHeading
        eyebrow="YOUR SPACE TO CONNECT"
        title={`Hey, ${user?.name?.split(" ")[0] || "there"}.`}
        description="Good to have you here. Let’s make today a little more connected."
        action={
          <span className="workspace-badge">
            <span />
            Your workspace
          </span>
        }
      />
      <section className="overview-hero">
        <div>
          <p className="eyebrow">GOOD THINGS HAPPEN TOGETHER.</p>
          <h2>
            A little less friction.
            <br />A lot more <span>connection.</span>
          </h2>
          <p>Make space for your people and your next big idea.</p>
          <Button variant="outline" asChild>
            <Link to="/dashboard/joinmeeting">
              Join a meeting
              <ArrowUpRight />
            </Link>
          </Button>
        </div>
        <div className="overview-orbit" aria-hidden>
          <span />
          <span />
          <span />
          <Video />
          <i />
          <i />
        </div>
      </section>
      <div className="overview-actions">
        <Link to="/dashboard/addmeeting" className="start-meeting-card">
          <div className="start-meeting-icon">
            <Plus />
          </div>
          <div>
            <h3>Start something good.</h3>
            <p>A fresh room. A new conversation.</p>
          </div>
          <ArrowUpRight />
        </Link>
        <Link
          to="/dashboard/addmeeting"
          search={{ scheduled: true }}
          className="schedule-meeting-card"
        >
          <CalendarDays />
          <div>
            <h3>Make time to connect.</h3>
            <p>Schedule your next meeting.</p>
          </div>
          <ArrowUpRight />
        </Link>
      </div>
      <section className="stats-section">
        <div className="section-heading">
          <h2>Your workspace, at a glance.</h2>
          <span className="eyebrow">THE BIG PICTURE</span>
        </div>
        {stats.isPending ? (
          <Skeletons count={3} />
        ) : stats.error ? (
          <ErrorState error={stats.error} retry={() => void stats.refetch()} />
        ) : (
          stats.data && (
            <>
              <div className="stats-grid">
                {[
                  {
                    icon: Video,
                    label: "Your meetings",
                    value: stats.data.myTotalMeetings,
                  },
                  {
                    icon: CheckCheck,
                    label: "Completed meetings",
                    value: stats.data.completedMeetings,
                  },
                  {
                    icon: Wallet,
                    label: "Demo earnings",
                    value: currency(stats.data.totalEarning),
                  },
                ].map((s) => (
                  <article className="stat-card" key={s.label}>
                    <s.icon />
                    <p>{s.label}</p>
                    <strong>{s.value}</strong>
                    <span>
                      {s.label === "Demo earnings"
                        ? "Recorded demo payments · INR"
                        : "Across your workspace"}
                    </span>
                  </article>
                ))}
              </div>
              <div className="platform-totals">
                <span>
                  <Globe2 />
                  HeyMint platform totals
                </span>
                <span>
                  <Video />
                  {stats.data.totalMeetings.toLocaleString()} total meetings
                </span>
                <span>
                  <Users />
                  {stats.data.activeUsers.toLocaleString()} users{" "}
                  <small>(not online status)</small>
                </span>
              </div>
            </>
          )
        )}
      </section>
      <section className="upcoming-section">
        <div className="section-heading">
          <div>
            <h2>Your next conversations.</h2>
            <p>Your active hosted meetings, ready when you are.</p>
          </div>
          <Button asChild variant="ghost">
            <Link to="/dashboard/meetings">
              View all
              <ArrowRight />
            </Link>
          </Button>
        </div>
        {meetings.isPending || hosted.isPending ? (
          <Skeletons />
        ) : meetings.error || hosted.error ? (
          <ErrorState
            error={meetings.error || hosted.error}
            retry={() => {
              void meetings.refetch();
              void hosted.refetch();
            }}
          />
        ) : upcoming.length ? (
          <MeetingCollection
            meetings={upcoming}
            purchases={meetings.data?.purchases}
            compact
          />
        ) : (
          <EmptyState
            title="A fresh start. An open room."
            description="Your next good conversation is one meeting away."
            action={
              <Button asChild>
                <Link to="/dashboard/addmeeting">
                  <Plus />
                  Create your first meeting
                  <ArrowUpRight />
                </Link>
              </Button>
            }
          />
        )}
      </section>
      <Link to="/dashboard/insights" className="insights-banner">
        <span className="insights-banner-icon">
          <Sparkles />
        </span>
        <div>
          <p className="eyebrow">KEEP THE GOOD IDEAS</p>
          <h3>The meeting ends. The momentum doesn’t.</h3>
          <p>
            Revisit summaries, decisions and next steps from your conversations.
          </p>
        </div>
        <ArrowUpRight />
      </Link>
    </>
  );
}
