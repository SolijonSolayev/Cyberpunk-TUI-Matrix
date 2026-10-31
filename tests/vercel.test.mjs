import {test} from 'node:test';
import assert from 'node:assert/strict';
import oracle, {createOracleHandler} from '../api/oracle.js';
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

test('BotID blocks bots before calling Gemini', async () => {
  const handler = createOracleHandler({
    verify: async () => ({isBot: true, isHuman: false}),
    generate: () => assert.fail('Blocked requests must not call Gemini')
  });
  const res = response();
  await handler({method: 'POST', body: {question: 'Salom'}}, res);
  assert.equal(res.code, 403);
});
test('BotID permits verified humans and uses Basic protection', async () => {
  const handler = createOracleHandler({
    verify: async options => {
      assert.equal(options.advancedOptions.checkLevel, 'basic');
      return {isBot: false, isHuman: true};
    },
    generate: async question => {
      assert.equal(question, 'Salom');
      return {status: 200, body: {text: 'Salom, agent!'}};
    }
  });
  const res = response();
  await handler({method: 'POST', body: {question: 'Salom'}}, res);
  assert.equal(res.code, 200);
  assert.equal(res.body.text, 'Salom, agent!');
});
test('BotID errors and unknown verdicts fail closed without calling Gemini', async () => {
  for (const verify of [async () => {throw new Error('private SDK error');}, async () => ({})]) {
    const handler = createOracleHandler({verify, generate: () => assert.fail('Unverified request reached Gemini')});
    const res = response();
    await handler({method: 'POST', body: {question: 'Salom'}}, res);
    assert.equal(res.code, 503);
    assert.doesNotMatch(JSON.stringify(res.body), /private SDK error/);
  }
});
test('Vercel requests cannot use the development bypass', async () => {
  const previous = process.env.VERCEL;
  process.env.VERCEL = '1';
  try {
    const handler = createOracleHandler({
      verify: async options => {
        assert.equal(options.developmentOptions.isDevelopment, false);
        return {isBot: true, isHuman: false};
      },
      generate: () => assert.fail('Unexpected Gemini request')
    });
    await handler({method: 'POST'}, response());
  } finally {
    if (previous === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = previous;
  }
});
