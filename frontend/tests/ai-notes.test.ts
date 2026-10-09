import { describe, expect, it, vi } from "vitest";
import { AiNotesSession } from "../src/lib/ai-notes-session";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
function setup() {
  const audio = new Blob(["complete meeting audio"], { type: "audio/webm" });
  const recorder = {
    start: vi.fn(async () => {}),
    stop: vi.fn(async () => audio),
    dispose: vi.fn(),
    error: null as Error | null,
  };
  const processing = deferred<void>();
  const submit = vi.fn(() => processing.promise);
  const onChange = vi.fn();
  const session = new AiNotesSession({
    createRecorder: () => recorder,
    submit,
    onChange,
  });
  return { session, audio, recorder, processing, submit, onChange };
}

describe("automatic meeting notes", () => {
  it("submits automatically and releases the call before AI responds", async () => {
    const { session, recorder, submit, audio, processing } = setup();
    await session.start();
    expect(session.state.phase).toBe("capturing");
    await session.finish();
    expect(recorder.stop).toHaveBeenCalledOnce();
    expect(submit).toHaveBeenCalledWith(audio);
    expect(session.state.phase).toBe("processing");
    processing.resolve();
    await vi.waitFor(() => expect(session.state.phase).toBe("ready"));
    expect(session.state.audio).toBeUndefined();
  });
  it("deduplicates concurrent host-end, SDK-ended and UI-ended signals", async () => {
    const { session, recorder, submit } = setup();
    await session.start();
    await Promise.all([session.finish(), session.finish(), session.finish()]);
    await session.finish();
    expect(recorder.stop).toHaveBeenCalledOnce();
    expect(submit).toHaveBeenCalledOnce();
  });
  it("waits for an in-flight capture start before finalizing", async () => {
    const { session, recorder, submit } = setup();
    const starting = deferred<void>();
    recorder.start.mockImplementation(() => starting.promise);
    const begun = session.start();
    const finished = session.finish();
    expect(recorder.stop).not.toHaveBeenCalled();
    starting.resolve();
    await Promise.all([begun, finished]);
    expect(recorder.stop).toHaveBeenCalledOnce();
    expect(submit).toHaveBeenCalledOnce();
  });
  it("retains the same audio on failure and retries only on request", async () => {
    const { session, audio, processing, submit, recorder } = setup();
    await session.start();
    await session.finish();
    processing.reject(new Error("Service unavailable"));
    await vi.waitFor(() => expect(session.state.phase).toBe("error"));
    expect(session.state.audio).toBe(audio);
    await session.finish();
    expect(submit).toHaveBeenCalledTimes(1);
    submit.mockResolvedValue(undefined);
    await Promise.all([session.retry(), session.retry()]);
    expect(submit).toHaveBeenCalledTimes(2);
    expect(submit).toHaveBeenLastCalledWith(audio);
    expect(recorder.start).toHaveBeenCalledOnce();
    expect(session.state.phase).toBe("ready");
  });
  it("does not restart a completed capture or overwrite its summary", async () => {
    const { session, recorder, submit, processing } = setup();
    await session.start();
    await session.finish();
    processing.resolve();
    await vi.waitFor(() => expect(session.state.phase).toBe("ready"));
    await session.start();
    await session.retry();
    expect(recorder.start).toHaveBeenCalledOnce();
    expect(submit).toHaveBeenCalledOnce();
  });
  it("can retry a failed start without ending the call", async () => {
    const { session, recorder, submit } = setup();
    recorder.start.mockRejectedValueOnce(new Error("Audio context paused"));
    await session.start();
    expect(session.canStart).toBe(true);
    expect(session.state.failure).toBe("capture");
    await session.start();
    expect(session.state.phase).toBe("capturing");
    expect(submit).not.toHaveBeenCalled();
  });
  it("never uploads failed capture or a session that was not started", async () => {
    const { session, recorder, submit } = setup();
    await session.start();
    recorder.error = new Error("Audio capture interrupted");
    session.checkCapture();
    await session.finish();
    expect(session.state.failure).toBe("capture");
    expect(submit).not.toHaveBeenCalled();
    const unused = setup();
    await unused.session.finish();
    expect(unused.recorder.start).not.toHaveBeenCalled();
    expect(unused.submit).not.toHaveBeenCalled();
  });
  it("discards recovery audio and ignores completion after unmount", async () => {
    const { session, processing } = setup();
    await session.start();
    await session.finish();
    processing.reject(new Error("offline"));
    await vi.waitFor(() => expect(session.state.phase).toBe("error"));
    session.discard();
    expect(session.state.audio).toBeUndefined();
    const other = setup();
    await other.session.start();
    await other.session.finish();
    other.session.dispose();
    other.onChange.mockClear();
    other.processing.resolve();
    await Promise.resolve();
    expect(other.onChange).not.toHaveBeenCalled();
  });
});
