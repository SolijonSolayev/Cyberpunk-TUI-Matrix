import {Icon} from './Icon';
import React, { useState, useEffect, useRef } from 'react';
import { HackNode } from '../types';
interface HackingPuzzleProps {
  node: HackNode;
  initialHexes?: string[];
  onSuccess: (credits: number) => void;
  onFail: () => void;
}
const HEX_POOL = ['0xAA', '0x1F', '0x7C', '0xDE', '0xAD', '0xBE', '0xEF', '0xFF', '0x00', '0x42', '0x99', '0x3A'];
export const HackingPuzzle: React.FC<HackingPuzzleProps> = ({ node, onSuccess, onFail, initialHexes = [] }) => {
  const [selectedHexes, setSelectedHexes] = useState<string[]>(() => initialHexes.slice(0, node.codePattern.length - 1));
  const [statusMsg, setStatusMsg] = useState<string>(initialHexes.length ? 'Decryptor birinchi HEX kodini kiritdi. Qolgan kodlarni tanlang.' : 'Nishon buferiga kerakli ketma-ketlikni inyeksiya qiling.');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimer = () => { if (timer.current) clearTimeout(timer.current); timer.current = null; };
  useEffect(() => clearTimer, []);
  const cancel = () => { clearTimer(); onFail(); };
  const handleSelect = (hex: string) => {
    if (selectedHexes.length >= node.codePattern.length) return;
    const nextList = [...selectedHexes, hex];
    setSelectedHexes(nextList);
    // Tekshirish
    if (nextList.length === node.codePattern.length) {
      const isCorrect = nextList.every((val, index) => val === node.codePattern[index]);
      if (isCorrect) {
        setStatusMsg('MUVAFFAQIYAT! Xavfsizlik shifrlari buzildi. Pul o\'tkazilmoqda...');
        timer.current = setTimeout(() => onSuccess(node.reward), 900);
      } else {
        setStatusMsg('XATOLIK! Shifr mos kelmadi. Tizim bloklandi!');
        timer.current = setTimeout(onFail, 1200);
      }
    }
  };
  const handleReset = () => {
    clearTimer();
    setSelectedHexes(initialHexes.slice(0, node.codePattern.length - 1));
    setStatusMsg('Kesh tozalandi. Qaytadan urinib ko\'ring.');
  };
  return (
    <div className="border border-cyan-500/50 bg-black/95 rounded p-4 font-mono text-xs my-2 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
      <div className="flex items-center justify-between border-b border-cyan-900/60 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <Icon name="security" className="text-[16px] text-cyan-300"/>
          <span className="font-bold text-cyan-200">PENETRATION ATTACK: {node.name}</span>
        </div>
        <div className="text-yellow-400 font-bold">MUKOFOT: +{node.reward} ₢</div>
      </div>
      <div className="mb-4">
        <div className="text-zinc-400 text-[11px] mb-1">KERAKLI BUFER SHIFRI:</div>
        <div className="flex items-center gap-2 flex-wrap bg-zinc-950 p-2 border border-zinc-800 rounded">
          {node.codePattern.map((hex, idx) => (
            <span
              key={idx}
              className="px-2 py-1 bg-zinc-900 border border-cyan-700/60 text-cyan-300 rounded font-bold text-xs"
            >
              {hex}
            </span>
          ))}
        </div>
      </div>
      <div className="mb-4">
        <div className="text-zinc-400 text-[11px] mb-1">SIZNING INYEKTSIYA QATORINGIZ:</div>
        <div className="flex items-center gap-2 flex-wrap min-h-[42px] bg-zinc-950 p-2 border border-zinc-800 rounded">
          {node.codePattern.map((_, idx) => (
            <span
              key={idx}
              className={`px-3 py-1 border rounded font-mono font-bold text-xs min-w-[50px] text-center ${
                selectedHexes[idx]
                  ? 'bg-cyan-950 border-cyan-400 text-cyan-200'
                  : 'bg-black/50 border-zinc-800 text-zinc-600'
              }`}
            >
              {selectedHexes[idx] || '__'}
            </span>
          ))}
        </div>
      </div>
      <div className="mb-4">
        <div className="text-zinc-400 text-[11px] mb-1">XOTIRADAGI HEX REGISTERLARI:</div>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {HEX_POOL.map((hex, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(hex)}
              disabled={selectedHexes.length >= node.codePattern.length}
              className="p-2 bg-zinc-900 hover:bg-cyan-900/40 border border-zinc-700 hover:border-cyan-400 text-zinc-200 hover:text-cyan-200 rounded font-mono text-center font-bold transition-all active:scale-95 disabled:opacity-40"
            >
              {hex}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-cyan-950 pt-3 text-[11px]">
        <div className="text-yellow-300 font-semibold">{statusMsg}</div>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded"
          >
            Tozalash
          </button>
          <button
            onClick={cancel}
            className="px-2.5 py-1 bg-red-950/60 hover:bg-red-900 border border-red-700 text-red-300 rounded"
          >
            Bekor qilish
          </button>
        </div>
      </div>
    </div>
  );
};
