import React, {useEffect, useRef, useState} from 'react';
import {Terminal} from '@xterm/xterm';
import {FitAddon} from '@xterm/addon-fit';
import type {WebContainer, WebContainerProcess} from '@webcontainer/api';
import JSZip from 'jszip';
import '@xterm/xterm/css/xterm.css';
import {INITIAL_WORKSPACE, loadWorkspace, readWorkspace, saveWorkspace, validateWorkspace, workspacePath, workspaceTree, type WorkspaceFiles} from '../lib/workspace';
import {downloadBlob} from '../lib/download';

interface Props {open: boolean; onClose: () => void;}
type Phase = 'idle' | 'booting' | 'ready' | 'error';
const button = 'px-2 py-1 border border-emerald-800 rounded text-emerald-200 hover:bg-emerald-950 disabled:opacity-40';
export default function BrowserWorkspace({open, onClose}: Props) {
  const [files, setFiles] = useState<WorkspaceFiles>({...INITIAL_WORKSPACE});
  const [selected, setSelected] = useState('src/index.js');
  const [editor, setEditor] = useState(INITIAL_WORKSPACE['src/index.js']);
  const [newPath, setNewPath] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [hydrated, setHydrated] = useState(false);
  const [message, setMessage] = useState('Loyiha faqat shu brauzerda saqlanadi.');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState('');
  const [tab, setTab] = useState<'editor' | 'preview'>('editor');
  const [previewVersion, setPreviewVersion] = useState(0);
  const terminalElement = useRef<HTMLDivElement>(null);
  const term = useRef<Terminal | null>(null);
  const fit = useRef<FitAddon | null>(null);
  const runtime = useRef<WebContainer | null>(null);
  const shell = useRef<WebContainerProcess | null>(null);
  const input = useRef<WritableStreamDefaultWriter<string> | null>(null);
  const generation = useRef(0);
  const bootPending = useRef(false);
  const unsubscribers = useRef<(() => void)[]>([]);
  const dirty = selected in files && editor !== files[selected];
  const report = (failure: unknown) => setError(failure instanceof Error ? failure.message : 'Amalni bajarib bo‘lmadi.');

  useEffect(() => {
    let cancelled = false;
    void loadWorkspace().then(saved => {
      if (cancelled || !saved) return;
      setFiles(saved);
      const path = saved['src/index.js'] !== undefined ? 'src/index.js' : Object.keys(saved).sort()[0] || '';
      setSelected(path); setEditor(saved[path] || '');
    }).catch(failure => {if (!cancelled) report(failure);}).finally(() => {if (!cancelled) setHydrated(true);});
    const terminal = new Terminal({cursorBlink:true, fontSize:13, fontFamily:'monospace', scrollback:5000,
      theme:{background:'#030805', foreground:'#6ee7b7', cursor:'#22d3ee'}, convertEol:true});
    const addon = new FitAddon();
    terminal.loadAddon(addon);
    terminal.open(terminalElement.current!);
    terminal.writeln('CYBERPUNK BROWSER LAB — Node.js / npm');
    terminal.writeln('"Ishga tushirish" tugmasini bosing. Bu o‘yin simulyatori emas.');
    term.current = terminal; fit.current = addon;
    const data = terminal.onData(data => {void input.current?.write(data).catch(() => {});});
    const resize = terminal.onResize(size => {try {shell.current?.resize(size);} catch { /* process exited */ }});
    const observer = new ResizeObserver(() => {try {addon.fit();} catch { /* hidden workspace */ }});
    observer.observe(terminalElement.current!);
    return () => {
      cancelled = true; generation.current++;
      for (const unsubscribe of unsubscribers.current) unsubscribe();
      input.current?.releaseLock(); shell.current?.kill(); runtime.current?.teardown();
      observer.disconnect(); data.dispose(); resize.dispose(); terminal.dispose();
    };
  }, []);
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {try {fit.current?.fit();} catch { /* not visible yet */ }}, 0);
    return () => window.clearTimeout(timer);
  }, [open]);
  const stop = () => {
    generation.current++;
    for (const unsubscribe of unsubscribers.current) unsubscribe();
    unsubscribers.current = [];
    input.current?.releaseLock(); input.current = null;
    shell.current?.kill(); shell.current = null;
    runtime.current?.teardown(); runtime.current = null;
    setPhase('idle'); setPreview('');
    term.current?.writeln('\r\n[Runtime to‘xtatildi. Saqlanmagan terminal fayllari tiklanmaydi.]');
  };
  const start = async () => {
    if (runtime.current || bootPending.current || !hydrated) return;
    setError('');
    if (!window.crossOriginIsolated || typeof SharedArrayBuffer === 'undefined') {
      setPhase('error'); setError('Bu brauzer terminal uchun zarur izolyatsiyani ochmadi. Chrome/Edge’da HTTPS orqali qayta oching.'); return;
    }
    const session = ++generation.current;
    let expired = false;
    bootPending.current = true; setPhase('booting');
    term.current?.writeln('\r\n[Node runtime yuklanmoqda… birinchi ishga tushish internet talab qiladi.]');
    const timer = window.setTimeout(() => {
      expired = true;
      if (session === generation.current) {setPhase('error'); setError('Runtime yuklanmadi. Internet yoki brauzer bloklagichlarini tekshirib, sahifani yangilang.');}
    }, 35_000);
    try {
      const {WebContainer} = await import('@webcontainer/api');
      const container = await WebContainer.boot({coep:'credentialless', workdirName:'cyberpunk-lab'});
      if (expired || session !== generation.current) {container.teardown(); return;}
      runtime.current = container;
      await container.mount(workspaceTree(files));
      if (session !== generation.current) return;
      if (expired) {container.teardown(); runtime.current = null; return;}
      unsubscribers.current.push(container.on('server-ready', (_port, url) => {
        if (session !== generation.current) return;
        const address = new URL(url);
        if (address.protocol === 'https:' || (address.protocol === 'http:' && ['localhost','127.0.0.1'].includes(address.hostname))) {
          setPreview(url); setMessage('Server tayyor. Preview tabini oching.');
        }
      }));
      unsubscribers.current.push(container.on('port', (_port, type, url) => {if (type === 'close') setPreview(current => current === url ? '' : current);}));
      unsubscribers.current.push(container.on('error', () => {if (session === generation.current) setError('Runtime xatosi. Loyihani saqlab, runtime’ni qayta ishga tushiring.');}));
      const process = await container.spawn('jsh', {terminal:{cols:term.current?.cols || 80, rows:term.current?.rows || 24}});
      if (session !== generation.current) {process.kill(); return;}
      if (expired) {process.kill(); container.teardown(); runtime.current = null; return;}
      shell.current = process; input.current = process.input.getWriter();
      void process.output.pipeTo(new WritableStream({write(data) {if (session === generation.current) term.current?.write(data);}})).catch(() => {});
      void process.exit.then(code => {
        if (session !== generation.current) return;
        term.current?.writeln(`\r\n[Shell tugadi: ${code}. Qayta ochish uchun runtime’ni to‘xtating va boshlang.]`);
      });
      setPhase('ready');
      term.current?.writeln('\r\nSinang: node src/index.js | npm test | npm run start\r\n');
      term.current?.focus();
    } catch {
      if (session === generation.current) {
        for (const unsubscribe of unsubscribers.current) unsubscribe(); unsubscribers.current = [];
        runtime.current?.teardown(); runtime.current = null;
        setPhase('error'); setError('Node runtime ochilmadi. Chrome/Edge, HTTPS va StackBlitz xizmatiga ulanishni tekshiring.');
      }
    } finally {
      clearTimeout(timer); bootPending.current = false;
    }
  };
  const persist = async (next: WorkspaceFiles) => {
    setFiles(next);
    try {
      await saveWorkspace(next);
      setMessage('Loyiha brauzer xotirasiga saqlandi.');
    } catch (failure) {
      report(failure);
      setMessage('O‘zgarishlar hozirgi sessiyada bor. Doimiy saqlash ishlamadi — ZIP nusxa oling.');
    }
  };
  const save = async () => {
    if (!selected) return;
    setBusy(true); setError('');
    try {
      const next = validateWorkspace({...files, [selected]:editor});
      if (runtime.current) await runtime.current.fs.writeFile(selected, editor);
      await persist(next); setPreviewVersion(value => value + 1);
    } catch (failure) {report(failure);} finally {setBusy(false);}
  };
  const select = (path: string) => {
    if (dirty && !window.confirm('Saqlanmagan tahrirni tashlab boshqa faylni ochasizmi?')) return;
    setSelected(path); setEditor(files[path] || '');
  };
  const create = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const path = workspacePath(newPath);
      if (Object.hasOwn(files, path)) throw Error('Bu fayl allaqachon mavjud.');
      if (dirty && !window.confirm('Saqlanmagan tahrirni tashlab yangi fayl ochasizmi?')) return;
      const next = validateWorkspace({...files, [path]:''}); workspaceTree(next);
      if (runtime.current) {
        if (path.includes('/')) await runtime.current.fs.mkdir(path.slice(0, path.lastIndexOf('/')), {recursive:true});
        await runtime.current.fs.writeFile(path, '');
      }
      await persist(next); setSelected(path); setEditor(''); setNewPath('');
    } catch (failure) {report(failure);} finally {setBusy(false);}
  };
  const refresh = async () => {
    if (!runtime.current) return;
    if (dirty && !window.confirm('Terminal fayllarini o‘qishda saqlanmagan tahrir tashlanadi. Davom etasizmi?')) return;
    setBusy(true); setError('');
    try {
      const snapshot = await readWorkspace(runtime.current.fs);
      await persist(snapshot.files);
      const path = selected in snapshot.files ? selected : Object.keys(snapshot.files).sort()[0] || '';
      setSelected(path); setEditor(snapshot.files[path] || '');
      if (snapshot.omitted) setMessage(`${snapshot.omitted} ta katta yoki binar fayl lokal matn nusxasiga kiritilmadi. ZIP eksportdan foydalaning.`);
    } catch (failure) {report(failure);} finally {setBusy(false);}
  };
  const remove = async () => {
    if (!selected || !window.confirm(`"${selected}" faylini o‘chirasizmi?`)) return;
    setBusy(true); setError('');
    try {
      if (runtime.current) await runtime.current.fs.rm(selected);
      const next = {...files}; delete next[selected]; await persist(next);
      const path = Object.keys(next).sort()[0] || ''; setSelected(path); setEditor(next[path] || '');
    } catch (failure) {report(failure);} finally {setBusy(false);}
  };
  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    setBusy(true); setError('');
    try {
      const path = workspacePath(file.name);
      if (file.size > 1024 * 1024) throw Error('Bitta matn fayli 1 MB dan oshmasin.');
      const text = new TextDecoder('utf-8', {fatal:true}).decode(await file.arrayBuffer());
      if (text.includes('\0')) throw Error('Faqat matn faylini tanlang.');
      if ((Object.hasOwn(files, path) || dirty) && !window.confirm('Mavjud fayl yoki saqlanmagan tahrir almashtiriladi. Davom etasizmi?')) return;
      const next = validateWorkspace({...files, [path]:text}); workspaceTree(next);
      if (runtime.current) await runtime.current.fs.writeFile(path, text);
      await persist(next); setSelected(path); setEditor(text);
    } catch (failure) {report(failure);} finally {setBusy(false);}
  };
  const exportProject = async () => {
    setBusy(true); setError('');
    try {
      if (dirty) throw Error('ZIP eksportdan oldin tahrirni saqlang.');
      if (runtime.current) {
        const bytes = await runtime.current.export('.', {format:'zip', excludes:['node_modules','node_modules/**','.git','.git/**','.cache/**','.npm/**']});
        downloadBlob(new Blob([new Uint8Array(bytes).buffer], {type:'application/zip'}), 'cyberpunk-browser-project.zip');
      } else {
        const zip = new JSZip(); for (const [path,text] of Object.entries(files)) zip.file(path,text);
        downloadBlob(await zip.generateAsync({type:'blob'}), 'cyberpunk-browser-project.zip');
      }
    } catch (failure) {report(failure);} finally {setBusy(false);}
  };
  return <div hidden={!open} className="fixed inset-0 z-[60] bg-black/95 p-2 md:p-4 text-emerald-300 font-mono text-xs" role="dialog" aria-modal="true" aria-label="Browser terminal">
    <div className="h-full max-w-[1600px] mx-auto flex flex-col rounded border border-emerald-700 bg-[#030805] overflow-hidden">
      <header className="flex flex-wrap items-center gap-2 border-b border-emerald-900 p-2">
        <strong className="text-cyan-300 mr-auto">BROWSER LAB · NODE.JS / NPM</strong>
        <span role="status">{phase === 'ready' ? 'ISHLAYAPTI' : phase === 'booting' ? 'YUKLANMOQDA…' : phase === 'error' ? 'ULANMADI' : 'TAYYOR'}</span>
        <button className={button} disabled={!hydrated || phase === 'booting' || phase === 'ready' || bootPending.current} onClick={() => void start()}>Ishga tushirish</button>
        <button className={button} disabled={!runtime.current} onClick={stop}>To‘xtatish</button>
        <button className={button} onClick={onClose} aria-label="Browser terminalni yopish">O‘yinga qaytish</button>
      </header>
      <div className="p-2 border-b border-emerald-950 space-y-1">
        <p className="text-zinc-400">Fayllar va Node jarayonlari brauzer ichida ishlaydi. Yopish runtime’ni saqlaydi; To‘xtatish jarayonlarni tugatadi.</p>
        <p className="text-zinc-400">Sinang: <code>node src/index.js</code> · <code>npm test</code> · <code>npm run start</code>. Ctrl+C — jarayonni to‘xtatish.</p>
        <p className="text-emerald-400">{message}</p>
        {error && <p role="alert" className="text-amber-300">{error}</p>}
      </div>
      <div className="flex flex-wrap gap-2 items-center p-2 border-b border-emerald-950">
        <form onSubmit={create} className="flex gap-1">
          <input aria-label="Yangi fayl yo‘li" value={newPath} onChange={event => setNewPath(event.target.value)} placeholder="src/hello.js" className="w-36 bg-black border border-zinc-700 rounded px-2 py-1"/>
          <button className={button} disabled={busy || phase === 'booting' || !hydrated || !newPath}>Yaratish</button>
        </form>
        <button className={button} disabled={busy || phase === 'booting' || !selected || !hydrated} onClick={() => void save()}>Saqlash {dirty ? '*' : ''}</button>
        <button className={button} disabled={busy || phase === 'booting' || phase !== 'ready'} onClick={() => void refresh()}>Yangilash</button>
        <button className={button} disabled={busy || phase === 'booting' || !selected} onClick={() => void remove()}>Faylni o‘chirish</button>
        <label className={button}>Fayl yuklash<input type="file" aria-label="Loyihaga matn fayli yuklash" disabled={busy || phase === 'booting'} onChange={event => void upload(event)} className="hidden"/></label>
        <button className={button} disabled={busy || phase === 'booting' || !hydrated} onClick={() => void exportProject()}>Loyiha ZIP</button>
      </div>
      <div className="flex flex-1 min-h-0">
        <nav aria-label="Loyiha fayllari" className="hidden md:block w-48 shrink-0 overflow-auto border-r border-emerald-950 p-2 space-y-1">
          {Object.keys(files).sort().map(path => <button key={path} className={`block text-left w-full truncate p-1 rounded ${path === selected ? 'bg-emerald-950 text-cyan-200' : 'text-zinc-400 hover:text-emerald-300'}`} onClick={() => select(path)} title={path}>{path}</button>)}
        </nav>
        <div className="flex-1 min-w-0 flex flex-col">
          <select aria-label="Tahrirlanadigan fayl" className="md:hidden p-2 bg-black" value={selected} onChange={event => select(event.target.value)}>{Object.keys(files).sort().map(path => <option key={path}>{path}</option>)}</select>
          <div className="flex gap-2 p-1 border-b border-emerald-950">
            <button className={button} aria-pressed={tab === 'editor'} onClick={() => setTab('editor')}>Muharrir</button>
            <button className={button} aria-pressed={tab === 'preview'} onClick={() => setTab('preview')}>Preview</button>
            <span className="truncate text-zinc-400 self-center">{selected}{dirty ? ' *' : ''}</span>
          </div>
          <div className="flex-1 min-h-0">
            {tab === 'editor' ? <textarea aria-label="Kod muharriri" value={editor} disabled={!selected || !hydrated} spellCheck={false}
              onChange={event => setEditor(event.target.value)}
              onKeyDown={event => {
                if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {event.preventDefault(); if (!busy) void save();}
                if (event.key === 'Tab') {event.preventDefault(); const field = event.currentTarget; const from = field.selectionStart; const to = field.selectionEnd;
                  setEditor(editor.slice(0,from) + '  ' + editor.slice(to)); requestAnimationFrame(() => {field.selectionStart = field.selectionEnd = from + 2;});}
              }} className="w-full h-full resize-none bg-[#06100b] text-emerald-200 p-3 outline-none leading-relaxed font-mono"/>
              : preview ? <iframe key={preview + previewVersion} src={preview} title="Loyiha preview" sandbox="allow-scripts allow-same-origin allow-forms allow-downloads" allow="cross-origin-isolated" className="w-full h-full bg-white"/>
              : <p className="text-zinc-400 p-4">Terminalda <code>npm run start</code> yozing. Server tayyor bo‘lgach preview shu yerda ochiladi.</p>}
          </div>
          <div className="h-[38%] min-h-40 border-t border-emerald-800 p-2" ref={terminalElement} aria-label="Node terminal chiqishi"/>
        </div>
      </div>
    </div>
  </div>;
}
