import {test, expect} from '@playwright/test';

test('audio is opt-in, generates actual oscillators, obeys volume and mutes immediately', async ({page}) => {
  await page.addInitScript(() => {
    const state = {contexts: 0, oscillators: 0, gains: [] as GainNode[]};
    (window as any).__audioTest = state;
    const Original = window.AudioContext;
    window.AudioContext = class extends Original {
      constructor() { super(); state.contexts++; }
      createOscillator() { state.oscillators++; return super.createOscillator(); }
      createGain() { const gain = super.createGain(); state.gains.push(gain); return gain; }
    };
  });
  await page.goto('/');
  const input = page.locator('input');
  const cmd = async (text: string) => {await input.fill(text); await input.press('Enter');};
  const toggle = page.getByRole('button', {name: 'Audio effektlar'});
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await cmd('help');
  expect(await page.evaluate(() => (window as any).__audioTest.contexts)).toBe(0);
  await cmd('sound on');
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => (window as any).__audioTest.contexts)).toBe(1);
  expect(await page.evaluate(() => (window as any).__audioTest.oscillators)).toBeGreaterThan(0);
  await cmd('sound volume 25');
  // AudioParam updates become observable on the next audio rendering quantum.
  await expect.poll(() => page.evaluate(() => (window as any).__audioTest.gains[0].gain.value)).toBeCloseTo(0.25);
  await cmd('sound volume 101');
  await expect.poll(() => page.evaluate(() => (window as any).__audioTest.gains[0].gain.value)).toBeCloseTo(0.25);
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(() => page.evaluate(() => (window as any).__audioTest.gains[0].gain.value)).toBe(0);
  const count = await page.evaluate(() => (window as any).__audioTest.oscillators);
  await cmd('scan');
  await expect(page.getByText('Mavjud nishonlar:', {exact: false})).toBeVisible();
  expect(await page.evaluate(() => (window as any).__audioTest.oscillators)).toBe(count);
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => (window as any).__audioTest.contexts)).toBe(1);
  await page.reload();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  expect(await page.evaluate(() => (window as any).__audioTest.contexts)).toBe(0);
});
test('unsupported audio remains muted without breaking commands', async ({page}) => {
  await page.addInitScript(() => {
    window.AudioContext = class { constructor() { throw Error('Audio unavailable'); } } as any;
  });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', {name: 'Audio effektlar'}).click();
  await expect(page.getByText('Brauzer audio chiqishini ocholmadi.', {exact: false})).toBeVisible();
  await expect(page.getByRole('button', {name: 'Audio effektlar'})).toHaveAttribute('aria-pressed', 'false');
  await page.locator('input').fill('whoami'); await page.locator('input').press('Enter');
  await expect(page.getByText('Agent: @CYBER_GHOST', {exact: false})).toBeVisible();
  expect(errors).toEqual([]);
});
