import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateOracle} from '../server/oracle.mjs';

test('offline without a key; invalid requests never call upstream', async () => {
  assert.equal((await generateOracle('Salom')).status, 503);
  for (const question of [undefined, null, {}, '', ' ', 'x'.repeat(2001)]) {
    assert.equal((await generateOracle(question, {apiKey: 'test', fetchImpl: () => assert.fail('unexpected fetch')})).status, 400);
  }
});
test('sends the key in a server-side header and parses Gemini text', async () => {
  const result = await generateOracle(' Salom ', {apiKey: 'test-only', fetchImpl: async (url, options) => {
    assert.equal(new URL(url).hostname, 'generativelanguage.googleapis.com');
    assert.equal(options.headers['x-goog-api-key'], 'test-only');
    assert.equal(JSON.parse(options.body).contents[0].parts[0].text, 'Salom');
    assert.ok(options.signal);
    return {ok: true, json: async () => ({candidates: [{content: {parts: [{text: 'Salom, '}, {text: 'agent!'}]}}]})};
  }});
  assert.deepEqual(result, {status: 200, body: {text: 'Salom, agent!'}});
});
test('upstream errors, empty output and timeouts return a safe fallback status', async () => {
  for (const fetchImpl of [
    async () => ({ok: false}), async () => ({ok: true, json: async () => ({})}),
    async () => {throw new Error('sensitive upstream details');}
  ]) {
    const result = await generateOracle('Salom', {apiKey: 'test-only', fetchImpl});
    assert.equal(result.status, 502);
    assert.doesNotMatch(JSON.stringify(result), /test-only|sensitive/);
  }
});
