import { useState } from "react";
import { Video } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";

export default function JoinMeetingModal() {
  const [meetingId, setMeetingId] = useState("");
  const [name, setName] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const isFormValid = meetingId.trim() !== "" && name.trim() !== "";

  const handleJoinMeeting = async () => {
    if (!isFormValid || isJoining) return;

    try {
      setIsJoining(true);
      // TODO: implement join logic
      console.log("Joining:", meetingId, name);
      await new Promise((res) => setTimeout(res, 1000));
    } catch (error) {
      console.error("Join failed", error);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className=" min-h-screen flex items-center justify-center p-4 text-[var(--color-text-primary)]">
      <Card className="w-full max-w-2xl bg-[var(--color-surface-1)] ring-1 ring-[var(--color-surface-2)]">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            Join Meeting
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Meeting ID Field */}
          <div className="space-y-2">
            <Label htmlFor="meeting-id" className="text-sm font-medium">
              Meeting ID <span className="text-red-500">*</span>
            </Label>
            <Input
              id="meeting-id"
              value={meetingId}
              onChange={(e) => setMeetingId(e.target.value)}
              placeholder="e.g., 123-456-789"
              className="w-full text-center font-mono border border-[var(--color-surface-2)] bg-[var(--color-surface-2)] placeholder:text-[var(--color-text-secondary)] focus:ring-2 focus:ring-[var(--color-accent)]"
            />
          </div>

          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Your Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full border border-[var(--color-surface-2)] bg-[var(--color-surface-2)] placeholder:text-[var(--color-text-secondary)] focus:ring-2 focus:ring-[var(--color-accent)]"
            />
          </div>

          {/* Join Button */}
          <Button
            onClick={handleJoinMeeting}
            className="w-full h-12 bg-accent text-surface font-medium hover:bg-accent/40 active:bg-accent"
          >
            {isJoining ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Joining Meeting...
              </>
            ) : (
              <>
                <Video className="h-4 w-4 mr-2" />
                Join Meeting
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
