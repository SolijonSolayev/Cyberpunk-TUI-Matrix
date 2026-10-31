import {test, expect} from '@playwright/test';
import {buyTool, consumeTool, INITIAL_INVENTORY} from '../lib/tools';
import {createGrid} from '../lib/grid';
import type {PlayerStats} from '../types';

const stats: PlayerStats = {handle: 'AGENT', level: 1, credits: 350, ram: 64, maxRam: 128,
  cpuHeat: 70, cryptoKeys: 1, firmwareVersion: 'test', cyberDecks: [], reputation: 15};

test('buying deducts the exact cost and cannot overspend or overflow inventory', () => {
  const result = buyTool(stats, INITIAL_INVENTORY, 'decryptor');
  expect(result.ok).toBe(true);
  if (!result.ok) throw Error('Purchase failed');
  expect(result.stats.credits).toBe(260);
  expect(result.inventory.decryptor).toBe(2);
  expect(stats.credits).toBe(350);
  expect(INITIAL_INVENTORY.decryptor).toBe(1);
  expect(buyTool({...stats, credits: 59}, INITIAL_INVENTORY, 'coolant').ok).toBe(false);
  expect(buyTool(stats, {...INITIAL_INVENTORY, emp: 99}, 'emp').ok).toBe(false);
});
test('using tools consumes inventory and RAM once; coolant respects resource limits', () => {
  const emp = consumeTool(stats, INITIAL_INVENTORY, 'emp');
  expect(emp.ok).toBe(true);
  if (!emp.ok) throw Error('Consumption failed');
  expect(emp.stats.ram).toBe(46);
  expect(emp.inventory.emp).toBe(0);
  expect(consumeTool(emp.stats, emp.inventory, 'emp').ok).toBe(false);
  expect(consumeTool({...stats, ram: 11}, INITIAL_INVENTORY, 'decryptor').ok).toBe(false);
  const coolant = consumeTool({...stats, ram: 120, cpuHeat: 25}, INITIAL_INVENTORY, 'coolant');
  if (!coolant.ok) throw Error('Consumption failed');
  expect(coolant.stats.ram).toBe(128);
  expect(coolant.stats.cpuHeat).toBe(22);
});
test('EMP suppresses exactly one daemon in a newly generated maze', () => {
  const normal = createGrid(() => 0.5);
  const suppressed = createGrid(() => 0.5, {emp: true});
  expect(normal.entities.filter(item => item.type === 'daemon')).toHaveLength(3);
  expect(suppressed.entities.filter(item => item.type === 'daemon')).toHaveLength(2);
  expect(suppressed.entities.filter(item => item.type === 'cache')).toHaveLength(4);
  expect(suppressed.entities.filter(item => item.type === 'portal')).toHaveLength(1);
});
test('terminal arsenal supports probing, purchases, assisted hacking, coolant and one-shot EMP', async ({page}) => {
  await page.goto('/');
  const input = page.locator('input');
  const cmd = async (text: string) => {await input.fill(text); await input.press('Enter');};
  await cmd('probe 8.8.8.8'); await expect(page.getByText('Nishon topilmadi.', {exact: false})).toBeVisible();
  await cmd('probe 192.168.4.102'); await expect(page.getByText('NISHON TAHLILI:', {exact: false})).toContainText('HEX buferi: 3');
  await cmd('buy not-a-tool'); await expect(page.getByText('Ishlatish: buy decryptor', {exact: false})).toBeVisible();
  await cmd('buy decryptor'); await expect(page.getByText('HEX Decryptor olindi.', {exact: false})).toBeVisible();
  await cmd('use decryptor 8.8.8.8');
  await cmd('use decryptor 192.168.4.102');
  await expect(page.getByText('Decryptor birinchi HEX', {exact: false})).toBeVisible();
  await cmd('use decryptor 192.168.4.102');
  await expect(page.getByText('allaqachon ishlatilgan', {exact: false})).toBeVisible();
  for (const name of ['0x1F', '0x7C']) await page.getByRole('button', {name, exact: true}).click();
  await expect(page.getByText('Sizga +250', {exact: false})).toBeVisible();
  await cmd('status');
  await expect(page.getByText('[KIBER-DECK STATUSI]', {exact: false}).last()).toContainText('Mablag\': 510');
  await expect(page.getByText('[KIBER-DECK STATUSI]', {exact: false}).last()).toContainText('RAM): 52 MB');
  await cmd('use emp');
  await cmd('use emp'); await expect(page.getByText('EMP keyingi labirint uchun tayyorlangan', {exact: false})).toBeVisible();
  await cmd('grid');
  const maze = page.getByRole('region', {name: 'Kiber-labirint'});
  expect((await maze.locator('[data-grid-row]').allTextContents()).join('').match(/☠/g)?.length).toBe(2);
  await page.keyboard.press('Escape');
  await cmd('grid');
  expect((await maze.locator('[data-grid-row]').allTextContents()).join('').match(/☠/g)?.length).toBe(3);
  await page.keyboard.press('Escape');
  await cmd('use coolant');
  await expect(page.getByText('Cryo Patch: CPU', {exact: false})).toContainText('RAM 58/128 MB');
  await cmd('tools');
  await expect(page.getByText('XAKERLIK INVENTARI:', {exact: false})).toContainText('×0');
  await cmd('history'); await expect(page.getByText('BUYRUQLAR TARIXI:', {exact: false})).toContainText('buy decryptor');
  await cmd('whoami'); await expect(page.getByText('Agent: @CYBER_GHOST', {exact: false})).toBeVisible();
  await cmd('uptime'); await expect(page.getByText('SESSIYA:', {exact: false})).toBeVisible();
});
