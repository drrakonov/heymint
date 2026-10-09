import { useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "@/lib/router";
import {
  Video,
  CalendarDays,
  ShieldCheck,
  Link2,
  Sparkles,
  Check,
  ArrowUpRight,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeading, Pending, CopyButton } from "@/components/heymint/common";
import { useAuth } from "@/context/AuthContext";
import { backend, errorMessage, type SetupMeeting } from "@/lib/api";
import { initializeMeetingCall } from "@/lib/video";
import { useQueryClient } from "@tanstack/react-query";
export function SetupPage({ scheduled = false }: { scheduled?: boolean }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [schedule, setSchedule] = useState(scheduled);
  const [time, setTime] = useState("");
  const [paid, setPaid] = useState(false);
  const [price, setPrice] = useState("");
  const [protectedRoom, setProtectedRoom] = useState(false);
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<SetupMeeting | null>(null);
  const [link, setLink] = useState("");
  const draft = useRef<SetupMeeting | null>(null);
  const persisted = useRef(false);
  const streamReady = useRef(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || pending) return;
    setPending(true);
    setError("");
    try {
      if (!draft.current) {
        const startingTime = schedule ? new Date(time) : new Date();
        if (
          Number.isNaN(startingTime.getTime()) ||
          (schedule && startingTime.getTime() <= Date.now())
        )
          throw new Error("Choose a valid future date and time.");
        if (title.trim().length < 2 || title.trim().length > 500)
          throw new Error("The title must be 2–500 characters.");
        if (description.length > 100)
          throw new Error("Description must be 100 characters or fewer.");
        if (paid && (!Number.isFinite(Number(price)) || Number(price) <= 0))
          throw new Error("Enter a positive price in INR.");
        if (protectedRoom && (!password || password.length > 30))
          throw new Error(
            "Protected meetings need a password of up to 30 characters.",
          );
        draft.current = {
          title: title.trim(),
          description,
          isScheduled: schedule,
          isPaid: paid,
          isProtected: protectedRoom,
          startingTime: startingTime.toISOString(),
          price: paid ? Number(price) : 0,
          createdBy: user.id,
          password: protectedRoom ? password : "",
          meetingCode: crypto.randomUUID(),
        };
      }
      if (!persisted.current) {
        try {
          await backend.setup(draft.current);
        } catch (error) {
          // A dropped response may follow a committed write. Reconcile by the
          // unique code before offering an explicit retry; never double-submit.
          const existing = await backend.meetings(user.id).catch(() => null);
          if (
            !existing?.meetings.some(
              (m) =>
                m.meetingCode === draft.current?.meetingCode &&
                m.createdById === user.id,
            )
          )
            throw error;
        }
        persisted.current = true;
      }
      if (!streamReady.current) {
        await initializeMeetingCall(user, draft.current);
        streamReady.current = true;
      }
      setCreated({ ...draft.current, password: "" });
      setPassword("");
      setLink(
        `${window.location.origin}/meeting/${encodeURIComponent(draft.current.meetingCode)}`,
      );
      await queryClient.invalidateQueries({ queryKey: ["meetings"] });
      await queryClient.invalidateQueries({ queryKey: ["stats"] });
      await queryClient.invalidateQueries({ queryKey: ["active-hosted"] });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setPending(false);
    }
  };
  return (
    <>
      <PageHeading
        eyebrow="MAKE ROOM FOR SOMETHING GOOD"
        title="A new conversation."
        description="Your people. Your room. Your next great idea."
      />
      {created ? (
        <div className="created-state">
          <Check />
          <h2>You’ve made room.</h2>
          <p>
            Share the link with your people. Your{" "}
            {created.isScheduled ? "scheduled" : "instant"} meeting is ready.
          </p>
          <div className="share-field">
            <span>ROOM LINK</span>
            <div className="share-row">
              <input aria-label="Created meeting link" value={link} readOnly />
              <CopyButton value={link} />
            </div>
          </div>
          <div className="share-field">
            <span>MEETING CODE</span>
            <div className="share-row">
              <input
                aria-label="Created meeting code"
                value={created.meetingCode}
                readOnly
              />
              <CopyButton value={created.meetingCode} label="Copy code" />
            </div>
          </div>
          {created.isProtected && (
            <p>
              Share the password separately with the people you want to invite.
            </p>
          )}
          <div className="flex flex-wrap justify-center gap-3 mt-7">
            <Button asChild>
              <Link to="/meeting/$id" params={{ id: created.meetingCode }}>
                Open meeting room
                <ArrowUpRight />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/dashboard/meetings">Back to meetings</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="setup-layout">
          <form className="setup-form" onSubmit={submit}>
            <fieldset
              disabled={pending || !!draft.current}
              className="border-0 p-0 m-0 w-full"
            >
              <section className="form-section">
                <h2>Set the scene.</h2>
                <div className="form-stack">
                  <label className="field-label">
                    Meeting title
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      minLength={2}
                      maxLength={500}
                      required
                      placeholder="Give your conversation a name"
                    />
                  </label>
                  <label className="field-label">
                    Description
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      maxLength={100}
                      placeholder="A little context goes a long way."
                    />
                    <span className="field-hint">
                      {description.length}/100 characters
                    </span>
                  </label>
                </div>
              </section>
              <section className="form-section">
                <h2>Find your moment.</h2>
                <div className="segmented">
                  <Button
                    type="button"
                    variant={!schedule ? "secondary" : "ghost"}
                    aria-pressed={!schedule}
                    onClick={() => setSchedule(false)}
                  >
                    <Video />
                    Meet now
                  </Button>
                  <Button
                    type="button"
                    variant={schedule ? "secondary" : "ghost"}
                    aria-pressed={schedule}
                    onClick={() => setSchedule(true)}
                  >
                    <CalendarDays />
                    Schedule for later
                  </Button>
                </div>
                {schedule && (
                  <label className="field-label">
                    Date and time
                    <input
                      type="datetime-local"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      required
                    />
                    <span className="field-hint">
                      In your local time zone. Choose a future date.
                    </span>
                  </label>
                )}
              </section>
              <section className="form-section">
                <h2>Your room. Your rules.</h2>
                <label className="setting-row">
                  <span>
                    <h3>Paid meeting</h3>
                    <p>Set a price for your session. Checkout is demo-only.</p>
                  </span>
                  <input
                    type="checkbox"
                    checked={paid}
                    onChange={(e) => setPaid(e.target.checked)}
                  />
                </label>
                {paid && (
                  <label className="field-label mb-6">
                    Price (INR)
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                    />
                    <span className="field-hint">
                      No real money is charged by the demo checkout.
                    </span>
                  </label>
                )}
                <label className="setting-row">
                  <span>
                    <h3>Protect with a password</h3>
                    <p>A shared secret for the people you want in the room.</p>
                  </span>
                  <input
                    type="checkbox"
                    checked={protectedRoom}
                    onChange={(e) => setProtectedRoom(e.target.checked)}
                  />
                </label>
                {protectedRoom && (
                  <label className="field-label">
                    Meeting password
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      maxLength={30}
                      autoComplete="new-password"
                    />
                    <span className="field-hint">
                      Up to 30 characters. Share it separately from your room
                      link.
                    </span>
                  </label>
                )}
              </section>
            </fieldset>
            {error && (
              <p className="form-error mt-5" role="alert">
                {error}
                {draft.current &&
                  " Your meeting code is preserved. Retry uses the same code, without creating a second call."}
              </p>
            )}
            <div className="mt-7 flex items-center gap-3">
              <Button type="submit" size="lg" disabled={pending}>
                {pending ? (
                  <Pending>Preparing your room</Pending>
                ) : (
                  <>
                    {draft.current ? "Retry creation" : "Create meeting"}
                    <ArrowUpRight />
                  </>
                )}
              </Button>
              {draft.current && !pending && !persisted.current && (
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => {
                    draft.current = null;
                    streamReady.current = false;
                    setError("");
                  }}
                >
                  Edit details
                </Button>
              )}
            </div>
          </form>
          <aside className="setup-note">
            <Sparkles />
            <h3>
              Good things
              <br />
              start with a hello.
            </h3>
            <p>
              A simple room for meaningful conversations. Bring your people.
              We’ll make space.
            </p>
            <ul>
              <li>
                <Video />
                Camera, microphone and screen sharing
              </li>
              <li>
                <Link2 />A room link you can share anywhere
              </li>
              <li>
                <ShieldCheck />
                Access checked every time you join
              </li>
              <li>
                <Sparkles />
                Audio insights, only when you choose
              </li>
            </ul>
          </aside>
        </div>
      )}
    </>
  );
}
export function JoinPage() {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    let code = value.trim();
    if (code.includes("/")) {
      try {
        const url = new URL(code, window.location.origin);
        const match = url.pathname.match(/^\/meeting\/([^/]+)\/?$/);
        if (!match) throw new Error();
        code = decodeURIComponent(match[1]);
      } catch {
        setError("Enter a valid meeting link or meeting code.");
        return;
      }
    }
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(code)) {
      setError("Enter a valid meeting code.");
      return;
    }
    void navigate({ to: "/meeting/$id", params: { id: code } });
  };
  return (
    <>
      <PageHeading
        eyebrow="YOUR PEOPLE ARE ONE HELLO AWAY"
        title="Join the conversation."
      />
      <div className="join-layout">
        <div className="join-visual" aria-hidden>
          <Video />
        </div>
        <h2>Make yourself part of it.</h2>
        <p>Paste a room link or enter the meeting code.</p>
        <form className="form-stack" onSubmit={submit}>
          <label className="field-label">
            Meeting link or code
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
              autoComplete="off"
              placeholder="Paste your room link or code"
            />
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" size="lg">
            Continue to meeting
            <ArrowRight />
          </Button>
        </form>
        <p className="field-hint mt-5">
          We’ll check your access and let you preview your camera before
          joining.
        </p>
      </div>
    </>
  );
}
