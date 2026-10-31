import {test, expect} from '@playwright/test';
import JSZip from 'jszip';
import fs from 'node:fs/promises';

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
  await cmd('matrix'); await expect(page.locator('canvas')).toHaveCount(0);
  await cmd('matrix'); await expect(page.locator('canvas')).toHaveCount(1);
  await cmd('cool'); await expect(page.getByText('CPU harorati normallashdi.', {exact: false})).toBeVisible();
  expect(errors).toEqual([]);
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
  await expect(page.getByText('QADAMLAR: 45')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByText('QADAMLAR: 44')).toBeVisible();
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
  for (const file of ['package.json','package-lock.json','App.tsx','server.mjs','scripts/source-archive.ts','tests/app.spec.ts']) {
    expect(zip.file(file), file).not.toBeNull();
  }
  expect(await zip.file('App.tsx')!.async('string')).toContain('export default function App()');
  expect(zip.file('.env')).toBeNull();
  expect(Object.keys(zip.files).some(file => file.startsWith('node_modules/'))).toBe(false);
  const singlePromise = page.waitForEvent('download');
  await page.getByRole('button', {name: 'Ushbu faylni yuklash', exact: false}).click();
  expect((await singlePromise).suggestedFilename()).toBe('App.tsx');
});
