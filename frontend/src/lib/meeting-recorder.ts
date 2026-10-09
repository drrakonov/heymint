import {
  CallingState,
  hasAudio,
  hasScreenShareAudio,
  type Call,
} from "@stream-io/video-react-sdk";

type Subscription = { unsubscribe(): void };
type RecordingState =
  "idle" | "starting" | "recording" | "stopping" | "stopped" | "disposed";

/**
 * A single, browser-side WebM recording of the audio actually shared in a call.
 * Start from a user gesture after joining, and await stop() before ending the call.
 * The SDK owns every input track; this class only owns its output stream.
 */
export class MeetingRecorder {
  private readonly call: Call;
  private state: RecordingState = "idle";
  private context: AudioContext | null = null;
  private destination: MediaStreamAudioDestinationNode | null = null;
  private recorder: MediaRecorder | null = null;
  private sources = new Map<MediaStreamTrack, MediaStreamAudioSourceNode>();
  private streamListeners = new Map<MediaStream, () => void>();
  private subscriptions: Subscription[] = [];
  private chunks: Blob[] = [];
  private recording: Blob | null = null;
  private failure: Error | null = null;
  private stopPromise: Promise<Blob> | null = null;
  private resolveStop: ((blob: Blob) => void) | null = null;
  private rejectStop: ((error: Error) => void) | null = null;
  private stopTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(call: Call) {
    this.call = call;
  }

  get isRecording(): boolean {
    return this.state === "recording" && this.recorder?.state === "recording";
  }

  get error(): Error | null {
    return this.failure;
  }

  async start(): Promise<void> {
    if (this.state !== "idle") {
      throw new Error(
        "This recorder has already been used. Create a new recorder for another recording.",
      );
    }
    if (this.call.state.callingState !== CallingState.JOINED) {
      throw new Error("Join the meeting before starting audio capture.");
    }
    if (typeof window === "undefined" || !window.isSecureContext) {
      throw new Error("Audio capture requires HTTPS or localhost.");
    }
    if (
      typeof MediaRecorder === "undefined" ||
      typeof AudioContext === "undefined"
    ) {
      throw new Error(
        "This browser does not support meeting audio capture. Try a current version of Chrome, Edge, or Firefox.",
      );
    }
    const mimeType = ["audio/webm;codecs=opus", "audio/webm"].find((type) =>
      MediaRecorder.isTypeSupported(type),
    );
    if (!mimeType) {
      throw new Error(
        "This browser cannot record WebM audio, which HeyMint needs for meeting insights. Use a browser with WebM recording support.",
      );
    }

    this.state = "starting";
    try {
      this.context = new AudioContext();
      this.destination = this.context.createMediaStreamDestination();
      await this.context.resume();
      if (this.isDisposed()) throw new Error("Audio capture was cancelled.");
      if (this.context.state !== "running") {
        throw new Error(
          "The browser paused audio capture. Click Start capture again to allow audio processing.",
        );
      }

      this.recorder = new MediaRecorder(this.destination.stream, {
        mimeType,
        audioBitsPerSecond: 64_000,
      });
      this.recorder.ondataavailable = ({ data }) => {
        if (data.size > 0) this.chunks.push(data);
      };
      this.recorder.onerror = () => {
        this.failure = new Error(
          "The browser stopped recording meeting audio. Please try recording again.",
        );
        // Browsers dispatch a final dataavailable and stop event after an error.
        if (this.recorder?.state !== "inactive") this.recorder?.stop();
      };
      this.recorder.onstop = () => this.finish();

      const refresh = () => {
        try {
          this.syncSources();
        } catch (error) {
          this.failure =
            error instanceof Error
              ? error
              : new Error("Could not connect meeting audio to the recorder.");
          if (this.recorder?.state === "recording") this.recorder.stop();
        }
      };
      const observe = (observable: {
        subscribe(next: () => void): Subscription;
      }) => {
        this.subscriptions.push(observable.subscribe(refresh));
      };
      observe(this.call.state.participants$);
      observe(this.call.state.callingState$);
      observe(this.call.microphone.state.mediaStream$);
      observe(this.call.microphone.state.status$);
      observe(this.call.microphone.state.optimisticStatus$);
      observe(this.call.screenShare.state.mediaStream$);
      observe(this.call.screenShare.state.status$);
      observe(this.call.screenShare.state.optimisticStatus$);
      observe(this.call.screenShare.state.audioEnabled$);
      if (this.failure) throw this.failure;
      this.recorder.start(1_000);
      this.state = "recording";
    } catch (error) {
      this.failure =
        error instanceof Error
          ? error
          : new Error("Could not start meeting audio capture.");
      this.releaseResources();
      if (!this.isDisposed()) this.state = "stopped";
      throw this.failure;
    }
  }

  stop(): Promise<Blob> {
    if (this.stopPromise) return this.stopPromise;
    if (this.failure) return Promise.reject(this.failure);
    if (this.recording) return Promise.resolve(this.recording);
    if (this.state !== "recording" || !this.recorder) {
      return Promise.reject(
        new Error("There is no active audio recording to save."),
      );
    }

    this.state = "stopping";
    this.stopPromise = new Promise<Blob>((resolve, reject) => {
      this.resolveStop = resolve;
      this.rejectStop = reject;
    });
    this.stopTimeout = setTimeout(() => {
      this.failure = new Error(
        "The browser could not finish the audio recording. Please try again.",
      );
      this.finish();
    }, 10_000);
    try {
      // Wait for the final dataavailable event, rather than assembling partial chunks.
      this.recorder.stop();
    } catch (error) {
      this.failure =
        error instanceof Error
          ? error
          : new Error("Could not stop meeting audio capture.");
      this.finish();
    }
    return this.stopPromise;
  }

  /** Discard an unfinished recording and immediately release recorder resources. */
  dispose(): void {
    if (this.isDisposed()) return;
    this.state = "disposed";
    if (
      this.recorder?.state === "recording" ||
      this.recorder?.state === "paused"
    ) {
      this.recorder.onstop = null;
      this.recorder.ondataavailable = null;
      this.recorder.onerror = null;
      this.recorder.stop();
    }
    this.rejectStop?.(new Error("Audio capture was cancelled."));
    this.resolveStop = null;
    this.rejectStop = null;
    this.chunks = [];
    this.releaseResources();
  }

  private isDisposed(): boolean {
    return this.state === "disposed";
  }

  private syncSources(): void {
    if (!this.context || !this.destination || this.isDisposed()) return;
    const streams = new Set<MediaStream>();
    const localParticipant = this.call.state.localParticipant;
    const microphone = this.call.microphone.state;
    const screenShare = this.call.screenShare.state;
    // A retained microphone stream can continue capturing while unpublished.
    // Require both publication and actual/optimistic device state before mixing it.
    const joined = this.call.state.callingState === CallingState.JOINED;
    for (const participant of this.call.state.participants) {
      const isLocal =
        participant.isLocalParticipant ||
        participant.sessionId === localParticipant?.sessionId;
      if (isLocal) {
        if (
          joined &&
          hasAudio(participant) &&
          microphone.status === "enabled" &&
          microphone.optimisticStatus !== "disabled"
        ) {
          const stream = microphone.mediaStream ?? participant.audioStream;
          if (stream) streams.add(stream);
        }
        if (
          joined &&
          hasScreenShareAudio(participant) &&
          screenShare.status === "enabled" &&
          screenShare.optimisticStatus !== "disabled" &&
          screenShare.audioEnabled
        ) {
          const stream =
            screenShare.mediaStream ?? participant.screenShareAudioStream;
          if (stream) streams.add(stream);
        }
      } else if (joined) {
        if (hasAudio(participant) && participant.audioStream)
          streams.add(participant.audioStream);
        if (
          hasScreenShareAudio(participant) &&
          participant.screenShareAudioStream
        )
          streams.add(participant.screenShareAudioStream);
      }
    }

    for (const [stream, removeListeners] of this.streamListeners) {
      if (!streams.has(stream)) {
        removeListeners();
        this.streamListeners.delete(stream);
      }
    }
    const tracks = new Set<MediaStreamTrack>();
    for (const stream of streams) {
      if (!this.streamListeners.has(stream)) {
        const update = () => {
          try {
            this.syncSources();
          } catch (error) {
            this.failure =
              error instanceof Error
                ? error
                : new Error("Meeting audio changed unexpectedly.");
            if (this.recorder?.state === "recording") this.recorder.stop();
          }
        };
        stream.addEventListener("addtrack", update);
        stream.addEventListener("removetrack", update);
        this.streamListeners.set(stream, () => {
          stream.removeEventListener("addtrack", update);
          stream.removeEventListener("removetrack", update);
        });
      }
      for (const track of stream.getAudioTracks()) {
        if (track.readyState === "live") tracks.add(track);
      }
    }
    for (const [track, source] of this.sources) {
      if (!tracks.has(track)) {
        source.disconnect();
        this.sources.delete(track);
      }
    }
    for (const track of tracks) {
      if (this.sources.has(track)) continue;
      // A new stream wrapper avoids cloning or taking ownership of SDK tracks.
      const source = this.context.createMediaStreamSource(
        new MediaStream([track]),
      );
      source.connect(this.destination);
      this.sources.set(track, source);
    }
  }

  private finish(): void {
    if (this.isDisposed()) return;
    const mimeType = this.recorder?.mimeType || "audio/webm";
    this.recording = new Blob(this.chunks, { type: mimeType });
    this.chunks = [];
    if (!this.failure && this.recording.size === 0) {
      this.failure = new Error(
        "No meeting audio was captured. Start another recording and try again.",
      );
    }
    this.state = "stopped";
    this.releaseResources();
    if (this.failure) this.rejectStop?.(this.failure);
    else this.resolveStop?.(this.recording);
    this.resolveStop = null;
    this.rejectStop = null;
  }

  private releaseResources(): void {
    if (this.stopTimeout) clearTimeout(this.stopTimeout);
    this.stopTimeout = null;
    for (const subscription of this.subscriptions) subscription.unsubscribe();
    this.subscriptions = [];
    for (const removeListeners of this.streamListeners.values())
      removeListeners();
    this.streamListeners.clear();
    for (const source of this.sources.values()) source.disconnect();
    this.sources.clear();
    // Only the mixer output is ours to stop. Never stop a Stream SDK input track.
    this.destination?.stream.getTracks().forEach((track) => track.stop());
    this.destination = null;
    if (this.context && this.context.state !== "closed")
      void this.context.close().catch(() => undefined);
    this.context = null;
    if (this.recorder) {
      this.recorder.ondataavailable = null;
      this.recorder.onerror = null;
      this.recorder.onstop = null;
    }
    this.recorder = null;
  }
}
