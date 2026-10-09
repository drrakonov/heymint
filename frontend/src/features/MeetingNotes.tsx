import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
} from "react";
import { useCall } from "@stream-io/video-react-sdk";
import { useQueryClient } from "@tanstack/react-query";
import { Download, Sparkles } from "lucide-react";
import { toast } from "react-hot-toast";
import { Link } from "@/lib/router";
import { backend, errorMessage } from "@/lib/api";
import {
  AiNotesSession,
  type NotesPhase,
  type NotesState,
} from "@/lib/ai-notes-session";
import { MeetingRecorder } from "@/lib/meeting-recorder";
import { Button } from "@/components/ui/button";
import { Pending } from "@/components/heymint/common";

export type NotesControls = { start(): Promise<void>; finish(): Promise<void> };

export function MeetingNotes({
  code,
  ended,
  ref,
  onPhaseChange,
}: {
  code: string;
  ended: boolean;
  ref: Ref<NotesControls>;
  onPhaseChange: (phase: NotesPhase) => void;
}) {
  const call = useCall();
  const queryClient = useQueryClient();
  const session = useRef<AiNotesSession | null>(null);
  const [state, setState] = useState<NotesState>({ phase: "idle" });
  const [download, setDownload] = useState("");
  const [recovered, setRecovered] = useState(false);
  const { phase } = state;
  const start = () => {
    if (!call || ended) return Promise.resolve();
    if (!session.current) {
      session.current = new AiNotesSession({
        createRecorder: () => new MeetingRecorder(call),
        submit: async (audio) => {
          try {
            await backend.summarize(code, audio);
          } catch (error) {
            throw new Error(errorMessage(error));
          }
          // A cache-refresh failure must not submit the same audio a second time.
          void queryClient
            .invalidateQueries({ queryKey: ["summary", code] })
            .catch(() => undefined);
        },
        onChange: setState,
      });
    }
    return session.current.start();
  };
  useImperativeHandle(ref, () => ({
    start,
    finish: () => session.current?.finish() || Promise.resolve(),
  }));
  useEffect(() => {
    onPhaseChange(phase);
  }, [phase, onPhaseChange]);
  useEffect(() => {
    if (ended) void session.current?.finish();
  }, [ended]);
  useEffect(
    () => () => {
      session.current?.dispose();
      session.current = null;
    },
    [],
  );
  useEffect(() => {
    if (phase !== "capturing") return;
    const timer = setInterval(() => session.current?.checkCapture(), 1000);
    return () => clearInterval(timer);
  }, [phase]);
  useEffect(() => {
    if (phase !== "error" || !state.audio) return;
    const url = URL.createObjectURL(state.audio);
    setDownload(url);
    return () => URL.revokeObjectURL(url);
  }, [phase, state.audio]);
  const unsafeToLeave =
    ["starting", "capturing", "stopping", "processing"].includes(phase) ||
    (phase === "error" && !!state.audio && !recovered);
  useEffect(() => {
    if (!unsafeToLeave) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const guard = (event: MouseEvent) => {
      const link =
        event.target instanceof Element ? event.target.closest("a") : null;
      if (!link || link.hasAttribute("download") || link.target === "_blank")
        return;
      event.preventDefault();
      event.stopPropagation();
      toast.error(
        phase === "capturing"
          ? "Leave or end the call to generate your AI notes first."
          : "Keep this page open until notes are ready, or recover the audio if processing failed.",
      );
    };
    window.addEventListener("beforeunload", warn);
    document.addEventListener("click", guard, true);
    return () => {
      window.removeEventListener("beforeunload", warn);
      document.removeEventListener("click", guard, true);
    };
  }, [unsafeToLeave, phase]);

  if (phase === "idle") return null;
  return (
    <section className="recording-panel" aria-label="AI meeting notes">
      <h3>
        <Sparkles className="inline size-4 mr-2" />
        AI meeting notes
      </h3>
      <div role="status" aria-live="polite">
        {phase === "starting" && <Pending>Starting AI audio capture</Pending>}
        {phase === "capturing" && (
          <>
            <div className="recording-status">
              <span />
              Capturing meeting audio for AI notes
            </div>
            <p>
              Notes are created automatically when you leave or end the meeting.
              Keep this page open. Muted microphones are excluded.
            </p>
          </>
        )}
        {phase === "stopping" && <Pending>Finishing audio capture</Pending>}
        {phase === "processing" && (
          <>
            <Pending>Creating your meeting insights</Pending>
            <p>
              You can leave the call now. Keep this page open while HeyMint
              submits the audio and generates your summary and transcript.
            </p>
          </>
        )}
        {phase === "ready" && (
          <>
            <p>
              Your summary and transcript are saved. Transcript search for
              Q&amp;A may take a little longer to become available.
            </p>
            <Button asChild className="mt-4">
              <Link to="/meeting/$id/insights" params={{ id: code }}>
                Open insights
              </Link>
            </Button>
          </>
        )}
        {phase === "discarded" && (
          <p>Audio discarded. No new insights were saved from this capture.</p>
        )}
      </div>
      {phase === "error" && (
        <>
          <p className="form-error mt-3" role="alert">
            {state.error}
          </p>
          <p>
            {state.audio
              ? "Processing failed. Your audio is still held temporarily in this page. Retry without recording again, or download a recovery copy."
              : "AI audio capture failed. The call can continue, but this capture cannot produce meeting notes."}
          </p>
          <div className="recording-actions">
            {state.audio ? (
              <>
                <Button
                  onClick={() => {
                    setRecovered(false);
                    void session.current?.retry();
                  }}
                >
                  Retry creating insights
                </Button>
                <Button asChild variant="outline">
                  <a
                    href={download}
                    download="heymint-meeting.webm"
                    onClick={() => setRecovered(true)}
                  >
                    <Download />
                    Download recovery audio
                  </a>
                </Button>
              </>
            ) : (
              !ended &&
              session.current?.canStart && (
                <Button onClick={() => void start()}>Retry AI capture</Button>
              )
            )}
            <Button variant="ghost" onClick={() => session.current?.discard()}>
              Discard capture
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
