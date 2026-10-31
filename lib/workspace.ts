import type {FileSystemAPI, FileSystemTree} from '@webcontainer/api';

export type WorkspaceFiles = Record<string, string>;
export const INITIAL_WORKSPACE: WorkspaceFiles = {
  'package.json': JSON.stringify({name:'cyberpunk-browser-lab', version:'1.0.0', private:true, type:'module',
    scripts:{start:'node server.js', test:'node --test test/math.test.js'}}, null, 2) + '\n',
  'src/index.js': "export const add = (a, b) => a + b;\nconsole.log('Salom, Cyberpunk Browser Lab!');\nconsole.log('2 + 3 =', add(2, 3));\n",
  'server.js': "import http from 'node:http';\nimport {readFile} from 'node:fs/promises';\nhttp.createServer(async (_req, res) => {\n  try {\n    const page = await readFile('index.html', 'utf8');\n    res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});\n    res.end(page);\n  } catch { res.writeHead(500); res.end('index.html ni tekshiring'); }\n}).listen(3000, '0.0.0.0', () => console.log('Preview server: 3000-port'));\n",
  'index.html': '<!doctype html>\n<html lang="uz"><meta charset="utf-8"><title>Browser Lab</title>\n<style>body{background:#050805;color:#34d399;font:18px monospace;padding:3rem}h1{color:#67e8f9}</style>\n<h1>Cyberpunk Browser Lab</h1><p>Bu sahifani index.html muharririda o‘zgartiring va saqlang.</p></html>\n',
  'test/math.test.js': "import {test} from 'node:test';\nimport assert from 'node:assert/strict';\nimport {add} from '../src/index.js';\ntest('addition', () => assert.equal(add(2, 3), 5));\n",
  'README.md': '# Cyberpunk Browser Lab\n\nnode src/index.js\nnpm test\nnpm run start\n\nServer ishlaganda Preview tabini oching. Ctrl+C bilan to‘xtating.\n\nls, pwd, cat, mkdir, rm, node, npm va npx buyruqlaridan foydalaning.\nTerminalda o‘zgargan fayllar uchun Yangilash tugmasini bosing.\n'
};
const EXCLUDED = new Set(['node_modules', '.git', '.cache', '.npm', '.next', 'dist', 'build']);
export function workspacePath(value: string) {
  const path = value.trim().replaceAll('\\', '/');
  const parts = path.split('/');
  if (!path || path.length > 240 || parts.some(part => !part || part === '.' || part === '..' || EXCLUDED.has(part)) || /[\x00-\x1f]/.test(path)) {
    throw Error('Nisbiy fayl yo‘lini kiriting, masalan src/hello.js.');
  }
  return path;
}
export function validateWorkspace(value: unknown): WorkspaceFiles {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('Loyiha formati noto‘g‘ri.');
  const entries = Object.entries(value);
  if (entries.length > 200) throw Error('Loyihada ko‘pi bilan 200 ta matn fayli saqlanadi.');
  let size = 0;
  const files: WorkspaceFiles = Object.create(null);
  for (const [path, text] of entries) {
    if (workspacePath(path) !== path) throw Error('Fayl yo‘li standart formatda bo‘lsin.');
    if (typeof text !== 'string') throw Error('Faqat matn fayllari saqlanadi.');
    const bytes = new TextEncoder().encode(text).length;
    if (bytes > 1024 * 1024) throw Error('Bitta matn fayli 1 MB dan oshmasin.');
    size += bytes;
    if (size > 8 * 1024 * 1024) throw Error('Matn loyihasi 8 MB dan oshmasin.');
    files[path] = text;
  }
  return files;
}
export function workspaceTree(files: WorkspaceFiles): FileSystemTree {
  const tree: FileSystemTree = Object.create(null);
  for (const [path, contents] of Object.entries(validateWorkspace(files))) {
    const parts = workspacePath(path).split('/');
    let directory = tree;
    for (const part of parts.slice(0, -1)) {
      if (!directory[part]) directory[part] = {directory: Object.create(null)};
      const node = directory[part];
      if (!('directory' in node)) throw Error('Fayl va katalog nomlari to‘qnashdi.');
      directory = node.directory;
    }
    const name = parts.at(-1)!;
    if (directory[name]) throw Error('Fayl va katalog nomlari to‘qnashdi.');
    directory[name] = {file: {contents}};
  }
  return tree;
}
export async function readWorkspace(fs: FileSystemAPI) {
  const files: WorkspaceFiles = Object.create(null);
  let omitted = 0;
  async function walk(directory: string, depth = 0): Promise<void> {
    if (depth > 12) throw Error('Kataloglar juda chuqur joylashgan.');
    const entries = await fs.readdir(directory || '.', {withFileTypes: true});
    for (const entry of entries) {
      if (EXCLUDED.has(entry.name)) continue;
      const path = directory ? `${directory}/${entry.name}` : entry.name;
      if (entry.isDirectory()) await walk(path, depth + 1);
      else if (entry.isFile()) {
        const data = await fs.readFile(path);
        if (data.length > 1024 * 1024) {omitted++; continue;}
        try {
          const text = new TextDecoder('utf-8', {fatal:true}).decode(data);
          if (text.includes('\0')) {omitted++; continue;}
          if (workspacePath(path) !== path) {omitted++; continue;}
          files[path] = text;
        } catch {omitted++;}
        if (Object.keys(files).length > 200) throw Error('Loyihada ko‘pi bilan 200 ta matn fayli saqlanadi.');
      }
    }
  }
  await walk('');
  return {files: validateWorkspace(files), omitted};
}
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('cyberpunk-browser-lab', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('workspace');
    request.onerror = () => reject(Error('Brauzer xotirasini ochib bo‘lmadi.'));
    request.onsuccess = () => resolve(request.result);
  });
}
export async function loadWorkspace(): Promise<WorkspaceFiles | null> {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction('workspace').objectStore('workspace').get('files');
      request.onsuccess = () => {try {resolve(request.result ? validateWorkspace(request.result) : null);} catch (error) {reject(error);}};
      request.onerror = () => reject(Error('Saqlangan loyihani o‘qib bo‘lmadi.'));
    });
  } finally {db.close();}
}
export async function saveWorkspace(files: WorkspaceFiles) {
  const data = validateWorkspace(files);
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction('workspace', 'readwrite');
      transaction.objectStore('workspace').put(data, 'files');
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(Error('Brauzer xotirasiga saqlab bo‘lmadi. ZIP eksport qiling.'));
      transaction.onabort = () => reject(Error('Loyihani saqlash bekor qilindi.'));
    });
  } finally {db.close();}
}
