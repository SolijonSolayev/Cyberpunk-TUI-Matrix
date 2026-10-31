import React, { useState } from 'react';
import { Flow } from 'flow-sdk';
import JSZip from 'jszip';
import { APP_SOURCE_CODE } from '../constants';
interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}
export const DownloadModal: React.FC<DownloadModalProps> = ({ isOpen, onClose }) => {
  const [activeFile, setActiveFile] = useState<string>('App.tsx');
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'downloading' | 'done' | 'error'>('idle');
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  if (!isOpen) return null;
  const files = Object.keys(APP_SOURCE_CODE);
  // Butun loyiha kodlarini ZIP qilib Flow.download orqali yuklash
  const handleDownloadZip = async () => {
    setDownloadStatus('downloading');
    try {
      const zip = new JSZip();
      // README qo'shish
      zip.file(
        'README.md',
        `# Cyberpunk TUI Matrix\n\nZamonaviy TUI / CLI kiberpank operatsion tizimi va mini-o'yinlari.\n\nIshga tushirish uchun React 19 + TypeScript va Tailwind CSS dan foydalaning.`
      );
      // Har bir faylni arxivga qo'shish
      for (const [filename, content] of Object.entries(APP_SOURCE_CODE)) {
        zip.file(filename, content);
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        await Flow.download({
          base64,
          mimeType: 'application/zip',
          filename: 'Cyberpunk_TUI_Matrix_SourceCode.zip'
        });
        setDownloadStatus('done');
        setTimeout(() => setDownloadStatus('idle'), 3000);
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error(err);
      setDownloadStatus('error');
      setTimeout(() => setDownloadStatus('idle'), 3000);
    }
  };
  // Tanlangan faylni alohida .tsx/.ts qilib yuklab olish
  const handleDownloadSingleFile = async () => {
    try {
      const content = APP_SOURCE_CODE[activeFile] || '';
      const base64 = btoa(unescape(encodeURIComponent(content)));
      await Flow.download({
        base64,
        mimeType: 'text/plain',
        filename: activeFile
      });
    } catch (err) {
      console.error(err);
    }
  };
  // Fayl matnini buferga (clipboard) nusxalash
  const handleCopyCode = async () => {
    try {
      const code = APP_SOURCE_CODE[activeFile] || '';
      await navigator.clipboard.writeText(code);
      setCopiedFile(activeFile);
      setTimeout(() => setCopiedFile(null), 2000);
    } catch (err) {
      console.error(err);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl h-[85vh] flex flex-col border-2 border-emerald-500/70 bg-zinc-950/95 font-mono text-xs text-emerald-400 shadow-[0_0_45px_rgba(16,185,129,0.3)] rounded-lg overflow-hidden">
        {/* Sarlavha paneli */}
        <div className="flex items-center justify-between border-b border-emerald-800/80 px-4 py-3 bg-zinc-900/90">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-400 text-[20px]">file_download</span>
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
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
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
                    <span className="material-symbols-outlined text-[14px]">
                      {file.endsWith('.tsx') ? 'code' : 'description'}
                    </span>
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
                <span className="material-symbols-outlined text-[16px] text-cyan-400">code_blocks</span>
                {activeFile}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCode}
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white rounded flex items-center gap-1 transition-all"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {copiedFile === activeFile ? 'check' : 'content_copy'}
                  </span>
                  <span>{copiedFile === activeFile ? 'Nusxalandi ✓' : 'Nusxa olish'}</span>
                </button>
                <button
                  onClick={handleDownloadSingleFile}
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-emerald-700/60 text-emerald-300 hover:text-emerald-200 rounded flex items-center gap-1 transition-all"
                >
                  <span className="material-symbols-outlined text-[14px]">download</span>
                  <span>Ushbu faylni yuklash</span>
                </button>
              </div>
            </div>
            <pre className="flex-1 overflow-auto bg-black/90 p-3 rounded border border-zinc-900 text-zinc-300 text-[11px] font-mono leading-relaxed select-all">
              <code>{APP_SOURCE_CODE[activeFile]}</code>
            </pre>
          </div>
        </div>
        {/* Pastki harakatlar paneli */}
        <div className="border-t border-emerald-900/80 px-4 py-3 bg-zinc-950/90 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] text-zinc-400 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-yellow-400">info</span>
            <span>
              Loyiha kodlari Flow sandboxed tizimi xavfsiz yuklash protokoli orqali uzatiladi.
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
              disabled={downloadStatus === 'downloading'}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-black font-bold rounded shadow-[0_0_15px_rgba(16,185,129,0.4)] flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">folder_zip</span>
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
