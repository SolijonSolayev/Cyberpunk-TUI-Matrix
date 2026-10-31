import {Icon} from './Icon';
import React, { useState, useEffect } from 'react';
import { downloadBlob } from '../lib/download';
import JSZip from 'jszip';
import { loadSource } from '../lib/source';
interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}
export const DownloadModal: React.FC<DownloadModalProps> = ({ isOpen, onClose }) => {
  const [activeFile, setActiveFile] = useState<string>('App.tsx');
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'downloading' | 'done' | 'error'>('idle');
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [source, setSource] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setError('');
    loadSource().then(files => { if (!cancelled) setSource(files); })
      .catch(() => { if (!cancelled) setError('Manba fayllarini yuklab bo‘lmadi. Oynani qayta oching.'); });
    return () => { cancelled = true; };
  }, [isOpen]);
  if (!isOpen) return null;
  const files = Object.keys(source);
  const handleDownloadZip = async () => {
    setDownloadStatus('downloading');
    setError('');
    try {
      const zip = new JSZip();
      for (const [filename, content] of Object.entries(source)) zip.file(filename, content);
      downloadBlob(await zip.generateAsync({type: 'blob'}), 'Cyberpunk_TUI_Matrix_SourceCode.zip');
      setDownloadStatus('done');
    } catch {
      setDownloadStatus('error');
      setError('ZIP arxivini yaratib bo‘lmadi. Qayta urinib ko‘ring.');
    }
  };
  const handleDownloadSingleFile = () => {
    try {
      downloadBlob(new Blob([source[activeFile]], {type: 'text/plain;charset=utf-8'}), activeFile);
    } catch { setError('Faylni yuklab bo‘lmadi.'); }
  };
  // Fayl matnini buferga (clipboard) nusxalash
  const handleCopyCode = async () => {
    try {
      const code = source[activeFile] || '';
      await navigator.clipboard.writeText(code);
      setCopiedFile(activeFile);
      setTimeout(() => setCopiedFile(null), 2000);
    } catch (err) {
      setError('Nusxa olish uchun brauzer ruxsati kerak.');
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl h-[85vh] flex flex-col border-2 border-emerald-500/70 bg-zinc-950/95 font-mono text-xs text-emerald-400 shadow-[0_0_45px_rgba(16,185,129,0.3)] rounded-lg overflow-hidden">
        {/* Sarlavha paneli */}
        <div className="flex items-center justify-between border-b border-emerald-800/80 px-4 py-3 bg-zinc-900/90">
          <div className="flex items-center gap-2">
            <Icon name="file_download" className="text-emerald-400 text-[20px]"/>
            <div>
              <span className="font-bold text-sm tracking-wider text-emerald-200">
                DASTUR MANBA KODLARINI YUKLAB OLISH (SOURCE REPOSITORY)
              </span>
              <p className="text-[10px] text-zinc-400">
                Loyihaning to'liq React, TypeScript va komponentlar arxitekturasini oling
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-emerald-300 p-1.5 rounded hover:bg-emerald-950/60"
          >
            <Icon name="close" className="text-[20px]"/>
          </button>
        </div>
        {error && <p role="alert" className="text-red-400 px-4 py-2">{error}</p>}
        {/* Asosiy ish maydoni: Fayllar ro'yxati va Kod ko'ruvchi */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Chap tomon: Fayllar navigatori */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-emerald-900/60 bg-black/60 p-3 overflow-y-auto">
            <div className="text-[10px] uppercase font-bold text-zinc-500 mb-2 px-1">
              Loyiha Fayllari:
            </div>
            <div className="space-y-1">
              {files.map((file) => (
                <button
                  key={file}
                  onClick={() => setActiveFile(file)}
                  className={`w-full text-left px-2.5 py-1.5 rounded flex items-center justify-between transition-all ${
                    activeFile === file
                      ? 'bg-emerald-950/90 border border-emerald-500 text-emerald-200 font-bold'
                      : 'hover:bg-zinc-900 text-zinc-400 hover:text-emerald-300 border border-transparent'
                  }`}
                >
                  <span className="truncate flex items-center gap-1.5">
                    <Icon name={file.endsWith('.tsx') ? 'code' : 'description'} className="text-[14px]"/>
                    {file}
                  </span>
                  {activeFile === file && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </button>
              ))}
            </div>
          </div>
          {/* O'ng tomon: Kod maydoni */}
          <div className="flex-1 flex flex-col bg-zinc-950 p-3 overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-2">
              <span className="text-zinc-300 font-bold flex items-center gap-1">
                <Icon name="code_blocks" className="text-[16px] text-cyan-400"/>
                {activeFile}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCode}
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white rounded flex items-center gap-1 transition-all"
                >
                  <Icon name={copiedFile === activeFile ? 'check' : 'content_copy'} className="text-[14px]"/>
                  <span>{copiedFile === activeFile ? 'Nusxalandi ✓' : 'Nusxa olish'}</span>
                </button>
                <button
                  disabled={!source[activeFile]} onClick={handleDownloadSingleFile}
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-emerald-700/60 text-emerald-300 hover:text-emerald-200 rounded flex items-center gap-1 transition-all"
                >
                  <Icon name="download" className="text-[14px]"/>
                  <span>Ushbu faylni yuklash</span>
                </button>
              </div>
            </div>
            <pre className="flex-1 overflow-auto bg-black/90 p-3 rounded border border-zinc-900 text-zinc-300 text-[11px] font-mono leading-relaxed select-all">
              <code>{source[activeFile]}</code>
            </pre>
          </div>
        </div>
        {/* Pastki harakatlar paneli */}
        <div className="border-t border-emerald-900/80 px-4 py-3 bg-zinc-950/90 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] text-zinc-400 flex items-center gap-2">
            <Icon name="info" className="text-[16px] text-yellow-400"/>
            <span>
              Haqiqiy loyiha fayllari brauzer orqali yuklanadi. Maxfiy sozlamalar arxivga kirmaydi.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 border border-zinc-700 text-zinc-400 hover:text-white rounded"
            >
              Yopish
            </button>
            <button
              onClick={handleDownloadZip}
              disabled={downloadStatus === 'downloading' || files.length === 0}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-black font-bold rounded shadow-[0_0_15px_rgba(16,185,129,0.4)] flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
            >
              <Icon name="folder_zip" className="text-[16px]"/>
              <span>
                {downloadStatus === 'downloading'
                  ? 'Arxivlanmoqda...'
                  : downloadStatus === 'done'
                  ? 'Yuklab olindi ✓'
                  : 'Barchasini ZIP qilib yuklab olish (.zip)'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
