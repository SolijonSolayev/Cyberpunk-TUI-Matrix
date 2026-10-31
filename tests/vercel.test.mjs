import {test} from 'node:test';
import assert from 'node:assert/strict';
import oracle from '../api/oracle.js';
import health from '../api/health.js';

function response() {
  return {headers: {}, code: null, body: null,
    setHeader(key, value) {this.headers[key] = value;},
    status(code) {this.code = code; return this;},
    json(body) {this.body = body; return this;}};
}
test('Vercel Oracle rejects unsupported methods without making a request', async () => {
  const res = response();
  await oracle({method: 'GET'}, res);
  assert.equal(res.code, 405);
  assert.equal(res.headers.Allow, 'POST');
});
test('Vercel Oracle validates questions; health reports current configuration', async () => {
  const res = response();
  await oracle({method: 'POST', body: {question: ''}}, res);
  assert.equal(res.code, 400);
  const status = response();
  health({}, status);
  assert.equal(status.code, 200);
  assert.deepEqual(status.body, {ok: true, oracle: process.env.GEMINI_API_KEY ? 'configured' : 'offline'});
  assert.equal(status.headers['Cache-Control'], 'no-store');
});
test('Vercel Oracle returns offline status when no key is configured', {skip: !!process.env.GEMINI_API_KEY}, async () => {
  const res = response();
  await oracle({method: 'POST', body: {question: 'Salom'}}, res);
  assert.equal(res.code, 503);
});
