import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@/lib/router";
import {
  StreamVideo,
  StreamCall,
  VideoPreview,
  SpeakerLayout,
  PaginatedGridLayout,
  useCall,
  useCallStateHooks,
  CallingState,
  ReactionsButton,
  CallStatsButton,
  CallParticipantsList,
  type Call,
  type StreamVideoClient,
} from "@stream-io/video-react-sdk";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  ScreenShareOff,
  Users,
  PhoneOff,
  LayoutGrid,
  PanelTop,
  Sparkles,
  Settings2,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "react-hot-toast";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Brand,
  Pending,
  ErrorState,
  CopyButton,
} from "@/components/heymint/common";
import { useAuth } from "@/context/AuthContext";
import { backend, errorMessage, type Meeting } from "@/lib/api";
import { createVideoClient } from "@/lib/video";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MeetingNotes, type NotesControls } from "./MeetingNotes";
import type { NotesPhase } from "@/lib/ai-notes-session";

async function releaseCall(call: Call) {
  await Promise.allSettled([
    call.camera.disable(true),
    call.microphone.disable(true),
    call.screenShare.disable(),
  ]);
  await call.leave().catch(() => undefined);
}
export default function RoomVideo({
  code,
  meeting,
}: {
  code: string;
  meeting: Meeting;
}) {
  const { user } = useAuth();
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!user) return;
    let disposed = false;
    let activeClient: StreamVideoClient | undefined;
    let activeCall: Call | undefined;
    setError("");
    setCall(null);
    setClient(null);
    (async () => {
      try {
        activeClient = await createVideoClient(user);
        if (disposed) {
          await activeClient.disconnectUser();
          return;
        }
        activeCall = activeClient.call("default", code);
        if (meeting.createdById === user.id) {
          await activeCall.getOrCreate({
            data: {
              starts_at: new Date(meeting.meetingTime).toISOString(),
              custom: {
                title: meeting.title,
                description: meeting.description,
              },
              members: [{ user_id: user.id }],
            },
          });
        } else {
          await activeCall.get();
        }
        // A new room opens without publishing devices until the user opts in.
        await Promise.all([
          activeCall.camera.disable(),
          activeCall.microphone.disable(),
        ]);
        if (disposed) {
          await releaseCall(activeCall);
          await activeClient.disconnectUser();
          return;
        }
        setClient(activeClient);
        setCall(activeCall);
      } catch (e) {
        if (activeCall) await releaseCall(activeCall);
        if (activeClient)
          await activeClient.disconnectUser().catch(() => undefined);
        if (!disposed) setError(errorMessage(e));
      }
    })();
    return () => {
      disposed = true;
      if (activeCall)
        void releaseCall(activeCall).finally(() =>
          activeClient?.disconnectUser().catch(() => undefined),
        );
      else if (activeClient)
        void activeClient.disconnectUser().catch(() => undefined);
    };
  }, [
    user,
    code,
    attempt,
    meeting.createdById,
    meeting.meetingTime,
    meeting.title,
    meeting.description,
  ]);
  if (error)
    return (
      <div className="room-page">
        <Brand />
        <ErrorState
          error={new Error(error)}
          retry={() => setAttempt((a) => a + 1)}
        />
        <Button variant="outline" asChild>
          <Link to="/dashboard/meetings">Back to meetings</Link>
        </Button>
      </div>
    );
  if (!client || !call)
    return (
      <div className="session-loading">
        <Brand />
        <Pending>Preparing your video room</Pending>
      </div>
    );
  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <RoomContent meeting={meeting} />
      </StreamCall>
    </StreamVideo>
  );
}
function DeviceFields() {
  const { useCameraState, useMicrophoneState, useSpeakerState } =
    useCallStateHooks();
  const camera = useCameraState();
  const mic = useMicrophoneState();
  const speaker = useSpeakerState();
  const select = async (action: () => Promise<void> | void) => {
    try {
      await action();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };
  return (
    <div className="device-fields">
      <label>
        Camera
        <select
          value={camera.selectedDevice || ""}
          onChange={(e) =>
            void select(() => camera.camera.select(e.target.value))
          }
        >
          <option value="">Default camera</option>
          {camera.devices.map((d, i) => (
            <option key={d.deviceId || i} value={d.deviceId}>
              {d.label || `Camera ${i + 1}`}
            </option>
          ))}
        </select>
      </label>
      <label>
        Microphone
        <select
          value={mic.selectedDevice || ""}
          onChange={(e) =>
            void select(() => mic.microphone.select(e.target.value))
          }
        >
          <option value="">Default microphone</option>
          {mic.devices.map((d, i) => (
            <option key={d.deviceId || i} value={d.deviceId}>
              {d.label || `Microphone ${i + 1}`}
            </option>
          ))}
        </select>
      </label>
      {speaker.isDeviceSelectionSupported && (
        <label>
          Speaker
          <select
            value={speaker.selectedDevice || ""}
            onChange={(e) =>
              void select(() => speaker.speaker.select(e.target.value))
            }
          >
            <option value="">Default speaker</option>
            {speaker.devices.map((d, i) => (
              <option key={d.deviceId || i} value={d.deviceId}>
                {d.label || `Speaker ${i + 1}`}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
function RoomContent({ meeting }: { meeting: Meeting }) {
  const call = useCall();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    useCameraState,
    useMicrophoneState,
    useScreenShareState,
    useParticipants,
    useCallCallingState,
  } = useCallStateHooks();
  const camera = useCameraState();
  const mic = useMicrophoneState();
  const screen = useScreenShareState();
  const participants = useParticipants();
  const callingState = useCallCallingState();
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [grid, setGrid] = useState(false);
  const [showPeople, setShowPeople] = useState(false);
  const [settings, setSettings] = useState(false);
  const [endConfirm, setEndConfirm] = useState(false);
  const [pending, setPending] = useState(false);
  const [ended, setEnded] = useState(!!call?.state.endedAt);
  const [leftOnly, setLeftOnly] = useState(false);
  const recorderControls = useRef<NotesControls>(null);
  const [completionPending, setCompletionPending] = useState(
    !!call?.state.endedAt && user?.id === meeting.createdById,
  );
  const [shareLink, setShareLink] = useState("");
  const [notesEnabled, setNotesEnabled] = useState(true);
  const [replaceExistingNotes, setReplaceExistingNotes] = useState(false);
  const [notesPhase, setNotesPhase] = useState<NotesPhase>("idle");
  const host = user?.id === meeting.createdById;
  const savedNotes = useQuery({
    queryKey: ["summary", meeting.meetingCode],
    queryFn: () => backend.insights(meeting.meetingCode),
    enabled: host && !joined && !ended,
    retry: false,
  });
  const notesCheckFailed =
    !!savedNotes.error &&
    !(
      axios.isAxiosError(savedNotes.error) &&
      savedNotes.error.response?.status === 404
    );
  const shouldCapture =
    notesEnabled && (!savedNotes.data || replaceExistingNotes);
  const checkingNotes =
    host &&
    shouldCapture &&
    (savedNotes.isPending || savedNotes.isFetching || notesCheckFailed);
  useEffect(() => {
    setShareLink(window.location.href);
  }, []);
  useEffect(() => {
    if (!call) return;
    return call.on("call.ended", () => {
      setEnded(true);
      void recorderControls.current?.finish().finally(() => releaseCall(call));
    });
  }, [call]);
  useEffect(() => {
    if (joined && callingState === CallingState.LEFT && !completionPending)
      setEnded(true);
  }, [joined, callingState, completionPending]);
  const action = async (fn: () => Promise<void>) => {
    try {
      await fn();
      setError("");
    } catch (e) {
      setError(errorMessage(e));
    }
  };
  const join = async () => {
    if (!call || joining || !user || checkingNotes) return;
    setJoining(true);
    setError("");
    try {
      await backend.validateAccess(user.id, meeting.meetingCode);
      await call.join({ create: false });
      setJoined(true);
      if (host && shouldCapture) await recorderControls.current?.start();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setJoining(false);
    }
  };
  const leave = async () => {
    if (!call || pending) return;
    setPending(true);
    try {
      await recorderControls.current?.finish();
      await releaseCall(call);
      if (host && joined) {
        setLeftOnly(true);
        setEnded(true);
      } else await navigate({ to: "/dashboard/meetings" });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setPending(false);
    }
  };
  const end = async () => {
    if (!call || !user || pending || !host) return;
    setPending(true);
    setError("");
    try {
      await recorderControls.current?.finish();
      if (!completionPending) {
        await call.endCall();
        setCompletionPending(true);
        setEnded(true);
      }
      await backend.deleteMeeting(meeting.meetingCode, user.id, true);
      setCompletionPending(false);
      setEndConfirm(false);
      await releaseCall(call);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["meetings"] }),
        queryClient.invalidateQueries({ queryKey: ["stats"] }),
        queryClient.invalidateQueries({ queryKey: ["active-hosted"] }),
      ]);
      toast.success("Meeting ended for everyone");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setPending(false);
    }
  };
  const toggles = (
    <>
      <Button
        variant="outline"
        size="icon"
        disabled={camera.isTogglePending || joining}
        aria-label={camera.isMute ? "Turn camera on" : "Turn camera off"}
        title={camera.isMute ? "Turn camera on" : "Turn camera off"}
        aria-pressed={!camera.isMute}
        onClick={() => void action(() => camera.camera.toggle())}
      >
        {camera.isMute ? <VideoOff /> : <Video />}
      </Button>
      <Button
        variant="outline"
        size="icon"
        disabled={mic.isTogglePending || joining}
        aria-label={mic.isMute ? "Unmute microphone" : "Mute microphone"}
        title={mic.isMute ? "Unmute microphone" : "Mute microphone"}
        aria-pressed={!mic.isMute}
        onClick={() => void action(() => mic.microphone.toggle())}
      >
        {mic.isMute ? <MicOff /> : <Mic />}
      </Button>
    </>
  );
  return (
    <div className="room-page">
      <header className="room-header">
        <div>
          <Brand />
          <h1>{meeting.title}</h1>
          <p className="field-hint">
            {host ? "Hosted by you" : `Hosted by ${meeting.hostName}`}{" "}
            {callingState === CallingState.RECONNECTING && " · Reconnecting…"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CopyButton value={shareLink} />
          <Button asChild variant="outline" size="sm">
            <Link
              to="/meeting/$id/insights"
              params={{ id: meeting.meetingCode }}
            >
              <Sparkles />
              Insights
            </Link>
          </Button>
        </div>
      </header>
      {error && (
        <p className="form-error mb-5" role="alert">
          {error}
        </p>
      )}
      {ended ? (
        <div className="room-ended">
          <Sparkles className="text-primary size-8" />
          <h2>
            {leftOnly
              ? "You’ve left the conversation."
              : "The room closes. The ideas stay open."}
          </h2>
          <p>
            {completionPending
              ? "The video call has ended, but HeyMint hasn’t saved its completed status yet. Retry to keep your records accurate."
              : leftOnly
                ? "Your room remains available. AI notes cover the part of the meeting you attended. Check their status below before closing this page."
                : "This conversation has ended. If AI notes were enabled, check their status below before closing this page."}
          </p>
          {completionPending && (
            <Button onClick={() => void end()} disabled={pending}>
              {pending ? <Pending /> : "Retry saving completion"}
            </Button>
          )}
          <div className="flex flex-wrap gap-3 justify-center">
            <Button asChild>
              <Link
                to="/meeting/$id/insights"
                params={{ id: meeting.meetingCode }}
              >
                Open insights
                <ArrowUpRight />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/dashboard/meetings">Back to meetings</Link>
            </Button>
          </div>
        </div>
      ) : !joined ? (
        <div className="room-stage">
          <div className="prejoin-layout">
            <div>
              <div className="prejoin-preview">
                <VideoPreview />
              </div>
              <div className="room-controls">{toggles}</div>
            </div>
            <section className="prejoin-settings">
              <p className="eyebrow">A QUICK CHECK. THEN A GOOD HELLO.</p>
              <h2>Ready when you are.</h2>
              <p>
                Check your camera and microphone before entering. You can join
                with both off. If permission is blocked, allow it in your
                browser settings.
              </p>
              <DeviceFields />
              {host && (
                <div className="ai-notes-option">
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={shouldCapture}
                      disabled={joining || savedNotes.isFetching}
                      onChange={(e) => {
                        setNotesEnabled(e.target.checked);
                        setReplaceExistingNotes(e.target.checked);
                      }}
                    />
                    <span>
                      <strong>AI meeting notes</strong>
                      <br />
                      Capture shared meeting audio while you talk, then
                      automatically generate a summary and transcript when you
                      leave or end the call.
                    </span>
                  </label>
                  {savedNotes.isFetching && (
                    <Pending>Checking for saved insights</Pending>
                  )}
                  {savedNotes.data && (
                    <p className="field-hint">
                      This meeting already has saved insights. AI notes are off
                      by default to preserve them. Enabling notes replaces the
                      saved summary and transcript with audio from this visit.
                    </p>
                  )}
                  {notesCheckFailed && (
                    <div role="alert">
                      <p className="form-error">
                        Couldn’t check for saved insights. Retry, or switch off
                        AI notes to join without capture.
                      </p>
                      <Button
                        variant="link"
                        onClick={() => void savedNotes.refetch()}
                      >
                        Retry insights check
                      </Button>
                    </div>
                  )}
                  <p className="field-hint">
                    Let everyone know and obtain their consent before joining
                    with AI notes enabled. Audio is buffered in this tab, with
                    no download required. Keep this page open until processing
                    finishes.
                  </p>
                </div>
              )}
              {(!camera.hasBrowserPermission || !mic.hasBrowserPermission) && (
                <p className="field-hint mb-5">
                  Camera or microphone access hasn’t been granted. Use the
                  controls to request access; you can also continue without
                  them.
                </p>
              )}
              <Button
                size="lg"
                disabled={joining || checkingNotes}
                onClick={() => void join()}
              >
                {joining ? (
                  <Pending>Joining your conversation</Pending>
                ) : (
                  <>
                    Join meeting
                    <ArrowUpRight />
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                onClick={() => void leave()}
                disabled={pending}
                className="ml-2"
              >
                Go back
              </Button>
            </section>
          </div>
        </div>
      ) : (
        <>
          <div className="room-stage">
            {grid ? <PaginatedGridLayout /> : <SpeakerLayout />}
          </div>
          <div className="room-controls">
            {toggles}
            <ReactionsButton />
            <CallStatsButton />
            <Button
              variant="outline"
              size="icon"
              disabled={screen.isTogglePending}
              aria-label={
                screen.isMute ? "Share screen" : "Stop screen sharing"
              }
              title={screen.isMute ? "Share screen" : "Stop screen sharing"}
              aria-pressed={!screen.isMute}
              onClick={() => void action(() => screen.screenShare.toggle())}
            >
              {screen.isMute ? <ScreenShare /> : <ScreenShareOff />}
            </Button>
            <span className="control-divider" />
            <Button
              variant="ghost"
              size="icon"
              aria-label={grid ? "Speaker layout" : "Grid layout"}
              title={grid ? "Speaker layout" : "Grid layout"}
              onClick={() => setGrid(!grid)}
            >
              {grid ? <PanelTop /> : <LayoutGrid />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Participants"
              title="Participants"
              aria-pressed={showPeople}
              onClick={() => setShowPeople(!showPeople)}
            >
              <Users />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Device settings"
              title="Device settings"
              onClick={() => setSettings(true)}
            >
              <Settings2 />
            </Button>
            <span className="control-divider" />
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() => void leave()}
            >
              <PhoneOff />
              Leave
            </Button>
            {host && (
              <Button
                variant="outline"
                onClick={() => setEndConfirm(true)}
                disabled={pending}
              >
                End for everyone
              </Button>
            )}
          </div>
          {showPeople && (
            <section className="room-sidepanel">
              <h3>In this conversation ({participants.length})</h3>
              <CallParticipantsList onClose={() => setShowPeople(false)} />
            </section>
          )}
        </>
      )}
      {host && (
        <MeetingNotes
          ref={recorderControls}
          onPhaseChange={setNotesPhase}
          code={meeting.meetingCode}
          ended={ended}
        />
      )}
      {host && joined && notesPhase === "idle" && !shouldCapture && (
        <p className="field-hint">
          AI notes are off for this visit. No meeting audio is being captured by
          this tab.
        </p>
      )}
      <Dialog open={settings} onOpenChange={setSettings}>
        <DialogContent>
          <DialogTitle>Your devices</DialogTitle>
          <DialogDescription>
            Choose the camera, microphone and speaker for this conversation.
          </DialogDescription>
          <DeviceFields />
        </DialogContent>
      </Dialog>
      <Dialog
        open={endConfirm}
        onOpenChange={(o) => {
          if (!pending) setEndConfirm(o);
        }}
      >
        <DialogContent>
          <DialogTitle>End this conversation for everyone?</DialogTitle>
          <DialogDescription>
            This closes the Stream call and marks your meeting as completed.
            Everyone will leave the call. If AI notes are enabled, your captured
            audio will be submitted automatically. Keep this page open while
            insights are created.
          </DialogDescription>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => setEndConfirm(false)}
            >
              Keep talking
            </Button>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() => void end()}
            >
              {pending ? <Pending /> : <PhoneOff />}End meeting
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
