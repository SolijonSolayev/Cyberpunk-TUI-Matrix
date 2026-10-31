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

test('Gemini receives bounded conversation history and current game context', async () => {
  const result = await generateOracle('Ismim nima?', {
    apiKey: 'test-only',
    history: [{role: 'user', text: 'Men Neo'}, {role: 'model', text: 'Salom, Neo'}],
    context: {handle: 'CYBER_GHOST', level: 2, credits: 600, reputation: 25, ignoredField: 'not-sent'},
    fetchImpl: async (_url, options) => {
      const body = JSON.parse(options.body);
      assert.deepEqual(body.contents.map(message => message.role), ['user', 'model', 'user']);
      assert.equal(body.contents[0].parts[0].text, 'Men Neo');
      assert.equal(body.contents[2].parts[0].text, 'Ismim nima?');
      assert.match(body.systemInstruction.parts[0].text, /CYBER_GHOST/);
      assert.match(body.systemInstruction.parts[0].text, /"credits":600/);
      assert.doesNotMatch(JSON.stringify(body), /not-sent/);
      return {ok: true, json: async () => ({candidates: [{content: {parts: [{text: 'Neo'}]}}]})};
    }
  });
  assert.equal(result.body.text, 'Neo');
});
test('invalid or oversized history and invalid context never reach Gemini', async () => {
  const cases = [
    {history: {}}, {history: [null, null]},
    {history: [{role: 'user', text: 'unfinished pair'}]},
    {history: [{role: 'model', text: 'wrong order'}, {role: 'user', text: 'wrong order'}]},
    {history: [{role: 'user', text: 'x'.repeat(2001)}, {role: 'model', text: 'answer'}]},
    {history: Array.from({length: 10}, (_, i) => ({role: i % 2 ? 'model' : 'user', text: 'a'}))},
    {context: null}, {context: []}, {context: {credits: -1}}, {context: {level: 'two'}}
  ];
  for (const extra of cases) {
    const result = await generateOracle('Salom', {...extra, apiKey: 'test-only', fetchImpl: () => assert.fail('invalid input reached upstream')});
    assert.equal(result.status, 400);
  }
});
