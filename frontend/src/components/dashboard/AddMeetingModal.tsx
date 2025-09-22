import { useEffect, useState } from "react"
import { Calendar, Copy, IndianRupee } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useUserStore } from "@/store/userStore"
import { Call, useStreamVideoClient } from "@stream-io/video-react-sdk"
import { useNavigate } from "react-router-dom"
import api from "@/lib/axios"
import toast from "react-hot-toast"

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
  isPaid: boolean;
  setIsPaid: (v: boolean) => void;
  price: number;
  setPrice: (v: number) => void;
  setUpMeeting: () => void;
  isCreating: boolean;
}


const MeetingCreated = ({meetingCode, copyMeetingCode}: {meetingCode: string, copyMeetingCode: () => void}) => {
  return (
    <div className="space-y-4 rounded-lg border border-green-600/40 bg-green-600/10 p-4">
                <div className="space-y-2 text-center">
                  <h3 className="font-semibold text-green-400">
                    Meeting Created Successfully!
                  </h3>
                  <p className="text-sm text-green-300">
                    Share this code with attendees:
                  </p>
                </div>

                <div className="flex items-center justify-center gap-3 rounded-lg border border-green-600/40 bg-[var(--color-surface-2)] p-3">
                  <code className="font-mono text-lg font-bold tracking-wider text-green-300">
                    {meetingCode}
                  </code>
                  <Button
                    onClick={copyMeetingCode}
                    variant="outline"
                    size="sm"
                    className="border-green-500 text-green-300 hover:bg-green-600/20"
                  >
                    <Copy className="mr-1 h-4 w-4" />
                    Copy Code
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
  isPaid,
  setIsPaid,
  price,
  setPrice,
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
                  className="w-full border border-[var(--color-surface-2)] bg-[var(--color-surface-2)] placeholder:text-[var(--color-text-secondary)] focus:ring-2 focus:ring-[var(--color-accent)]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Description</Label>
                <Textarea
                  value={meetingDescription}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter meeting description (optional)"
                  className="w-full min-h-[100px] resize-none border border-[var(--color-surface-2)] bg-[var(--color-surface-2)] placeholder:text-[var(--color-text-secondary)] focus:ring-2 focus:ring-[var(--color-accent)]"
                />
              </div>
            </div>

            {/* ---------- isPROTECTED FIELDS ---------- */}

            <div className="flex gap-1">
              <div>
                <Label className="text-sm font-medium">
                  Protect
                </Label>
              </div>
              <Switch
                checked={isProtected}
                onCheckedChange={setIsProtected}
                className="data-[state=checked]:bg-[var(--color-accent)] data-[state=unchecked]:bg-gray-600"
              />
            </div>


            {/* ---------- isPROTECTED FIELDS ---------- */}

            {isProtected && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Passowrd <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={meetingPassword}
                  onChange={(e) => setMeetingPassword(e.target.value)}
                  placeholder="Set meeting password"
                  className="w-full border border-[var(--color-surface-2)] bg-[var(--color-surface-2)] placeholder:text-[var(--color-text-secondary)] focus:ring-2 focus:ring-[var(--color-accent)]"
                />
              </div>
            )}

            {/* ---------- SCHEDULE TOGGLE ---------- */}
            <div className="flex items-center justify-between rounded-lg bg-[var(--color-surface-2)] p-4">
              <div>
                <Label className="text-sm font-medium">
                  Schedule this meeting?
                </Label>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Turn on to set a specific date and time
                </p>
              </div>
              <Switch
                checked={isScheduled}
                onCheckedChange={setIsScheduled}
                className="data-[state=checked]:bg-[var(--color-accent)] data-[state=unchecked]:bg-gray-600"
              />
            </div>


            {/* ---------- SCHEDULED FIELDS ---------- */}
            {isScheduled && (
              <div className="space-y-4 rounded-lg border border-[var(--color-surface-2)] bg-[var(--color-surface-1)] p-4">
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
                      value={meetingDate}
                      onChange={(e) => setMeetingDate(e.target.value)}
                      className="border border-[var(--color-surface-2)] bg-[var(--color-surface-2)] focus:ring-2 focus:ring-[var(--color-accent)]"
                    />
                  </div>


                </div>

                {/* ---------- PAID TOGGLE ---------- */}
                <div className="flex items-center justify-between rounded-lg bg-[var(--color-surface-2)] p-3">
                  <div>
                    <Label className="text-sm font-medium">
                      Make this a paid meeting?
                    </Label>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      Charge attendees to join this meeting
                    </p>
                  </div>
                  <Switch
                    checked={isPaid}
                    onCheckedChange={setIsPaid}
                    className="data-[state=checked]:bg-[var(--color-accent)] data-[state=unchecked]:bg-gray-600"
                  />
                </div>

                {/* ---------- PAYMENT DETAILS ---------- */}
                {isPaid && (
                  <div className="space-y-4 rounded-lg border border-[var(--color-surface-2)] bg-[var(--color-surface-1)] p-3">
                    <h4 className="text-sm font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">
                      Payment Details
                    </h4>

                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Price */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm font-medium">
                          <IndianRupee className="h-4 w-4" />
                          Price <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={price}
                          onChange={(e) => setPrice(parseFloat(e.target.value))}
                          className="border border-[var(--color-surface-2)] bg-[var(--color-surface-2)] focus:ring-2 focus:ring-[var(--color-accent)]"
                        />
                      </div>

                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ---------- CREATE BUTTON ---------- */}
            <Button
              onClick={setUpMeeting}
              disabled={isCreating}
              className="h-12 w-full bg-[var(--color-accent)] text-[var(--color-surface)] font-medium hover:bg-[var(--color-accent-hover)] active:bg-[var(--color-accent-active)]"
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
  const [isPaid, setIsPaid] = useState(false)
  const [meetingDate, setMeetingDate] = useState("")
  const [price, setPrice] = useState(10)
  const [meetingCode, setMeetingCode] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [meetingType, setMeetingType] = useState<MeetingType>("quick-meeting");
  const [isCreated, setIsCreated] = useState(false);


 const copyMeetingCode = async () => { 
    try {
      await navigator.clipboard.writeText(meetingCode);
      toast.success("Code copied to clipboard!")
    }catch(err) {
      console.log("Failed to copy code in clipboard");
    }
  }
  const resetForm = () => {
    setMeetingTitle("")
    setDescription("")
    setMeetingPassword("")
    setIsScheduled(false)
    setIsPaid(false)
    setIsProtected(false)
    setMeetingDate("")
    setPrice(0.0)
    setMeetingCode("")
    setMeetingType("quick-meeting");
  }

  const { user } = useUserStore();
  const client = useStreamVideoClient();
  const [startAtValue, setStartAtValue] = useState({
    dateTime: new Date(),
    description: meetingType,
    link: ''
  });
  const [callDetails, setCallDetails] = useState<Call>();
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
    if (!user || !client) {
      toast.error("Failed to setup meeting")
      return;
    }
    try {

      const code = createMeetingCode();
      setMeetingCode(code);

      if(meetingType === "quick-meeting" || meetingDate === "") {
        const now = new Date();
        setMeetingDate(now.toISOString().slice(0, 16));
      }

      const res = await api.post("api/meeting/setup-meeting", {
        title: meetingTitle,
        description: meetingDescription,
        isScheduled: isScheduled,
        isPaid: isPaid,
        isProtected: isProtected,
        price: price,
        createdBy: user.id,
        password: meetingPassword,
        startingTime: new Date(meetingDate),
        meetingCode: code
      })

      if(!res.data.success) {
        toast.error(res.data.message);
        return;
      }

      if(meetingType === "quick-meeting") {
        await handleCreateMeeting(code);
        return;
      }
      toast.success("meeting created successfully!")
      setIsCreated(true);

    } catch (err) {
      console.error("Failed to setup meeting", err);
    }
  }





  const handleCreateMeeting = async (id: string) => {
    if (!user || !client || !id) return;

    try {
      if (!startAtValue.dateTime) return;

      const call = client.call("default", id);

      setIsCreating(true);

      if (!call) throw new Error("Failed to create call");
      const startsAt = startAtValue.dateTime.toISOString() ||
        new Date(Date.now()).toISOString();

      const description = startAtValue.description || 'quick-meeting';

      await call.getOrCreate({
        data: {
          starts_at: startsAt,
          custom: {
            description
          }
        }
      })
      setCallDetails(call);
      setIsCreating(false);
      if (startAtValue.description === "quick-meeting") {
        navigate(`/meeting/${call.id}`);
      }

    } catch (err) {
      console.error("Failed to create meeting", err);
    }

  }



  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-2xl pt-10 space-y-6 p-4 text-[var(--color-text-primary)]">
        <Card className="bg-[var(--color-surface-1)] ring-1 ring-[var(--color-surface-2)]">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold">
              Create Meeting
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* ---------- BASIC INFO ---------- */}
            {isCreated ? 
            <MeetingCreated meetingCode={meetingCode} copyMeetingCode={copyMeetingCode} /> 
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
                isPaid={isPaid}
                setIsPaid={setIsPaid}
                price={price}
                setPrice={setPrice}
                setUpMeeting={setUpMeeting}
                isCreating={isCreating}
              />
            }
          </CardContent>
        </Card>
      </div>
    </div>
  )
}