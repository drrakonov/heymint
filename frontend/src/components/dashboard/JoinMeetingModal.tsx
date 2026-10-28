import { useState } from "react";
import { Video, Link2, ArrowRight, ShieldCheck, Mic } from "lucide-react";
import PageHeader from "../workspace/PageHeader";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useStreamVideoClient } from "@stream-io/video-react-sdk";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "@/store/userStore";
import { extractMeetingCode } from "@/lib/meetingLinks";

export default function JoinMeetingModal() {
  const [meetingId, setMeetingId] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const { user } = useUserStore();

  const isFormValid = meetingId.trim() !== "";
  const client = useStreamVideoClient();
  const navigate = useNavigate();

  const handleJoinMeeting = async () => {
    if (!isFormValid || isJoining) return;

    try {
      if (!client || !user) {
        toast.error("unable to join this call");
        return;
      }
      setIsJoining(true);

      const code = extractMeetingCode(meetingId);
      if (!code) {
        toast.error("Enter a valid meeting link or code");
        return;
      }
      const call = client.call("default", code);
      if (!call) throw new Error("Failed to create call");

      try {
        await call.get();
        navigate(`/meeting/${code}`);
      } catch {
        toast.error("Meeting not available yet. Wait for the host to start.");
      }

    } catch (error) {
      console.error("Join failed", error);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="page-shell">
      <PageHeader eyebrow="Join a conversation" title="Your seat is waiting." description="Paste an invitation link or meeting code to find your room."/>
      <div className="grid items-start gap-6 lg:grid-cols-[1.4fr_1fr]">
        <form onSubmit={e=>{e.preventDefault();void handleJoinMeeting();}} className="workspace-panel p-6 sm:p-8">
          <span className="section-icon"><Link2 size={20}/></span>
          <h2 className="mb-7 mt-5 text-xl font-semibold tracking-tight">Let’s find your meeting.</h2>
          <label htmlFor="meeting-id" className="text-sm font-medium">Meeting link or code</label>
          <Input id="meeting-id" value={meetingId} onChange={e=>setMeetingId(e.target.value)} placeholder="Paste your invite here" className="glass-input mt-3 w-full text-sm" autoComplete="off" required/>
          <p className="mt-3 text-xs leading-5 text-text-secondary">You’ll find the invite in the meeting library or from your host.</p>
          <Button type="submit" disabled={!isFormValid || isJoining} className="workspace-action mint-button mt-7 w-full disabled:opacity-45">{isJoining ? 'Finding your room…' : <><Video size={16}/> Continue to meeting <ArrowRight size={15}/></>}</Button>
          <p className="mt-4 text-center text-xs text-text-secondary">Your camera and microphone stay off until you choose.</p>
        </form>
        <aside className="workspace-panel p-6 sm:p-8"><p className="eyebrow">Before you join</p><div className="mt-6 space-y-7">{[{icon:Link2,title:'Open your invitation',text:'Use the full link or just the meeting code.'},{icon:ShieldCheck,title:'Enter the room password',text:'Only needed if your host made the meeting protected.'},{icon:Mic,title:'Check your devices',text:'Choose your microphone and camera in the waiting room.'}].map(({icon:Icon,title,text},i)=><div key={title} className="flex gap-4"><span className="section-icon"><Icon size={17}/></span><div><p className="text-[10px] text-text-secondary">0{i+1}</p><h3 className="mt-1 text-sm font-medium">{title}</h3><p className="mt-1 text-xs leading-5 text-text-secondary">{text}</p></div></div>)}</div></aside>
      </div>
    </div>
  );
}
