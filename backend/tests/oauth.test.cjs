const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const ts = require('typescript');
const crypto = require('node:crypto');

test('Google handoff works without cookies, rejects a different browser and cannot be replayed', async () => {
  const rows = new Map();
  const tokens = {
    async create({ data }) { rows.set(data.token, { id: data.token, ...data }); },
    async findUnique({ where }) { return rows.get(where.token); },
    async deleteMany({ where }) { return { count: rows.delete(where.id) ? 1 : 0 }; },
  };
  const db = { refreshToken: tokens, $transaction: fn => fn({ refreshToken: tokens }) };
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync('src/controllers/oauth.controller.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, process: { env: { CORS_ORIGIN: 'https://frontend.test' } }, Buffer, require(name) {
    if (name === 'crypto') return crypto;
    if (name === '@prisma/client') return { PrismaClient: function() { return db; } };
    if (name === '../utils/jwt') return { generateAccessToken: () => 'access', generateRefreshToken: () => 'refresh' };
    if (name === './auth.controller') return { setRefreshToken: (res, token) => { res.cookie = token; } };
    throw new Error(name);
  }});
  const response = () => ({ statusCode: 200, setHeader() {}, status(n) { this.statusCode = n; return this; }, json(data) { this.body = data; return this; }, redirect(url) { this.url = url; } });
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
  const callback = response();
  await exports.completeGoogleLogin({ query: { state: challenge }, user: { id: 'user' } }, callback);
  const handoff = new URLSearchParams(new URL(callback.url).hash.slice(1)).get('code');
  assert.ok(handoff);
  assert.ok(!callback.url.includes('access'));
  const wrong = response();
  await exports.exchangeGoogleCode({ body: { code: handoff, verifier: crypto.randomBytes(32).toString('base64url') } }, wrong);
  assert.equal(wrong.statusCode, 401);
  const valid = response();
  await exports.exchangeGoogleCode({ body: { code: handoff, verifier } }, valid);
  assert.equal(valid.body.accessToken, 'access');
  assert.equal(valid.cookie, 'refresh');
  const replay = response();
  await exports.exchangeGoogleCode({ body: { code: handoff, verifier } }, replay);
  assert.equal(replay.statusCode, 401);
});
