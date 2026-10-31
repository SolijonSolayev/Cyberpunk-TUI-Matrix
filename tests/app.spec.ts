import {test, expect} from '@playwright/test';
import JSZip from 'jszip';
import fs from 'node:fs/promises';

// Exercise the installed SDK without contacting the live challenge service.
// Real bot classification requires a deployed Vercel request context.
test.beforeEach(async ({page}) => {
  await page.route('**/149e9513-01fa-4fb0-aad4-566afd725d1b/**', route => route.fulfill({
    contentType: 'application/javascript',
    body: 'window.V_C.push({b:0,v:"test-challenge",e:"test-only",d:0});'
  }));
});

test('terminal commands, hack reward, upgrade and matrix toggle', async ({page}) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  const cmd = async (text: string) => {await page.locator('input').fill(text); await page.locator('input').press('Enter');};
  await cmd('help'); await expect(page.getByText('Mavjud buyruqlar:', {exact: false})).toBeVisible();
  await cmd('scan'); await expect(page.getByText('Mavjud nishonlar:', {exact: false})).toBeVisible();
  await cmd('hack 192.168.4.102');
  for (const name of ['0xAA','0x1F','0x7C']) await page.getByRole('button', {name, exact: true}).click();
  await expect(page.getByText('Sizga +250', {exact: false})).toBeVisible();
  await cmd('status'); await expect(page.getByText("Mablag': 600", {exact: false})).toBeVisible();
  await cmd('upgrade'); await cmd('status');
  await expect(page.getByText('96 MB / 192 MB', {exact: false})).toBeVisible();
  await cmd('matrix'); await expect(page.locator('canvas[data-matrix-rain]')).toHaveCount(0);
  await cmd('matrix'); await expect(page.locator('canvas[data-matrix-rain]')).toHaveCount(1);
  await cmd('cool'); await expect(page.getByText('CPU harorati normallashdi.', {exact: false})).toBeVisible();
  expect(errors).toEqual([]);
});
test('Velaris background is decorative and does not block terminal controls', async ({page}) => {
  await page.goto('/');
  const velaris = page.locator('canvas[data-velaris]');
  await expect(velaris).toHaveCount(1);
  await expect(velaris).toHaveAttribute('aria-hidden', 'true');
  await expect(velaris).toHaveCSS('pointer-events', 'none');
  await expect(page.getByLabel('Terminal buyrug‘i')).toBeEditable();
});
test('Oracle offline and successful API response are both handled', async ({page}) => {
  await page.goto('/');
  const cmd = async (text: string) => {await page.locator('input').fill(text); await page.locator('input').press('Enter');};
  await cmd('oracle salom');
  await expect(page.getByText('[KESH-JAVOB]', {exact: false})).toBeVisible();
  await page.route('**/api/oracle', route => route.fulfill({json: {text: 'Salom, agent!'}}));
  await cmd('oracle salom');
  await expect(page.getByText('[AI_ORACLE]: Salom, agent!', {exact: false})).toBeVisible();
});
test('grid movement and exit', async ({page}) => {
  await page.goto('/');
  // Keep the first move clear of randomly generated entities.
  await page.evaluate(() => {Math.random = () => 0.9;});
  await page.getByRole('button', {name: '$ grid', exact: true}).click();
  await expect(page.getByText('QADAMLAR: 100')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByText('QADAMLAR: 99')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByText('ROGUELIKE GRID PROTOCOL [LEVEL 1]')).toHaveCount(0);
});
test('downloaded ZIP contains a runnable project, not placeholders or secrets', async ({page}) => {
  await page.goto('/');
  await page.getByRole('button', {name: 'KODNI YUKLAB OLISH', exact: false}).click();
  await expect(page.locator('pre code')).toContainText('export default function App()');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', {name: 'Barchasini ZIP', exact: false}).click();
  const download = await downloadPromise;
  const zip = await JSZip.loadAsync(await fs.readFile((await download.path())!));
  for (const file of ['package.json','package-lock.json','App.tsx','server.mjs','components/ui/velaris.tsx','scripts/source-archive.ts','tests/app.spec.ts']) {
    expect(zip.file(file), file).not.toBeNull();
  }
  expect(await zip.file('App.tsx')!.async('string')).toContain('export default function App()');
  expect(zip.file('.env')).toBeNull();
  expect(Object.keys(zip.files).some(file => file.startsWith('node_modules/'))).toBe(false);
  const singlePromise = page.waitForEvent('download');
  await page.getByRole('button', {name: 'Ushbu faylni yuklash', exact: false}).click();
  expect((await singlePromise).suggestedFilename()).toBe('App.tsx');
});

test('BotID attaches challenge headers on Vercel builds and blocked requests use offline fallback', async ({page}) => {
  let headers: Record<string, string> = {};
  await page.route('**/api/oracle', route => {
    headers = route.request().headers();
    return route.fulfill({status: 403, json: {error: 'Avtomatik so‘rov bloklandi.'}});
  });
  await page.goto('/');
  await page.locator('input').fill('oracle salom');
  await page.locator('input').press('Enter');
  await expect(page.getByText('[KESH-JAVOB]', {exact: false})).toBeVisible();
  if (process.env.VERCEL === '1') {
    expect(JSON.parse(headers['x-is-human']).v).toBe('test-challenge');
    expect(headers['x-path']).toBe('/api/oracle');
    expect(headers['x-method']).toBe('POST');
  } else {
    expect(headers['x-is-human']).toBeUndefined();
  }
});

test('CRT terminal supports command history and reports consistent telemetry and level gains', async ({page}) => {
  await page.goto('/');
  const input = page.getByRole('textbox', {name: 'Terminal buyrug‘i'});
  const cmd = async (text: string) => {await input.fill(text); await input.press('Enter');};
  await expect(page.getByText('root@cyberdeck:~$', {exact: true})).toBeVisible();
  await expect(page.locator('canvas[data-matrix-rain]')).toBeVisible();
  expect(await page.locator('.crt-terminal').evaluate(el => getComputedStyle(el, '::after').pointerEvents)).toBe('none');
  await cmd('status'); await cmd('help');
  await input.fill('draft');
  await input.press('ArrowUp'); await expect(input).toHaveValue('help');
  await input.press('ArrowUp'); await expect(input).toHaveValue('status');
  await input.press('ArrowDown'); await input.press('ArrowDown'); await expect(input).toHaveValue('draft');
  await cmd('hack 192.168.4.102');
  for (const name of ['0xAA','0x1F','0x7C']) await page.getByRole('button', {name, exact: true}).click();
  await expect(page.getByText('Sizga +250', {exact: false})).toBeVisible();
  await cmd('cool'); await cmd('status');
  const status = page.getByText('[KIBER-DECK STATUSI]', {exact: false}).last();
  await expect(status).toContainText('Daraja: 2');
  await expect(status).toContainText('Reputatsiya darajasi: 25 / 100');
  await expect(status).toContainText('CPU harorati: 25°C');
  await cmd('hack 192.168.4.102');
  await expect(page.getByText('allaqachon buzilgan', {exact: false})).toBeVisible();
  await cmd('upgrade'); await cmd('status');
  await expect(page.getByText('[KIBER-DECK STATUSI]', {exact: false}).last()).toContainText('Daraja: 3');
});
test('Oracle sends successful conversation history and current game context', async ({page}) => {
  const payloads: {question: string; history: {role: string; text: string}[]; context: {handle: string; credits: number}}[] = [];
  await page.route('**/api/oracle', route => {
    payloads.push(route.request().postDataJSON());
    return route.fulfill({json: {text: payloads.length === 1 ? 'Salom, agent!' : 'Oldingi savolingizni eslayman.'}});
  });
  await page.goto('/');
  const input = page.locator('input');
  await input.fill('oracle mening ismim Neo'); await input.press('Enter');
  await expect(page.getByText('[AI_ORACLE]: Salom, agent!', {exact: false})).toBeVisible();
  await input.fill('oracle ismim nima?'); await input.press('Enter');
  await expect(page.getByText('Oldingi savolingizni eslayman.', {exact: false})).toBeVisible();
  expect(payloads[0].history).toEqual([]);
  expect(payloads[1].history).toEqual([{role:'user',text:'mening ismim Neo'}, {role:'model',text:'Salom, agent!'}]);
  expect(payloads[1].context.handle).toBe('CYBER_GHOST');
  expect(payloads[1].context.credits).toBe(350);
});
test('keyboard grid controls respect walls and restore the terminal after exit', async ({page}) => {
  await page.goto('/');
  const input = page.locator('input');
  await input.fill('grid'); await input.press('Enter');
  await expect(input).toBeDisabled();
  const grid = page.getByRole('region', {name: 'Kiber-labirint'});
  await expect(grid.locator('[data-grid-row="2"]')).toContainText('#');
  await page.keyboard.press('KeyD'); await page.keyboard.press('KeyD');
  await expect(page.getByText('QADAMLAR: 98')).toBeVisible();
  await page.keyboard.press('KeyD');
  await expect(page.getByText('QADAMLAR: 98')).toBeVisible();
  await expect(page.getByText('Bu yo‘l devor bilan', {exact: false})).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(input).toBeEnabled();
  await expect(input).toBeFocused();
});

test('resetting a pending failed HEX puzzle cancels its old failure callback', async ({page}) => {
  await page.goto('/');
  await page.locator('input').fill('hack 192.168.4.102'); await page.locator('input').press('Enter');
  for (let i = 0; i < 3; i++) await page.getByRole('button', {name: '0xAA', exact: true}).click();
  await expect(page.getByText('Shifr mos kelmadi.', {exact: false})).toBeVisible();
  await page.getByRole('button', {name: 'Tozalash', exact: true}).click();
  for (const name of ['0xAA','0x1F','0x7C']) await page.getByRole('button', {name, exact: true}).click();
  await expect(page.getByText('Sizga +250', {exact: false})).toBeVisible();
  // The old 1200ms failure must not fire after the new 900ms success.
  await page.waitForTimeout(500);
  await expect(page.getByText('XAK MAG', {exact: false})).toHaveCount(0);
});
