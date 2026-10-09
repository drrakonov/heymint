const fs = require("node:fs");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const ts = require("typescript");
const source = fs.readFileSync(
  require("node:path").join(__dirname, "../src/lib/meeting-recorder.ts"),
  "utf8",
);
class Track {
  constructor(id) {
    this.id = id;
    this.readyState = "live";
    this.stops = 0;
  }
  stop() {
    this.stops++;
    this.readyState = "ended";
  }
}
class Stream extends EventTarget {
  constructor(tracks) {
    super();
    this.tracks = tracks;
  }
  getAudioTracks() {
    return this.tracks;
  }
  getTracks() {
    return this.tracks;
  }
}
class Context {
  static instances = [];
  constructor() {
    this.state = "suspended";
    this.nodes = [];
    Context.instances.push(this);
  }
  createMediaStreamDestination() {
    this.destination = { stream: new Stream([new Track("output")]) };
    return this.destination;
  }
  async resume() {
    this.state = "running";
  }
  createMediaStreamSource(stream) {
    const node = {
      stream,
      connected: false,
      connect() {
        this.connected = true;
      },
      disconnect() {
        this.connected = false;
      },
    };
    this.nodes.push(node);
    return node;
  }
  async close() {
    this.state = "closed";
  }
}
class Recorder {
  static supported = true;
  static instances = [];
  static isTypeSupported() {
    return this.supported;
  }
  constructor(stream, opts) {
    this.stream = stream;
    this.mimeType = opts.mimeType;
    this.state = "inactive";
    Recorder.instances.push(this);
  }
  start() {
    this.state = "recording";
  }
  stop() {
    this.state = "inactive";
    queueMicrotask(() => {
      this.ondataavailable?.({ data: new Blob(["final audio"]) });
      this.onstop?.();
    });
  }
}
function observable() {
  const listeners = new Set();
  return {
    subscribe(next) {
      listeners.add(next);
      next();
      return {
        unsubscribe() {
          listeners.delete(next);
        },
      };
    },
    emit() {
      for (const fn of [...listeners]) fn();
    },
    get count() {
      return listeners.size;
    },
  };
}
function device(track) {
  return {
    mediaStream: new Stream([track]),
    status: "enabled",
    optimisticStatus: "enabled",
    audioEnabled: true,
    mediaStream$: observable(),
    status$: observable(),
    optimisticStatus$: observable(),
    audioEnabled$: observable(),
  };
}
function makeCall() {
  const localTrack = new Track("local");
  const remoteTrack = new Track("remote");
  const screenTrack = new Track("screen");
  const local = {
    sessionId: "1",
    isLocalParticipant: true,
    audio: true,
    screen: true,
  };
  const remote = {
    sessionId: "2",
    audio: true,
    audioStream: new Stream([remoteTrack]),
  };
  return {
    state: {
      callingState: "joined",
      localParticipant: local,
      participants: [local, remote],
      participants$: observable(),
      callingState$: observable(),
    },
    microphone: { state: device(localTrack) },
    screenShare: { state: device(screenTrack) },
    tracks: [localTrack, remoteTrack, screenTrack],
  };
}
const sandbox = {
  exports: {},
  require: () => ({
    CallingState: { JOINED: "joined" },
    hasAudio: (p) => p.audio,
    hasScreenShareAudio: (p) => p.screen,
  }),
  AudioContext: Context,
  MediaStream: Stream,
  MediaRecorder: Recorder,
  window: { isSecureContext: true },
  Blob,
  setTimeout,
  clearTimeout,
};
vm.runInNewContext(
  ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText,
  sandbox,
);
const { MeetingRecorder } = sandbox.exports;
(async () => {
  const call = makeCall();
  const capture = new MeetingRecorder(call);
  await capture.start();
  const ctx = Context.instances.at(-1);
  const count = () => ctx.nodes.filter((n) => n.connected).length;
  assert.equal(count(), 3, "mix local, remote, and screen audio");
  call.microphone.state.optimisticStatus = "disabled";
  call.microphone.state.optimisticStatus$.emit();
  assert.equal(count(), 2, "disconnect local audio immediately on mute intent");
  call.microphone.state.optimisticStatus = "enabled";
  call.microphone.state.optimisticStatus$.emit();
  assert.equal(count(), 3);
  call.state.participants[1].audio = false;
  call.state.participants$.emit();
  assert.equal(count(), 2, "disconnect unpublished remote audio");
  const replacement = new Track("replacement");
  call.microphone.state.mediaStream = new Stream([replacement]);
  call.microphone.state.mediaStream$.emit();
  assert.equal(count(), 2);
  assert(
    ctx.nodes.some((n) => n.connected && n.stream.tracks[0] === replacement),
    "replace microphone source",
  );
  const blob = await capture.stop();
  assert.equal(
    await blob.text(),
    "final audio",
    "include final MediaRecorder chunk",
  );
  assert.equal(await capture.stop(), blob, "repeat stop returns same result");
  assert.equal(ctx.state, "closed");
  assert.equal(ctx.destination.stream.tracks[0].stops, 1);
  assert(
    call.tracks.every((t) => t.stops === 0),
    "never stop SDK tracks",
  );
  assert.equal(call.state.participants$.count, 0, "unsubscribe");
  const cancelledCall = makeCall();
  const cancelled = new MeetingRecorder(cancelledCall);
  const starting = cancelled.start();
  cancelled.dispose();
  await assert.rejects(starting, /cancelled/);
  assert(cancelledCall.tracks.every((t) => t.stops === 0));
  Recorder.supported = false;
  await assert.rejects(new MeetingRecorder(makeCall()).start(), /WebM/);
  Recorder.supported = true;
  const inactive = makeCall();
  inactive.state.callingState = "idle";
  await assert.rejects(new MeetingRecorder(inactive).start(), /Join/);
  console.log(
    "PASS: mixed capture, muted privacy, remote unpublish, device changes, final chunk, idempotent stop, SDK track ownership, subscriptions, cancelled start, unsupported WebM, joined guard",
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
