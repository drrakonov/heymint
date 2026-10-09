import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@/lib/router";
import {
  ArrowUpRight,
  Check,
  ShieldCheck,
  Receipt,
  Video,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  PageHeading,
  EmptyState,
  ErrorState,
  Skeletons,
  Avatar,
  Pending,
} from "@/components/heymint/common";
import { useAuth } from "@/context/AuthContext";
import { backend, currency, dateLabel, errorMessage } from "@/lib/api";
export function PaymentsPage() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ["payments", user?.id],
    queryFn: () => {
      if (!user) throw new Error("Please sign in");
      return backend.payments(user.id);
    },
    retry: 1,
  });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("latest");
  const rows = (query.data || [])
    .filter(
      (p) =>
        p.meetingName.toLowerCase().includes(search.toLowerCase()) &&
        (status === "all" || p.status === status),
    )
    .sort((a, b) =>
      sort === "amount"
        ? a.amount - b.amount
        : new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  return (
    <>
      <PageHeading
        eyebrow="CLEAR. SIMPLE. ALL IN ONE PLACE."
        title="Payments"
        description="Your demo transactions, without the guesswork."
      />
      <div className="info-band">
        <ShieldCheck />
        <p>
          <strong>Demo transactions only.</strong> No money is charged. These
          records reflect demo bookings, not real payments.
        </p>
      </div>
      <div className="collection-toolbar">
        <input
          aria-label="Search payment history"
          placeholder="Search by meeting name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="collection-tools">
          <select
            aria-label="Payment status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">All statuses</option>
            {Array.from(new Set(query.data?.map((p) => p.status) || [])).map(
              (s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ),
            )}
          </select>
          <select
            aria-label="Sort payments"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="latest">Latest first</option>
            <option value="amount">Amount: low to high</option>
          </select>
        </div>
      </div>
      {query.isPending ? (
        <Skeletons />
      ) : query.error ? (
        <ErrorState error={query.error} retry={() => void query.refetch()} />
      ) : rows.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Meeting</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td>
                    <span className="table-title">
                      <Receipt />
                      {p.meetingName}
                    </span>
                    <small className="payment-id">{p.id}</small>
                  </td>
                  <td>{dateLabel(p.date)}</td>
                  <td className="amount-cell">{currency(p.amount)}</td>
                  <td>{p.paymentMethod} · Demo</td>
                  <td>
                    <span className="status-tag">{p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title={
            query.data?.length
              ? "No matching transactions."
              : "Nothing to settle. Just possibilities."
          }
          description={
            query.data?.length
              ? "Try changing your search or status filter."
              : "Your demo payment history will appear after your first paid meeting booking."
          }
          action={
            <Button asChild variant="outline">
              <Link to="/dashboard/meetings">
                Explore meetings
                <ArrowUpRight />
              </Link>
            </Button>
          }
        />
      )}
    </>
  );
}
export function ProfilePage() {
  const { user, reloadUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || pending) return;
    setPending(true);
    setError("");
    try {
      await backend.updateName(user.id, name.trim());
      await reloadUser();
      toast.success("Your name has been updated");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setPending(false);
    }
  };
  return (
    <>
      <PageHeading
        eyebrow="MAKE IT YOURS"
        title="Your profile"
        description="A few details. A familiar face in every conversation."
      />
      <div className="profile-layout">
        <section className="profile-identity">
          <Avatar name={user?.name || user?.email || "You"} size="large" />
          <h2>{user?.name || "Your account"}</h2>
          <p>{user?.email}</p>
          <span className="status-tag">
            <ShieldCheck className="size-3" />
            {user?.provider || "Account"}
          </span>
        </section>
        <section className="profile-details">
          <h2>The basics.</h2>
          <p>This is how you appear in your HeyMint conversations.</p>
          <form className="form-stack" onSubmit={submit}>
            <label className="field-label">
              Display name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={3}
                maxLength={20}
                autoComplete="name"
                disabled={pending}
              />
              <span className="field-hint">
                3–20 characters. A name your people will recognize.
              </span>
            </label>
            <label className="field-label">
              Email address
              <input
                value={user?.email || ""}
                readOnly
                aria-readonly
                autoComplete="email"
              />
              <span className="field-hint">
                Your sign-in email can’t be changed here.
              </span>
            </label>
            <label className="field-label">
              Sign-in provider
              <input value={user?.provider || ""} readOnly aria-readonly />
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <div>
              <Button
                type="submit"
                disabled={
                  pending ||
                  name.trim() === (user?.name || "") ||
                  name.trim().length < 3
                }
              >
                {pending ? (
                  <Pending>Saving</Pending>
                ) : (
                  <>
                    <Check />
                    Save changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </>
  );
}
const faqs = [
  {
    q: "How do I start a meeting?",
    a: "Create an instant meeting or choose a future date and time. Give it a title, decide whether it’s free or paid, and optionally add a password. Once created, copy the room link and share it with your people.",
  },
  {
    q: "How do protected meetings work?",
    a: "Every room entry checks your access. Guests entering a password-protected meeting must provide the correct password. The host doesn’t need to enter it.",
  },
  {
    q: "Will I be charged for a demo checkout?",
    a: "No. Demo checkout records a booking and a payment entry only. No money changes hands and no card or UPI details are collected.",
  },
  {
    q: "What gets recorded for insights?",
    a: "With AI notes enabled before the host joins, shared call audio is captured alongside the meeting. Obtain everyone’s consent first. Muted microphones are excluded. When the host leaves or ends the call, audio is submitted automatically for a summary and transcript. Keep the call page open until processing finishes. Failed processing can be retried without recording again; an audio upload is available as recovery.",
  },
  {
    q: "Who can cancel or end a meeting?",
    a: "A host can cancel their own free meeting before it is completed. Paid meetings cannot be cancelled. In a room, the host can end either a free or paid meeting for everyone; it will then be marked completed.",
  },
  {
    q: "Why can’t I see my meetings?",
    a: "HeyMint needs to be connected to the existing backend. Check your internet connection and ask your workspace administrator to verify the configured backend URL, cookie settings and permitted frontend origin. Use the retry button after reconnecting.",
  },
];
export function HelpPage() {
  return (
    <>
      <PageHeading
        eyebrow="A LITTLE HELP GOES A LONG WAY"
        title="Good questions. Clear answers."
        description="A few things to help your next conversation go smoothly."
      />
      <div className="help-top">
        <Video />
        <div>
          <h2>Ready for your next hello?</h2>
          <p>Make a room or join your people.</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/dashboard/joinmeeting">
            Join a meeting
            <ArrowUpRight />
          </Link>
        </Button>
      </div>
      <section className="faq-list">
        {faqs.map((f, i) => (
          <details key={f.q}>
            <summary>
              <span className="faq-number">0{i + 1}</span>
              {f.q}
              <ChevronDown />
            </summary>
            <p>{f.a}</p>
          </details>
        ))}
      </section>
      <div className="help-footer">
        <Sparkles />
        <h3>A little less friction. A lot more connection.</h3>
        <p>That’s what we’re here for.</p>
        <Button asChild>
          <Link to="/dashboard">
            Back to your workspace
            <ArrowUpRight />
          </Link>
        </Button>
      </div>
    </>
  );
}
