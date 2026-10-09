import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@/lib/router";
import {
  Search,
  LayoutGrid,
  List,
  LockKeyhole,
  Video,
  ArrowUpRight,
  CalendarDays,
  Trash2,
  Sparkles,
  ShoppingBag,
  X,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  PageHeading,
  NewMeetingButton,
  EmptyState,
  ErrorState,
  Skeletons,
  Avatar,
  Pending,
} from "@/components/heymint/common";
import { useAuth } from "@/context/AuthContext";
import {
  backend,
  currency,
  dateLabel,
  errorMessage,
  type Meeting,
} from "@/lib/api";
import { useMeetings, useBookings } from "./queries";
export function MeetingCollection({
  meetings,
  purchases = [],
  compact = false,
  list = false,
}: {
  meetings: Meeting[];
  purchases?: string[];
  compact?: boolean;
  list?: boolean;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [purchase, setPurchase] = useState<Meeting | null>(null);
  const [cancel, setCancel] = useState<Meeting | null>(null);
  const [pending, setPending] = useState(false);
  const [confirmed, setConfirmed] = useState<string[]>([]);
  const confirmPurchase = async () => {
    if (!purchase || !user || pending || confirmed.includes(purchase.meetingId))
      return;
    setPending(true);
    try {
      const existing = await backend.meetings(user.id);
      if (!existing.purchases.includes(purchase.meetingId))
        await backend.purchase(user.id, purchase.meetingId);
      setConfirmed((ids) => [...ids, purchase.meetingId]);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["meetings"] }),
        queryClient.invalidateQueries({ queryKey: ["bookings"] }),
        queryClient.invalidateQueries({ queryKey: ["payments"] }),
      ]);
      toast.success("Demo booking confirmed. No money was charged.");
      setPurchase(null);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setPending(false);
    }
  };
  const confirmCancel = async () => {
    if (!cancel || !user || pending) return;
    if (
      cancel.createdById !== user.id ||
      cancel.type !== "Free" ||
      cancel.isComplete
    )
      return;
    setPending(true);
    try {
      await backend.deleteMeeting(cancel.meetingCode, user.id, false);
      await queryClient.invalidateQueries({ queryKey: ["meetings"] });
      await queryClient.invalidateQueries({ queryKey: ["stats"] });
      await queryClient.invalidateQueries({ queryKey: ["active-hosted"] });
      toast.success("Meeting cancelled");
      setCancel(null);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setPending(false);
    }
  };
  return (
    <>
      <div className={list ? "meeting-list" : "meeting-grid"}>
        {meetings.map((meeting) => {
          const own = meeting.createdById === user?.id;
          const booked =
            purchases.includes(meeting.meetingId) ||
            confirmed.includes(meeting.meetingId);
          return (
            <article
              key={meeting.meetingId}
              className={`meeting-card ${list ? "list-view" : ""}`}
            >
              <div className="meeting-card-top">
                <span
                  className={`meeting-icon ${meeting.isComplete ? "completed" : ""}`}
                >
                  {meeting.isComplete ? <Sparkles /> : <Video />}
                </span>
                <div className="meeting-tags">
                  <span
                    className={`status-tag ${meeting.type === "Paid" ? "paid" : ""}`}
                  >
                    {meeting.type === "Paid" ? currency(meeting.price) : "Free"}
                  </span>
                  {meeting.isProtected && (
                    <LockKeyhole
                      className="size-3.5"
                      aria-label="Password protected"
                    />
                  )}
                </div>
              </div>
              <div className="meeting-card-content">
                <h3>{meeting.title}</h3>
                {!compact && (
                  <p className="meeting-description">
                    {meeting.description ||
                      "A little space for a good conversation."}
                  </p>
                )}
                <div className="meeting-date">
                  <CalendarDays />
                  {meeting.isInstant
                    ? "Instant meeting"
                    : dateLabel(meeting.meetingTime)}
                </div>
                <div className="meeting-host">
                  <Avatar name={meeting.hostName || "Host"} size="tiny" />
                  <span>
                    {own ? "Hosted by you" : meeting.hostName || "Meeting host"}
                  </span>
                  {meeting.isComplete && (
                    <span className="status-tag">Completed</span>
                  )}
                </div>
              </div>
              <div className="meeting-card-bottom">
                {meeting.isComplete ? (
                  <Button asChild variant="outline" size="sm">
                    <Link
                      to="/meeting/$id/insights"
                      params={{ id: meeting.meetingCode }}
                    >
                      View insights
                      <Sparkles />
                    </Link>
                  </Button>
                ) : meeting.type === "Paid" && !own && !booked ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPurchase(meeting)}
                  >
                    <ShoppingBag />
                    Demo checkout
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      void navigate({
                        to: "/meeting/$id",
                        params: { id: meeting.meetingCode },
                      })
                    }
                  >
                    Join meeting
                    <ArrowUpRight />
                  </Button>
                )}
                {own && meeting.type === "Free" && !meeting.isComplete && (
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Cancel ${meeting.title}`}
                    title="Cancel meeting"
                    onClick={() => setCancel(meeting)}
                  >
                    <Trash2 />
                  </Button>
                )}
              </div>
            </article>
          );
        })}
      </div>
      <Dialog
        open={!!purchase}
        onOpenChange={(o) => {
          if (!o && !pending) setPurchase(null);
        }}
      >
        <DialogContent>
          <DialogTitle>Demo checkout</DialogTitle>
          <DialogDescription>
            No money will be charged. This records a demo purchase and payment
            in your HeyMint account.
          </DialogDescription>
          <div className="checkout-summary">
            <h3>{purchase?.title}</h3>
            <p>{purchase?.hostName}</p>
            <strong>{currency(purchase?.price || 0)}</strong>
            <span>Demo transaction only · No payment details required</span>
          </div>
          <Button disabled={pending} onClick={confirmPurchase}>
            {pending ? (
              <Pending>Confirming</Pending>
            ) : (
              <>
                Confirm demo booking
                <ArrowUpRight />
              </>
            )}
          </Button>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!cancel}
        onOpenChange={(o) => {
          if (!o && !pending) setCancel(null);
        }}
      >
        <DialogContent>
          <DialogTitle>Cancel this meeting?</DialogTitle>
          <DialogDescription>
            “{cancel?.title}” will no longer be available to join. Only your own
            free meetings can be cancelled.
          </DialogDescription>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => setCancel(null)}
            >
              Keep meeting
            </Button>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={confirmCancel}
            >
              {pending ? <Pending /> : <Trash2 />}Cancel meeting
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
export function MeetingsPage({
  bookings = false,
  insights = false,
}: {
  bookings?: boolean;
  insights?: boolean;
}) {
  const { user } = useAuth();
  const all = useMeetings();
  const booked = useBookings();
  const [tab, setTab] = useState("Hosted");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("upcoming");
  const [type, setType] = useState("all");
  const [list, setList] = useState(false);
  const data = all.data;
  let items = data?.meetings || [];
  if (bookings) {
    items = (booked.data || []).map((b) => {
      const global = items.find((m) => m.meetingId === b.meetingId);
      return {
        ...b,
        type: global?.type || "Paid",
        isComplete: global?.isComplete ?? false,
      } satisfies Meeting;
    });
  } else if (insights)
    items = items.filter(
      (m) =>
        m.isComplete &&
        (m.type === "Free" ||
          m.createdById === user?.id ||
          data?.purchases.includes(m.meetingId)),
    );
  else
    items = items.filter((m) =>
      tab === "Hosted"
        ? m.createdById === user?.id && !m.isComplete
        : tab === "Discover"
          ? m.createdById !== user?.id && !m.isComplete
          : m.isComplete &&
            (m.type === "Free" ||
              m.createdById === user?.id ||
              data?.purchases.includes(m.meetingId)),
    );
  const unfilteredCount = items.length;
  items = items
    .filter(
      (m) =>
        `${m.title} ${m.hostName} ${m.description}`
          .toLowerCase()
          .includes(search.toLowerCase()) &&
        (type === "all" || m.type === type),
    )
    .sort((a, b) =>
      sort === "title"
        ? a.title.localeCompare(b.title)
        : sort === "price"
          ? a.price - b.price
          : sort === "latest"
            ? new Date(b.meetingTime).getTime() -
              new Date(a.meetingTime).getTime()
            : new Date(a.meetingTime).getTime() -
              new Date(b.meetingTime).getTime(),
    );
  const isLoading = all.isPending || (bookings && booked.isPending);
  const error = all.error || (bookings && booked.error);
  return (
    <>
      <PageHeading
        eyebrow={
          insights
            ? "THE CONVERSATION CONTINUES"
            : bookings
              ? "YOUR SEAT AT THE TABLE"
              : "BRING YOUR PEOPLE TOGETHER"
        }
        title={
          insights ? "Meeting insights" : bookings ? "My bookings" : "Meetings"
        }
        description={
          insights
            ? "The good ideas, decisions and next steps. All in one place."
            : bookings
              ? "The conversations you’ve made space for."
              : "Every great thing starts with a conversation."
        }
        action={insights ? undefined : <NewMeetingButton />}
      />
      {!bookings && !insights && (
        <div className="page-tabs" role="tablist" aria-label="Meeting category">
          {["Hosted", "Discover", "Completed"].map((t) => (
            <Button
              role="tab"
              aria-selected={tab === t}
              tabIndex={tab === t ? 0 : -1}
              onKeyDown={(e) => {
                const tabs = ["Hosted", "Discover", "Completed"];
                const index = tabs.indexOf(t);
                const next =
                  e.key === "ArrowRight"
                    ? (index + 1) % 3
                    : e.key === "ArrowLeft"
                      ? (index + 2) % 3
                      : e.key === "Home"
                        ? 0
                        : e.key === "End"
                          ? 2
                          : -1;
                if (next >= 0) {
                  e.preventDefault();
                  setTab(tabs[next]);
                  (
                    e.currentTarget.parentElement?.children[next] as HTMLElement
                  )?.focus();
                }
              }}
              key={t}
              variant="ghost"
              className={tab === t ? "tab-active" : ""}
              onClick={() => setTab(t)}
            >
              {t}
            </Button>
          ))}
        </div>
      )}
      <div className="collection-toolbar">
        <div className="search-field">
          <Search />
          <input
            aria-label="Search meetings"
            placeholder="Search meetings or people…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <Button
              size="icon"
              variant="ghost"
              aria-label="Clear search"
              onClick={() => setSearch("")}
            >
              <X />
            </Button>
          )}
        </div>
        <div className="collection-tools">
          <select
            aria-label="Filter meeting type"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="all">All types</option>
            <option value="Free">Free</option>
            <option value="Paid">Paid</option>
          </select>
          <select
            aria-label="Sort meetings"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="upcoming">Soonest first</option>
            <option value="latest">Latest first</option>
            <option value="title">Title A–Z</option>
            <option value="price">Price: low to high</option>
          </select>
          <div className="view-toggle">
            <Button
              aria-label="Card view"
              aria-pressed={!list}
              variant={!list ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setList(false)}
            >
              <LayoutGrid />
            </Button>
            <Button
              aria-label="List view"
              aria-pressed={list}
              variant={list ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setList(true)}
            >
              <List />
            </Button>
          </div>
        </div>
      </div>
      {isLoading ? (
        <Skeletons />
      ) : error ? (
        <ErrorState
          error={error}
          retry={() => {
            void all.refetch();
            if (bookings) void booked.refetch();
          }}
        />
      ) : items.length ? (
        <MeetingCollection
          meetings={items}
          purchases={data?.purchases}
          list={list}
        />
      ) : (
        <EmptyState
          title={
            unfilteredCount
              ? "No matching conversations."
              : insights
                ? "Good ideas will live here."
                : bookings
                  ? "Your next conversation is out there."
                  : tab === "Hosted"
                    ? "Your first hello starts here."
                    : tab === "Completed"
                      ? "The best is still to come."
                      : "A little quiet, for now."
          }
          description={
            unfilteredCount
              ? "Try another search or adjust your filters."
              : insights
                ? "Complete a meeting, then upload consented audio to keep the important moments."
                : bookings
                  ? "Explore available meetings and confirm a demo booking to save your spot."
                  : tab === "Hosted"
                    ? "Create a meeting and make a little room for your people."
                    : tab === "Completed"
                      ? "Completed conversations will appear here when a host ends their meeting."
                      : "Available meetings will appear here when hosts create them."
          }
          action={
            unfilteredCount ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setType("all");
                }}
              >
                Clear filters
              </Button>
            ) : bookings ? (
              <Button asChild>
                <Link to="/dashboard/meetings">
                  Explore meetings
                  <ArrowUpRight />
                </Link>
              </Button>
            ) : !insights && tab === "Hosted" ? (
              <NewMeetingButton />
            ) : undefined
          }
        />
      )}
    </>
  );
}
