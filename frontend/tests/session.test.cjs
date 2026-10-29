const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const axios = require('axios');

function session(adapter) {
  const state = { accessToken: 'old', setAccessToken(token) { this.accessToken = token; } };
  const source = fs.readFileSync('src/lib/axios.ts', 'utf8').replace('import.meta.env.VITE_BACKEND_URL', '"https://api.example.test"');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require(name) {
    if (name === 'axios') return { ...axios, create: options => axios.create({ ...options, adapter }) };
    if (name === '@/store/authStore') return { useAuthStore: { getState: () => state } };
    throw new Error(`Unexpected import ${name}`);
  }});
  return { api: exports.default, refresh: exports.refreshAccessToken, state };
}
const ok = (config, data) => ({ config, status: 200, statusText: 'OK', headers: {}, data });
const reject = (config, status = 401) => Promise.reject(new axios.AxiosError('Rejected', 'ERR_BAD_REQUEST', config, null, { config, status, data: {}, headers: {} }));
const delay = () => new Promise(resolve => setTimeout(resolve, 10));

test('concurrent expired requests share one refresh and both retry with the new token', async () => {
  let refreshes = 0;
  const { api, state } = session(async config => {
    if (config.url === '/api/auth/refresh') { refreshes++; await delay(); return ok(config, { accessToken: 'new' }); }
    if (config.headers.Authorization === 'Bearer old') return reject(config);
    return ok(config, config.headers.Authorization);
  });
  const responses = await Promise.all([api.get('/one'), api.get('/two')]);
  assert.equal(refreshes, 1);
  assert.equal(state.accessToken, 'new');
  assert.deepEqual(responses.map(r => r.data), ['Bearer new', 'Bearer new']);
});

test('failed refresh rejects every waiter instead of recursively waiting forever', { timeout: 1000 }, async () => {
  let refreshes = 0;
  const { api, state } = session(async config => {
    if (config.url === '/api/auth/refresh') { refreshes++; await delay(); }
    return reject(config);
  });
  const results = await Promise.allSettled([api.get('/one'), api.get('/two')]);
  assert.ok(results.every(r => r.status === 'rejected'));
  assert.equal(refreshes, 1);
  assert.equal(state.accessToken, null);
});

test('wrong login and room passwords never rotate the session', async () => {
  let refreshes = 0;
  const { api, state } = session(config => { if (config.url === '/api/auth/refresh') refreshes++; return reject(config, config.url.includes('get-meeting-validation') ? 403 : 401); });
  await assert.rejects(api.post('/api/auth/login'));
  await assert.rejects(api.post('/api/meeting/get-meeting-validation'));
  assert.equal(refreshes, 0);
  assert.equal(state.accessToken, 'old');
});

test('a network failure keeps the session and a later retry can recover', async () => {
  let refreshes = 0;
  const { api, state } = session(async config => {
    if (config.url === '/api/auth/refresh') {
      if (++refreshes === 1) throw new axios.AxiosError('Network Error', 'ERR_NETWORK', config);
      return ok(config, { accessToken: 'new' });
    }
    return config.headers.Authorization === 'Bearer old' ? reject(config) : ok(config, 'recovered');
  });
  await assert.rejects(api.get('/one'));
  assert.equal(state.accessToken, 'old');
  assert.equal((await api.get('/one')).data, 'recovered');
});

test('an in-flight refresh cannot sign a user back in after logout', async () => {
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const { refresh, state } = session(async config => { await gate; return ok(config, { accessToken: 'new' }); });
  const operation = refresh();
  state.setAccessToken(null);
  release();
  await assert.rejects(operation, /Session changed/);
  assert.equal(state.accessToken, null);
});

test('requests have credentials and a finite timeout', async () => {
  const { api } = session(config => {
    assert.equal(config.withCredentials, true);
    assert.equal(config.timeout, 15000);
    return Promise.resolve(ok(config, {}));
  });
  await api.get('/one');
});
