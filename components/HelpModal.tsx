import React from 'react';
import { HELP_COMMANDS } from '../constants';
interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCommand: (cmd: string) => void;
}
export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, onSelectCommand }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl border-2 border-emerald-500/70 bg-zinc-950/95 p-5 font-mono text-xs text-emerald-400 shadow-[0_0_35px_rgba(16,185,129,0.3)] rounded-lg">
        <div className="flex items-center justify-between border-b border-emerald-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-400 text-[18px]">terminal</span>
            <span className="font-bold text-sm tracking-wider text-emerald-200">
              TUI TERMINAL BUYRUQLARI REESTRI
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-emerald-400 p-1 rounded hover:bg-emerald-950"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
        <p className="text-zinc-400 mb-4 leading-relaxed">
          Ushbu kiberpank TUI muhitida klaviatura orqali buyruqlarni yozishingiz yoki to'g'ridan-to'g'ri quyidagi ro'yxatdan birini bosib bajarishingiz mumkin:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto pr-1">
          {HELP_COMMANDS.map((item, idx) => (
            <div
              key={idx}
              onClick={() => {
                onSelectCommand(item.cmd);
                onClose();
              }}
              className="p-2.5 rounded border border-zinc-800 bg-zinc-900/60 hover:bg-emerald-950/40 hover:border-emerald-600/70 cursor-pointer transition-all flex flex-col gap-1 group"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-300 group-hover:text-emerald-200">
                  $ {item.cmd}
                </span>
                <span className="text-[10px] text-zinc-500 group-hover:text-emerald-500">
                  [BAJARISH]
                </span>
              </div>
              <span className="text-[11px] text-zinc-400">{item.desc}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-zinc-800 flex justify-between items-center text-[11px] text-zinc-500">
          <span>Maslahat: Buyruq kiritish maydoniga yozing va ENTER bosing.</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-black font-bold rounded"
          >
            Yopish [ESC]
          </button>
        </div>
      </div>
    </div>
  );
};
