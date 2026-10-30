const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function context(type = 'reload') {
  const data = new Map();
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync('src/lib/meetingResume.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, performance: { getEntriesByType: () => [{ type }] }, sessionStorage: { getItem: k => data.get(k), setItem: (k,v) => data.set(k,v), removeItem: k => data.delete(k) } });
  return { ...exports, data };
}
test('reload preserves mute, camera and selected microphone for the same user and room', () => {
  const c = context(); c.saveMeetingResume('user', 'room', { micEnabled: true, cameraEnabled: false, micDevice: 'buds' });
  const saved = c.readMeetingResume('user', 'room');
  assert.equal(saved.micEnabled, true); assert.equal(saved.cameraEnabled, false); assert.equal(saved.micDevice, 'buds');
  assert.equal(c.readMeetingResume('another', 'room'), null);
  assert.equal(c.readMeetingResume('user', 'another'), null);
});
test('normal navigation does not automatically join or activate devices', () => {
  const c = context('navigate'); c.saveMeetingResume('user', 'room', { micEnabled: true, cameraEnabled: true });
  assert.equal(c.readMeetingResume('user', 'room'), null);
});
test('leaving clears resume; expired and corrupt entries cannot enable devices', () => {
  const c = context(); c.saveMeetingResume('user', 'room', { micEnabled: false, cameraEnabled: false });
  c.clearMeetingResume('user', 'room'); assert.equal(c.readMeetingResume('user', 'room'), null);
  c.data.set('meeting-resume:user:room', JSON.stringify({ at: Date.now() - 121000, micEnabled: true, cameraEnabled: true }));
  assert.equal(c.readMeetingResume('user', 'room'), null);
  c.data.set('meeting-resume:user:room', 'invalid'); assert.equal(c.readMeetingResume('user', 'room'), null);
});
