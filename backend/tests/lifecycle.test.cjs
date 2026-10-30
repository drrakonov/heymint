const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, mocks = {}) {
  const filename = path.resolve(file);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, process, Buffer, console: { log() {}, error() {} }, require(name) {
    if (name in mocks) return mocks[name];
    if (name === '../utils/meetingTrace') return { meetingTrace() {}, traceError() { return {}; } };
    if (name.startsWith('.')) return load(path.resolve(path.dirname(filename), `${name}.ts`), mocks);
    return require(name);
  }});
  return exports;
}
function response() {
  return { statusCode: 200, locals: {}, status(code) { this.statusCode = code; return this; }, json(data) { this.body = data; return this; }, sendStatus(code) { this.statusCode = code; return this; } };
}
const baseMeeting = { id: 'meeting', meetingCode: 'room', createdById: 'host', isScheduled: true, startingTime: new Date('2026-01-01T00:00:00Z'), startedAt: null, isComplete: false, isDeleted: false, isProtected: true };
function controller(meeting = { ...baseMeeting }, call = {}) {
  const writes = [];
  const db = { meeting: { findUnique: async () => meeting, update: async args => { writes.push(args); return meeting; }, updateMany: async args => { writes.push(args); return { count: 1 }; } }, user: { findUnique: async () => ({ name: 'Host' }) } };
  const stream = { video: { call: () => call } };
  const mocks = { '@prisma/client': { PrismaClient: function() { return db; }, Prisma: {} }, '../utils/streamClient': { streamClient: stream } };
  return { handlers: load('src/controllers/meeting.controller.ts', mocks), writes, stream, mocks };
}

test('scheduled expiry is exactly 24 hours and never expires a started or completed meeting', () => {
  const { isMeetingExpired } = load('src/utils/meetingLifecycle.ts');
  const deadline = Date.parse('2026-01-02T00:00:00Z');
  assert.equal(isMeetingExpired(baseMeeting, deadline - 1), false);
  assert.equal(isMeetingExpired(baseMeeting, deadline), true);
  assert.equal(isMeetingExpired({ ...baseMeeting, startedAt: new Date() }, deadline), false);
  assert.equal(isMeetingExpired({ ...baseMeeting, isComplete: true }, deadline), false);
  assert.equal(isMeetingExpired({ ...baseMeeting, isScheduled: false }, deadline), false);
});

test('expired unstarted room returns 410 even when the Stream call was never created', async () => {
  const { handlers } = controller(undefined, { get: async () => { throw { status: 404 }; } });
  const res = response();
  await handlers.validateJoinAccess({ query: { meetingCode: 'room' }, user: { id: 'host' } }, res);
  assert.equal(res.statusCode, 410);
});

test('delayed start webhook does not expire an active call', async () => {
  const { handlers, writes } = controller(undefined, { get: async () => ({ call: { session: { started_at: new Date() } } }) });
  const res = response();
  await handlers.validateJoinAccess({ query: { meetingCode: 'room' }, user: { id: 'host' } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.passwordRequired, false);
  assert.equal(writes.length, 1);
});

test('access check returns password requirement for guests in the same response', async () => {
  const { handlers } = controller({ ...baseMeeting, startingTime: new Date() });
  const res = response();
  await handlers.validateJoinAccess({ query: { meetingCode: 'room' }, user: { id: 'guest' } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.passwordRequired, true);
  assert.equal(res.body.isHost, false);
});

test('end call is host-only and writes complete without deleting history', async () => {
  let ended = 0;
  const { handlers, writes } = controller(undefined, { get: async () => ({ call: {} }), end: async () => { ended++; } });
  const guest = response();
  await handlers.endMeeting({ params: { meetingCode: 'room' }, user: { id: 'guest' } }, guest);
  assert.equal(guest.statusCode, 403);
  assert.equal(ended, 0);
  const host = response();
  await handlers.endMeeting({ params: { meetingCode: 'room' }, user: { id: 'host' } }, host);
  assert.equal(host.statusCode, 200);
  assert.equal(ended, 1);
  assert.equal(writes[0].data.isComplete, true);
  assert.equal(writes[0].data.isDeleted, undefined);
});

test('retry after Stream already ended repairs database completion without ending twice', async () => {
  const { handlers, writes } = controller(undefined, { get: async () => ({ call: { ended_at: new Date() } }), end: async () => { throw new Error('must not end again'); } });
  const res = response();
  await handlers.endMeeting({ params: { meetingCode: 'room' }, user: { id: 'host' } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(writes[0].data.isComplete, true);
});

test('Stream failure never falsely marks the meeting complete', async () => {
  const { handlers, writes } = controller(undefined, { get: async () => ({ call: {} }), end: async () => { throw new Error('network'); } });
  const res = response();
  await handlers.endMeeting({ params: { meetingCode: 'room' }, user: { id: 'host' } }, res);
  assert.equal(res.statusCode, 503);
  assert.equal(writes.length, 0);
});

test('deletion rejects an active meeting', async () => {
  const { handlers, writes } = controller({ ...baseMeeting, startedAt: new Date() });
  const res = response();
  await handlers.deleteMeeting({ body: { meetingCode: 'room' }, user: { id: 'host' } }, res);
  assert.equal(res.statusCode, 409);
  assert.equal(writes.length, 0);
});

for (const stale of [false, true]) test(`session end ${stale ? 'ignores an older session' : 'completes the meeting and stops capture'}`, async () => {
  let stops = 0;
  const { mocks, stream, writes } = controller(undefined, { get: async () => ({ call: { current_session_id: stale ? 'new' : 'session', session: { id: stale ? 'new' : 'session', ended_at: stale ? undefined : new Date() }, egress: { individual_recording: { status: 'active' } }, transcribing: true } }), stopRecording: async () => { stops++; }, stopTranscription: async () => { stops++; } });
  stream.verifyAndParseWebhook = () => ({ type: 'call.session_ended', call_cid: 'default:room', session_id: 'session', call: { type: 'default', id: 'room' } });
  const { handleStreamWebhook } = load('src/controllers/streamWebhook.controller.ts', mocks);
  const res = response();
  await handleStreamWebhook({ headers: { 'x-signature': 'test' }, body: Buffer.from('{}') }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(writes.length, stale ? 0 : 1);
  assert.equal(stops, stale ? 0 : 2);
});

test('cookie options support cross-site HTTPS, local development and matching logout clearing', async t => {
  const previous = { ...process.env };
  t.after(() => { process.env = previous; });
  delete process.env.COOKIE_SECURE;
  delete process.env.NODE_ENV;
  process.env.BACKEND_URL = 'http://localhost:3000';
  const mocks = { '@prisma/client': { PrismaClient: function() { return { refreshToken: { deleteMany: async () => {} } }; } }, '../utils/email': { sendOtpEmail() {} } };
  const { refreshCookieOptions, logout } = load('src/controllers/auth.controller.ts', mocks);
  assert.equal(refreshCookieOptions().sameSite, 'lax');
  assert.equal(refreshCookieOptions().secure, false);
  process.env.BACKEND_URL = 'https://api.example.test';
  assert.equal(refreshCookieOptions().sameSite, 'none');
  assert.equal(refreshCookieOptions().secure, true);
  assert.equal(refreshCookieOptions().domain, undefined);
  const res = response();
  res.clearCookie = (_, options) => { assert.equal(options.sameSite, 'none'); assert.equal(options.path, '/'); assert.equal(options.secure, true); };
  await logout({ cookies: {} }, res);
  assert.equal(res.statusCode, 200);
});
