import { useState } from "react"
import { Calendar, Clock, Copy, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"



export default function CreateMeeting() {
  const [meetingTitle, setMeetingTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isScheduled, setIsScheduled] = useState(false)
  const [isPaid, setIsPaid] = useState(false)
  const [meetingDate, setMeetingDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [duration, setDuration] = useState("")
  const [price, setPrice] = useState("")
  const [currency, setCurrency] = useState("USD")
  const [meetingCode, setMeetingCode] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  /* --- helpers (left empty) --- */
  const generateMeetingCode = () => { }
  const handleCreateMeeting = async () => { }
  const copyMeetingCode = async () => { }
  const resetForm = () => {
    setMeetingTitle("")
    setDescription("")
    setIsScheduled(false)
    setIsPaid(false)
    setMeetingDate("")
    setStartTime("")
    setEndTime("")
    setDuration("")
    setPrice("")
    setCurrency("USD")
    setMeetingCode("")
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-2xl pt-10 space-y-6 p-4 text-[var(--color-text-primary)]">
        <Card className="bg-[var(--color-surface-1)] ring-1 ring-[var(--color-surface-2)]">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold">
              Create Meeting
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* ---------- BASIC INFO ---------- */}
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
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter meeting description (optional)"
                  className="w-full min-h-[100px] resize-none border border-[var(--color-surface-2)] bg-[var(--color-surface-2)] placeholder:text-[var(--color-text-secondary)] focus:ring-2 focus:ring-[var(--color-accent)]"
                />
              </div>
            </div>

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
                      type="date"
                      value={meetingDate}
                      onChange={(e) => setMeetingDate(e.target.value)}
                      className="border border-[var(--color-surface-2)] bg-[var(--color-surface-2)] focus:ring-2 focus:ring-[var(--color-accent)]"
                    />
                  </div>

                  {/* Duration */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Duration (minutes)</Label>
                    <Input
                      type="number"
                      placeholder="60"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="border border-[var(--color-surface-2)] bg-[var(--color-surface-2)] focus:ring-2 focus:ring-[var(--color-accent)]"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {/* Start */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                      <Clock className="h-4 w-4" />
                      Start Time <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="border border-[var(--color-surface-2)] bg-[var(--color-surface-2)] focus:ring-2 focus:ring-[var(--color-accent)]"
                    />
                  </div>

                  {/* End */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">End Time</Label>
                    <Input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
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
                          <DollarSign className="h-4 w-4" />
                          Price <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          className="border border-[var(--color-surface-2)] bg-[var(--color-surface-2)] focus:ring-2 focus:ring-[var(--color-accent)]"
                        />
                      </div>

                      {/* Currency */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Currency</Label>
                        <Select value={currency} onValueChange={setCurrency}>
                          <SelectTrigger className="border border-[var(--color-surface-2)] bg-[var(--color-surface-2)] focus:ring-2 focus:ring-[var(--color-accent)]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[var(--color-surface-1)] text-[var(--color-text-primary)]">
                            <SelectItem value="USD">USD ($)</SelectItem>
                            <SelectItem value="EUR">EUR (€)</SelectItem>
                            <SelectItem value="GBP">GBP (£)</SelectItem>
                            <SelectItem value="JPY">JPY (¥)</SelectItem>
                            <SelectItem value="CAD">CAD (C$)</SelectItem>
                            <SelectItem value="AUD">AUD (A$)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ---------- CREATE BUTTON ---------- */}
            <Button
              onClick={handleCreateMeeting}
              disabled={isCreating}
              className="h-12 w-full bg-[var(--color-accent)] text-[var(--color-surface)] font-medium hover:bg-[var(--color-accent-hover)] active:bg-[var(--color-accent-active)]"
            >
              {isCreating ? "Creating Meeting..." : "Create Meeting"}
            </Button>

            {/* ---------- SUCCESS MESSAGE ---------- */}
            {meetingCode && (
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

                <div className="text-center">
                  <Button
                    onClick={resetForm}
                    variant="ghost"
                    size="sm"
                    className="text-green-300 hover:bg-green-600/20"
                  >
                    Create Another Meeting
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}