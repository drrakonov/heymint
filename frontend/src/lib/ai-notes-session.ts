export type NotesPhase =
  | "idle"
  | "starting"
  | "capturing"
  | "stopping"
  | "processing"
  | "ready"
  | "error"
  | "discarded";

export type NotesState = {
  phase: NotesPhase;
  error?: string;
  audio?: Blob;
  failure?: "capture" | "processing";
};

type Recorder = {
  start(): Promise<void>;
  stop(): Promise<Blob>;
  dispose(): void;
  readonly error: Error | null;
};

/** One capture and one summary per room visit. Finalizing never waits for AI. */
export class AiNotesSession {
  state: NotesState = { phase: "idle" };
  private recorder?: Recorder;
  private starting?: Promise<void>;
  private stopping?: Promise<void>;
  private uploading?: Promise<void>;
  private finished = false;
  private disposed = false;
  private createRecorder: () => Recorder;
  private submit: (audio: Blob) => Promise<unknown>;
  private onChange: (state: NotesState) => void;

  get canStart() {
    return (
      !this.disposed &&
      !this.finished &&
      !this.state.audio &&
      ["idle", "error"].includes(this.state.phase)
    );
  }

  constructor(options: {
    createRecorder: () => Recorder;
    submit: (audio: Blob) => Promise<unknown>;
    onChange: (state: NotesState) => void;
  }) {
    this.createRecorder = options.createRecorder;
    this.submit = options.submit;
    this.onChange = options.onChange;
  }

  private update(state: NotesState) {
    if (this.disposed) return;
    this.state = state;
    this.onChange(state);
  }

  start(): Promise<void> {
    if (this.starting) return this.starting;
    if (
      this.disposed ||
      this.finished ||
      !["idle", "error"].includes(this.state.phase) ||
      this.state.audio
    )
      return Promise.resolve();
    this.update({ phase: "starting" });
    this.starting = (async () => {
      try {
        this.recorder?.dispose();
        this.recorder = this.createRecorder();
        await this.recorder.start();
        this.update({ phase: "capturing" });
      } catch (error) {
        this.update({
          phase: "error",
          failure: "capture",
          error: message(error),
        });
      }
    })().finally(() => {
      this.starting = undefined;
    });
    return this.starting;
  }

  finish(): Promise<void> {
    if (this.stopping) return this.stopping;
    if (this.finished || this.disposed) return Promise.resolve();
    this.finished = true;
    this.stopping = (async () => {
      await this.starting;
      if (this.disposed || this.state.phase !== "capturing") return;
      this.update({ phase: "stopping" });
      try {
        const audio = await this.recorder!.stop();
        if (this.disposed) return;
        this.recorder?.dispose();
        this.recorder = undefined;
        this.update({ phase: "processing", audio });
        // Release the call immediately; keep the page alive while AI processes.
        void this.upload(audio);
      } catch (error) {
        this.recorder?.dispose();
        this.recorder = undefined;
        this.update({
          phase: "error",
          failure: "capture",
          error: message(error),
        });
      }
    })();
    return this.stopping;
  }

  private upload(audio: Blob): Promise<void> {
    if (this.uploading) return this.uploading;
    this.update({ phase: "processing", audio });
    this.uploading = (async () => {
      try {
        await this.submit(audio);
        this.update({ phase: "ready" });
      } catch (error) {
        this.update({
          phase: "error",
          failure: "processing",
          audio,
          error: message(error),
        });
      }
    })().finally(() => {
      this.uploading = undefined;
    });
    return this.uploading;
  }

  retry(): Promise<void> {
    if (this.disposed || this.state.phase !== "error" || !this.state.audio)
      return Promise.resolve();
    return this.upload(this.state.audio);
  }

  checkCapture() {
    if (this.state.phase === "capturing" && this.recorder?.error) {
      this.finished = true;
      this.update({
        phase: "error",
        failure: "capture",
        error: this.recorder.error.message,
      });
      this.recorder.dispose();
    }
  }

  discard() {
    if (this.state.phase !== "error") return;
    this.finished = true;
    this.recorder?.dispose();
    this.update({ phase: "discarded" });
  }

  dispose() {
    this.disposed = true;
    this.recorder?.dispose();
    this.state = { phase: "discarded" };
  }
}

function message(error: unknown) {
  return error instanceof Error
    ? error.message
    : "AI notes could not be completed.";
}
