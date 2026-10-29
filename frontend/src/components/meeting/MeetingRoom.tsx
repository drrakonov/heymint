import { cn } from "@/lib/utils";
import {
  CallingState,
  CallParticipantsList,
  CallStatsButton,
  PaginatedGridLayout,
  SpeakerLayout,
  useCall,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import { useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { ChevronDown, Copy, LayoutGrid, PanelRight, Users } from "lucide-react";
import toast from "react-hot-toast";
import EndCallButton from "./EndCallButton";
import ConnectionError from "../subComponents/ConnectionError";
import { useNavigate } from "react-router-dom";
import { CustomCallControls } from "./CustomCallControls";
import { getMeetingJoinLink } from "@/lib/meetingLinks";

type CallLayoutType = "grid" | "speaker-left" | "speaker-right";

const MeetingRoom = () => {
  const [layout, setLayout] = useState<CallLayoutType>("speaker-left");
  const [showParticipants, setShowParticipants] = useState(false);
  const call = useCall();
  const { useCallCallingState, useParticipants } = useCallStateHooks();
  const callingState = useCallCallingState();
  const participants = useParticipants();
  const navigate = useNavigate();

  if (callingState !== CallingState.JOINED) return <ConnectionError
    message={callingState === CallingState.LEFT ? "You’ve left the meeting, or the host ended it." : "Your meeting connection was interrupted. We’re trying to reconnect."}
    onExit={() => navigate("/dashboard/meetings")} />;

  const copyCode = async () => {
    if (!call?.id) return;
    try {
      await navigator.clipboard.writeText(getMeetingJoinLink(call.id));
      toast.success("Joining link copied");
    } catch { toast.error("Could not copy the invitation link"); }
  };

  const callLayout = layout === "grid"
    ? <PaginatedGridLayout />
    : <SpeakerLayout participantsBarPosition={layout === "speaker-right" ? "left" : "right"} />;

  const labels: Record<CallLayoutType, string> = {
    grid: "Grid",
    "speaker-left": "Speaker left",
    "speaker-right": "Speaker right",
  };

  return (
    <section className="meeting-room relative h-dvh w-full overflow-hidden bg-[#020605] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(82,227,172,.12),transparent_40%)]" />

      <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between gap-2 p-3 sm:p-5">
        <div className="liquid-glass flex items-center gap-3 rounded-full px-4 py-2">
          <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-40"/><span className="relative h-2.5 w-2.5 rounded-full bg-primary"/></span>
          <div className="relative hidden sm:block"><p className="text-xs font-medium text-white/90">Meeting in progress</p><p className="text-[10px] text-white/40">{participants.length} participant{participants.length === 1 ? "" : "s"}</p></div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2" role="group" aria-label="Meeting view and participants">
          <DropdownMenu>
            <DropdownMenuTrigger aria-label={`Change layout: ${labels[layout]}`} className="glass-control flex h-10 items-center gap-1.5 rounded-xl px-2.5 text-xs text-white/75 focus-visible:outline-2 focus-visible:outline-primary">
              <LayoutGrid size={17}/><span className="hidden md:inline">{labels[layout]}</span><ChevronDown size={13}/>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="rounded-2xl border border-white/10 bg-[#0b1714] p-1 text-text-primary shadow-2xl">
              {(Object.keys(labels) as CallLayoutType[]).map(item => (
                <DropdownMenuItem key={item} onClick={() => setLayout(item)} className="m-1 cursor-pointer rounded-xl px-3 py-2 focus:bg-primary/10 focus:text-primary">
                  {labels[item]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <span className="meeting-stats-control"><CallStatsButton /></span>
          <button onClick={() => setShowParticipants(value => !value)} className={cn("glass-control flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white/75", showParticipants && "border-primary/30 bg-primary/15 text-primary")} aria-label="Toggle participants" aria-expanded={showParticipants}>
            {showParticipants ? <PanelRight size={17}/> : <Users size={17}/>}
          </button>
          <button onClick={copyCode} className="glass-control flex h-10 items-center gap-2 rounded-xl px-3 text-xs text-white/65" aria-label="Copy joining link"><Copy size={14}/><span className="hidden sm:block">Copy invite</span></button>
        </div>
      </header>

      <div className="relative flex h-full w-full items-center justify-center px-2 pb-24 pt-18 sm:px-5 sm:pb-28">
        <div className={cn("h-full min-w-0 flex-1 transition-[padding] duration-300", showParticipants && "lg:pr-[330px]")}>
          <div className="h-full overflow-hidden rounded-[24px] border border-white/[.07] bg-white/[.018] p-1 sm:rounded-[30px] sm:p-2">
            {callLayout}
          </div>
        </div>
        <aside className={cn("liquid-glass absolute bottom-24 right-3 top-18 z-20 w-[min(330px,calc(100%-24px))] overflow-hidden rounded-[26px] sm:right-5 sm:top-20", showParticipants ? "block" : "hidden")}>
          <CallParticipantsList onClose={() => setShowParticipants(false)} />
        </aside>
      </div>

      <div className="meeting-control-dock liquid-glass" role="group" aria-label="Call controls">
        <CustomCallControls />
        <span className="mx-1 h-7 w-px shrink-0 bg-white/10" />
        <EndCallButton />
      </div>
    </section>
  );
};

export default MeetingRoom;
