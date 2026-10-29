import { useEffect, useState } from "react"
import { Calendar, Copy, LockKeyhole, Video, Globe2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useUserStore } from "@/store/userStore"
import { Link, useNavigate } from "react-router-dom"
import api from "@/lib/axios"
import toast from "react-hot-toast"
import { getMeetingJoinLink } from "@/lib/meetingLinks"

import PageHeader from "../workspace/PageHeader";

type MeetingType = "quick-meeting" | "scheduled-meeting";


interface MeetingFormProps {
  meetingTitle: string;
  setMeetingTitle: (v: string) => void;
  meetingDescription: string;
  setDescription: (v: string) => void;
  isProtected: boolean;
  setIsProtected: (v: boolean) => void;
  meetingPassword: string;
  setMeetingPassword: (v: string) => void;
  isScheduled: boolean;
  setIsScheduled: (v: boolean) => void;
  meetingDate: string;
  setMeetingDate: (v: string) => void;
  setUpMeeting: () => void;
  isCreating: boolean;
}


const MeetingCreated = ({meetingCode, copyMeetingLink}: {meetingCode: string, copyMeetingLink: () => void}) => {
  const joinLink = getMeetingJoinLink(meetingCode);
  return (
    <div className="space-y-5 text-center">
                <div className="space-y-2 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-2xl text-primary">✓</div>
                  <h3 className="mt-4 text-xl font-semibold text-text-primary">
                    Your meeting is ready
                  </h3>
                  <p className="text-sm text-text-secondary">
                    Share this link with everyone you want to invite.
                  </p>
                </div>

                <div className="glass-control flex flex-col items-center justify-center gap-3 rounded-2xl p-4 sm:flex-row">
                  <code className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap font-mono text-xs text-primary sm:text-sm">
                    {joinLink}
                  </code>
                  <Button
                    onClick={copyMeetingLink}
                    variant="outline"
                    size="sm"
                    className="glass-control rounded-full border-primary/20 text-primary"
                  >
                    <Copy className="mr-1 h-4 w-4" />
                    Copy link
                  </Button>
                </div>

              </div>
  )
}


const MeetingForm = ({
  meetingTitle,
  setMeetingTitle,
  meetingDescription,
  setDescription,
  isProtected,
  setIsProtected,
  meetingPassword,
  setMeetingPassword,
  isScheduled,
  setIsScheduled,
  meetingDate,
  setMeetingDate,
  setUpMeeting,
  isCreating,
}: MeetingFormProps) => {
  return (
    <>
    <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Meeting Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  placeholder="Enter meeting title"
                  className="glass-input w-full"
                  aria-label="Meeting title"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Description</Label>
                <Textarea
                  aria-label="Meeting description"
                  value={meetingDescription}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter meeting description (optional)"
                  className="glass-input min-h-[100px] w-full resize-none"
                />
              </div>
            </div>

            {/* ---------- isPROTECTED FIELDS ---------- */}

            <div className="glass-control flex items-center justify-between rounded-2xl p-4">
              <div className="flex gap-3">
                <LockKeyhole className="mt-0.5 h-4 w-4 text-[var(--color-accent)]" />
                <div>
                  <Label className="text-sm font-medium">
                    Protected meeting
                  </Label>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Require a password and limit insights to past participants
                  </p>
                </div>
              </div>
              <Switch
                aria-label="Protected meeting"
                checked={isProtected}
                onCheckedChange={setIsProtected}
                className="data-[state=checked]:bg-[var(--color-accent)] data-[state=unchecked]:bg-gray-600"
              />
            </div>


            {/* ---------- isPROTECTED FIELDS ---------- */}

            {isProtected && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Password <span className="text-red-500">*</span>
                </Label>
                <Input
                  aria-label="Meeting password"
                  type="password"
                  value={meetingPassword}
                  onChange={(e) => setMeetingPassword(e.target.value)}
                  placeholder="Set meeting password"
                  className="glass-input w-full"
                />
              </div>
            )}

            {/* ---------- SCHEDULE TOGGLE ---------- */}
            <div className="glass-control flex items-center justify-between rounded-2xl p-4">
              <div>
                <Label className="text-sm font-medium">
                  Schedule this meeting?
                </Label>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Turn on to set a specific date and time
                </p>
              </div>
              <Switch
                aria-label="Schedule meeting"
                checked={isScheduled}
                onCheckedChange={setIsScheduled}
                className="data-[state=checked]:bg-[var(--color-accent)] data-[state=unchecked]:bg-gray-600"
              />
            </div>


            {/* ---------- SCHEDULED FIELDS ---------- */}
            {isScheduled && (
              <div className="glass-control space-y-4 rounded-2xl p-4">
                <h3 className="text-sm font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">
                  Meeting Schedule
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  {/* Date */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                      <Calendar className="h-4 w-4" />
                      Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="datetime-local"
                      aria-label="Meeting date and time"
                      value={meetingDate}
                      onChange={(e) => setMeetingDate(e.target.value)}
                      onInput={(e) => setMeetingDate(e.currentTarget.value)}
                      className="glass-input"
                    />
                  </div>


                </div>

              </div>
            )}

            {/* ---------- CREATE BUTTON ---------- */}
            <Button
              onClick={setUpMeeting}
              disabled={isCreating}
              className="mint-button h-12 w-full rounded-full font-semibold"
            >
              {isCreating ? "Creating Meeting..." : "Create Meeting"}
            </Button>
    </>
  )
}


export default function CreateMeeting() {
  const [meetingTitle, setMeetingTitle] = useState("")
  const [meetingDescription, setDescription] = useState("")
  const [meetingPassword, setMeetingPassword] = useState("");
  const [isScheduled, setIsScheduled] = useState(false)
  const [isProtected, setIsProtected] = useState(false);
  const [meetingDate, setMeetingDate] = useState("")
  const [meetingCode, setMeetingCode] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [meetingType, setMeetingType] = useState<MeetingType>("quick-meeting");
  const [isCreated, setIsCreated] = useState(false);


 const copyMeetingLink = async () => {
    try {
      await navigator.clipboard.writeText(getMeetingJoinLink(meetingCode));
      toast.success("Joining link copied")
    } catch {
      console.log("Failed to copy code in clipboard");
    }
  }
  const { user } = useUserStore();
  const navigate = useNavigate();


  useEffect(() => {
    if(isScheduled) {
      setMeetingType("scheduled-meeting");
    }else {
      setMeetingType("quick-meeting");
    }
  }, [isScheduled]);


  const createMeetingCode = () => {
    const code = crypto.randomUUID();
    return code;
  }

  const setUpMeeting = async () => {
    if (!user) { toast.error("User not authenticated"); return; }
    if (meetingTitle.trim().length < 2) { toast.error("Enter a meeting title"); return; }
    if (isProtected && meetingPassword.length < 2) { toast.error("Set a valid meeting password"); return; }
    if (isScheduled && meetingDate && new Date(meetingDate).getTime() <= Date.now()) { toast.error("Choose a time in the future"); return; }
    if (isScheduled && !meetingDate) { toast.error("Choose a meeting date and time"); return; }

    try {
      setIsCreating(true);
      const code = createMeetingCode();
      setMeetingCode(code);
      const startsAt = isScheduled ? new Date(meetingDate) : new Date();

      const res = await api.post("api/meeting/setup-meeting", {
        title: meetingTitle,
        description: meetingDescription,
        isScheduled: isScheduled,
        isProtected: isProtected,
        createdBy: user.id,
        password: meetingPassword,
        startingTime: startsAt,
        meetingCode: code
      })

      if(!res.data.success) {
        toast.error(res.data.message);
        return;
      }

      if(meetingType === "quick-meeting") {
        navigate(`/meeting/${code}`);
        return;
      }
      toast.success("meeting created successfully!")
      setIsCreated(true);

    } catch (err) {
      console.error("Failed to setup meeting", err);
      toast.error("Failed to create meeting");
    } finally {
      setIsCreating(false);
    }
  }





  return (
    <div className="page-shell">
      <PageHeader eyebrow="Create a room" title="Bring your people together." description="A few details, then you’re ready to share the invitation."/>
      <div className="grid items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card className="workspace-panel gap-0">
          <CardHeader className="border-b border-white/8 pb-5">
            <CardTitle className="text-base font-semibold">
              Create a meeting
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            {/* ---------- BASIC INFO ---------- */}
            {isCreated ? 
            <MeetingCreated meetingCode={meetingCode} copyMeetingLink={copyMeetingLink} />
              : 
            <MeetingForm
                meetingTitle={meetingTitle}
                setMeetingTitle={setMeetingTitle}
                meetingDescription={meetingDescription}
                setDescription={setDescription}
                isProtected={isProtected}
                setIsProtected={setIsProtected}
                meetingPassword={meetingPassword}
                setMeetingPassword={setMeetingPassword}
                isScheduled={isScheduled}
                setIsScheduled={setIsScheduled}
                meetingDate={meetingDate}
                setMeetingDate={setMeetingDate}
                setUpMeeting={setUpMeeting}
                isCreating={isCreating}
              />
            }
          </CardContent>
        </Card>
        <aside className="workspace-panel p-6 lg:sticky lg:top-8">
          <p className="eyebrow">{isCreated ? "Ready to share" : "Your room at a glance"}</p>
          <span className="section-icon mt-6"><Video size={20}/></span>
          <h2 className="mt-4 break-words text-xl font-semibold tracking-tight">{meetingTitle.trim() || "Your next conversation"}</h2>
          <p className="mt-2 break-words text-sm leading-6 text-text-secondary">{meetingDescription.trim() || "Give your meeting a name people will recognize."}</p>
          <div className="mt-6 space-y-5 border-t border-white/8 pt-5"><div className="flex gap-3">{isProtected ? <LockKeyhole size={17} className="mt-1 shrink-0 text-primary"/> : <Globe2 size={17} className="mt-1 shrink-0 text-primary"/>}<div><p className="text-sm font-medium">{isProtected ? "Protected room" : "Free room"}</p><p className="mt-1 text-xs leading-5 text-text-secondary">{isProtected ? "Password to join. Insights for the host and past participants." : "Signed-in users can join and access the meeting insights."}</p></div></div><div className="flex gap-3"><Calendar size={17} className="mt-1 shrink-0 text-primary"/><div><p className="text-sm font-medium">{isScheduled ? "Scheduled for later" : "Meet right away"}</p><p className="mt-1 text-xs leading-5 text-text-secondary">{isScheduled && meetingDate ? new Date(meetingDate).toLocaleString() : isScheduled ? "Choose your date and time." : "Check your devices before you enter."}</p></div></div></div>
          {isCreated && <Link to="/dashboard/meetings" className="workspace-action mint-button mt-6 w-full">View in meetings <ArrowRight size={15}/></Link>}
        </aside>
      </div>
    </div>
  )
}
