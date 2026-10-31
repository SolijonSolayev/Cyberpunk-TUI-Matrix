import {test, expect} from '@playwright/test';
import JSZip from 'jszip';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {INITIAL_WORKSPACE, validateWorkspace, workspacePath, workspaceTree, readWorkspace} from '../lib/workspace';
import type {FileSystemAPI} from '@webcontainer/api';

test('workspace paths and snapshots reject traversal, oversized content and collisions', () => {
  for (const value of ['/etc/passwd','../secret','src/../secret','node_modules/a.js','a\0b','./a','a//b']) {
    expect(() => workspacePath(value)).toThrow();
  }
  expect(workspacePath('src/hello.js')).toBe('src/hello.js');
  expect(() => validateWorkspace({'test.js': 'x'.repeat(1024 * 1024 + 1)})).toThrow();
  expect(() => workspaceTree({'file':'x', 'file/child.js':'x'})).toThrow();
  const special = JSON.parse('{"__proto__":"safe text","constructor":"another file"}');
  expect(Object.keys(workspaceTree(special)).sort()).toEqual(['__proto__','constructor']);
  expect(Object.getPrototypeOf(validateWorkspace(special))).toBeNull();
  expect(Object.keys(workspaceTree(INITIAL_WORKSPACE))).toContain('package.json');
});
test('the shipped Node starter actually runs its script and tests', async () => {
  const folder = await fs.mkdtemp(path.join(os.tmpdir(), 'cyberpunk-starter-'));
  try {
    for (const [name, contents] of Object.entries(INITIAL_WORKSPACE)) {
      const target = path.join(folder, name);
      await fs.mkdir(path.dirname(target), {recursive:true}); await fs.writeFile(target, contents);
    }
    const run = promisify(execFile);
    const result = await run(process.execPath, ['src/index.js'], {cwd:folder, env:{...process.env, FORCE_COLOR:'0'}});
    expect(result.stdout).toContain('2 + 3 = 5');
    const tests = await run(process.execPath, ['--test', 'test/math.test.js'], {cwd:folder, env:{...process.env, FORCE_COLOR:'0'}});
    expect(tests.stdout).toMatch(/pass 1/);
    expect(tests.stdout).toMatch(/fail 0/);
  } finally {await fs.rm(folder, {recursive:true, force:true});}
});
test('runtime snapshots exclude dependencies and flag binary files', async () => {
  const file = (name: string, directory = false) => ({name, isFile:()=>!directory, isDirectory:()=>directory});
  const mock = {
    readdir: async (directory: string) => directory === '.' ? [file('node_modules',true),file('main.js'),file('binary.dat')] : [],
    readFile: async (name: string) => name === 'main.js' ? new TextEncoder().encode('console.log(42)') : new Uint8Array([0,255])
  } as unknown as FileSystemAPI;
  const result = await readWorkspace(mock);
  expect(result.files).toEqual({'main.js':'console.log(42)'});
  expect(result.omitted).toBe(1);
});
test('browser lab edits, persists, restores, uploads and exports real project files without a server', async ({page}) => {
  await page.goto('/');
  expect(await page.evaluate(() => window.crossOriginIsolated)).toBe(true);
  await page.getByRole('button', {name:'BROWSER LAB', exact:false}).click();
  const lab = page.getByRole('dialog', {name:'Browser terminal'});
  await expect(lab).toBeVisible();
  await lab.getByRole('textbox', {name:'Yangi fayl yo‘li'}).fill('src/hello.js');
  await lab.getByRole('button', {name:'Yaratish', exact:true}).click();
  const editor = lab.getByRole('textbox', {name:'Kod muharriri'});
  await expect(lab.getByRole('button', {name:'src/hello.js', exact:true})).toBeVisible();
  await editor.fill('console.log("saved browser project");\n');
  await editor.press('Control+s');
  await expect(lab.getByRole('button', {name:'Saqlash', exact:true})).toBeVisible();
  await lab.getByRole('button', {name:'Browser terminalni yopish'}).click();
  await expect(lab).toBeHidden();
  await page.reload();
  await page.getByRole('button', {name:'BROWSER LAB', exact:false}).click();
  await lab.getByRole('button', {name:'src/hello.js', exact:true}).click();
  await expect(editor).toHaveValue('console.log("saved browser project");\n');
  await lab.getByLabel('Loyihaga matn fayli yuklash').setInputFiles({name:'notes.md',mimeType:'text/plain',buffer:Buffer.from('# Real upload')});
  await expect(editor).toHaveValue('# Real upload');
  const downloadPromise = page.waitForEvent('download');
  await lab.getByRole('button', {name:'Loyiha ZIP', exact:true}).click();
  const download = await downloadPromise;
  const zip = await JSZip.loadAsync(await fs.readFile((await download.path())!));
  expect(await zip.file('src/hello.js')!.async('string')).toContain('saved browser project');
  expect(await zip.file('notes.md')!.async('string')).toBe('# Real upload');
  expect(zip.file('package.json')).not.toBeNull();
  await lab.getByRole('button', {name:'Preview', exact:true}).click();
  await expect(lab.getByText('Terminalda', {exact:false})).toContainText('npm run start');
});
test('terminal command opens the lab and its Escape key does not close the workspace', async ({page}) => {
  await page.goto('/');
  await page.getByRole('textbox', {name:'Terminal buyrug‘i'}).fill('terminal');
  await page.getByRole('textbox', {name:'Terminal buyrug‘i'}).press('Enter');
  const lab = page.getByRole('dialog', {name:'Browser terminal'});
  await expect(lab).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(lab).toBeVisible();
  await lab.getByRole('button', {name:'Browser terminalni yopish'}).click();
  await expect(page.getByRole('textbox', {name:'Terminal buyrug‘i'})).toBeFocused();
});
