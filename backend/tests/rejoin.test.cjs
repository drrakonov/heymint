const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, mocks = {}, globals = {}) {
  const filename = path.resolve(file);
  const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(output, { module, exports: module.exports, process, Buffer, setTimeout, clearTimeout, AbortController, ...globals, require(name) {
    if (name in mocks) return mocks[name];
    if (name === 'dotenv') return { config() {} };
    if (name === '../utils/meetingTrace') return { meetingTrace() {}, traceError() {} };
    if (name.startsWith('.')) return load(path.resolve(path.dirname(filename), name + '.ts'), mocks, globals);
    return require(name);
  }});
  return module.exports;
}
const active = { current_session_id: 'session', session: {}, egress: { individual_recording: { status: 'active' } }, transcribing: true };
function capture(call) { call.update ||= async () => {}; return load('src/services/meetingCapture.service.ts', { '../utils/streamClient': { streamClient: { video: { call: () => call } } } }).ensureMeetingCapture; }

test('rejoining an active recording does not restart or reconfigure capture', async () => {
  await capture({ get: async () => ({ call: active }), update() { assert.fail('must not reconfigure'); }, startRecording() { assert.fail('already recording'); }, startTranscription() { assert.fail('already transcribing'); } })('room');
});
test('overlapping starts share one operation', async () => {
  let recordings = 0, transcripts = 0;
  const ensure = capture({ get: async () => ({ call: { ...active, egress: {}, transcribing: false } }), startRecording: async () => recordings++, startTranscription: async () => transcripts++ });
  await Promise.all([ensure('room'), ensure('room')]);
  assert.equal(recordings, 1); assert.equal(transcripts, 1);
});
test('transcription failure does not stop healthy audio recording', async () => {
  let recordings = 0;
  const state = { ...active, egress: {}, transcribing: false };
  const ensure = capture({ get: async () => ({ call: state }), startRecording: async () => { recordings++; }, startTranscription: async () => { throw new Error('provider failure'); }, stopRecording() { assert.fail('must preserve audio'); } });
  await assert.rejects(ensure('room'), /provider failure/); assert.equal(recordings, 1);
});
test('already-running conflict from another server is accepted after checking provider state', async () => {
  let reads = 0;
  const ensure = capture({ get: async () => ({ call: ++reads === 1 ? { ...active, egress: {} } : active }), startRecording: async () => { throw new Error('already running'); } });
  await ensure('room'); assert.equal(reads, 2);
});
test('ended session cannot start recording', async () => {
  await assert.rejects(capture({ get: async () => ({ call: { ...active, ended_at: new Date() } }) })('room'), /not active/);
});

test('silence is empty; malformed JSON and invalid speech timestamps are errors', () => {
  const { parseStreamSpeech } = load('src/utils/parseStreamTranscript.ts');
  assert.equal(parseStreamSpeech(' \n', 0).length, 0);
  assert.equal(parseStreamSpeech('{"type":"metadata"}\n{"type":"speech","text":" "}', 0).length, 0);
  assert.throws(() => parseStreamSpeech('<html>error</html>', 0), /invalid JSON/);
  assert.throws(() => parseStreamSpeech('{"type":"speech","text":"hello"}', 0), /invalid timestamps/);
  const lines = ['{"type":"speech","text":"later","speaker_id":"same-user","start_ts":2000,"stop_ts":2500}', '{"type":"speech","text":"first","speaker_id":"same-user","start_ts":0,"stop_ts":1000}'];
  const speech = parseStreamSpeech(lines.join('\n'), 0);
  assert.equal(speech[0].text, 'first'); assert.equal(speech[1].speaker_id, 'same-user');
});
test('silent job completes without LLM requests or deleting earlier meeting data', async () => {
  const writes = [];
  const db = { meeting: { findUnique: async () => ({ startingTime: new Date() }) }, transcriptionJob: { updateMany: async args => { writes.push(args); return { count: 1 }; } }, $transaction() { assert.fail('must not delete transcripts or summaries'); } };
  const { processJob } = load('src/workers/transcription.worker.ts', {
    '@prisma/client': { PrismaClient: function() { return db; } },
    '../services/meetingSummary.service': { generateAndStoreMeetingSummary() { assert.fail('must not invoke AI for silence'); } },
  }, { fetch: async () => ({ ok: true, text: async () => '' }) });
  await processJob({ id: 'empty-job', meetingId: 'meeting', sessionId: 'session', transcriptionUrl: 'https://example.test', attempts: 1, leaseToken: 'lease' });
  assert.equal(writes.at(-1).data.status, 'COMPLETED');
  assert.equal(writes.at(-1).data.leaseToken, null);
});

function res() { return { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(data) { this.body = data; return this; } }; }
async function summary(data) {
  const { getMeetingSummary } = load('src/controllers/summarizer.controller.ts', {
    '@prisma/client': { PrismaClient: function() { return { meeting: { findUnique: async () => data } }; } },
    '../services/meetingInsightAccess.service': { getMeetingInsightAccess: async () => ({ canAccess: true, meeting: { id: 'meeting' } }) },
  });
  const response = res(); await getMeetingSummary({ params: { id: 'room' }, user: { id: 'user' } }, response); return response;
}
test('all-silent jobs return a terminal no_speech state', async () => {
  const response = await summary({ summary: null, transcriptionJobs: [{ status: 'COMPLETED', attempts: 1 }] });
  assert.equal(response.statusCode, 200); assert.equal(response.body.status, 'no_speech');
});
test('an empty or failed rejoin does not hide an existing summary', async () => {
  const response = await summary({ summary: { content: 'Earlier summary' }, transcriptionJobs: [{ status: 'COMPLETED', attempts: 1 }, { status: 'FAILED', attempts: 5 }] });
  assert.equal(response.body.success, true); assert.equal(response.body.summary, 'Earlier summary');
});
test('a silent completed job cannot hide another pending job', async () => {
  const response = await summary({ summary: null, transcriptionJobs: [{ status: 'COMPLETED', attempts: 1 }, { status: 'PENDING', attempts: 0 }] });
  assert.equal(response.statusCode, 202);
});

for (const eventType of ['call.transcription_ready', 'call.transcription_failed']) test(`${eventType} respects ready/failed event ordering`, async () => {
  class Conflict extends Error { constructor() { super('duplicate'); this.code = 'P2002'; } }
  const writes = [];
  const db = { meeting: { findUnique: async () => ({ id: 'meeting' }) }, transcriptionJob: {
    create: async () => { throw new Conflict(); },
    updateMany: async args => { writes.push(args); return { count: 1 }; },
  }};
  const event = { type: eventType, call_cid: 'default:room', egress_id: 'egress', error: 'provider error', call_transcription: { session_id: 'session', url: 'https://example.test/transcript', filename: 'transcript.jsonl' } };
  const { handleStreamWebhook } = load('src/controllers/streamWebhook.controller.ts', {
    '@prisma/client': { PrismaClient: function() { return db; }, Prisma: { PrismaClientKnownRequestError: Conflict } },
    '../utils/streamClient': { streamClient: { verifyAndParseWebhook: () => event } },
  });
  const response = { locals: {}, statusCode: 200, sendStatus(code) { this.statusCode = code; return this; } };
  await handleStreamWebhook({ headers: { 'x-signature': 'test' }, body: Buffer.from('{}') }, response);
  assert.equal(response.statusCode, 200);
  assert.deepEqual(Array.from(writes[0].where.status.in), ['WAITING', 'FAILED']);
  if (eventType === 'call.transcription_ready') assert.equal(writes[0].data.attempts, 0);
});

for (const attended of [true, false]) test(`protected resume ${attended ? 'accepts a verified past attendee' : 'still requires a password for non-attendees'}`, async () => {
  const { validateJoinAccess } = load('src/controllers/meeting.controller.ts', {
    '@prisma/client': { PrismaClient: function() { return {
      meeting: { findUnique: async () => ({ id: 'meeting', isProtected: true, createdById: 'host', isScheduled: false }) },
      meetingParticipant: { findUnique: async ({ where }) => {
        assert.equal(where.meetingId_userId.userId, 'guest'); return attended ? { id: 'attendance' } : null;
      } },
    }; } },
    '../utils/streamClient': { streamClient: {} },
  });
  const response = res();
  await validateJoinAccess({ user: { id: 'guest' }, query: { meetingCode: 'room', resume: '1' } }, response);
  assert.equal(response.statusCode, 200); assert.equal(response.body.passwordRequired, !attended);
});
