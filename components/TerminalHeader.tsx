import React from 'react';
import { PlayerStats } from '../types';
interface TerminalHeaderProps {
  stats: PlayerStats;
  isMatrixRain: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onToggleMatrix: () => void;
  onOpenHelp: () => void;
  onOpenDownload: () => void;
}
export const TerminalHeader: React.FC<TerminalHeaderProps> = ({
  stats,
  isMatrixRain,
  soundEnabled,
  onToggleSound,
  onToggleMatrix,
  onOpenHelp,
  onOpenDownload
}) => {
  const heatColor = stats.cpuHeat > 75 ? 'text-red-400 font-bold animate-pulse' : stats.cpuHeat > 45 ? 'text-amber-400' : 'text-emerald-400';
  return (
    <div className="border-b-2 border-emerald-500/40 bg-black/90 px-4 py-2 text-xs font-mono text-emerald-400 select-none flex flex-wrap items-center justify-between gap-3 shadow-[0_4px_20px_rgba(16,185,129,0.15)]">
      <div className="flex items-center gap-4 flex-wrap">
        <span className="flex items-center gap-1.5 text-emerald-300">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="font-bold tracking-wider">[SYS_ACTIVE]</span>
        </span>
        <span className="text-zinc-500">|</span>
        <span>
          USER: <strong className="text-emerald-200">@{stats.handle}</strong> (LVL {stats.level})
        </span>
        <span className="text-zinc-500">|</span>
        <span>
          CREDITS: <strong className="text-yellow-400">{stats.credits} ₢</strong>
        </span>
        <span className="text-zinc-500">|</span>
        <span>
          RAM: <strong className="text-cyan-300">{stats.ram}/{stats.maxRam} MB</strong>
        </span>
        <span className="text-zinc-500">|</span>
        <span>
          CPU TEMP: <strong className={heatColor}>{stats.cpuHeat}°C</strong>
        </span>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={onToggleSound}
          aria-label="Audio effektlar"
          aria-pressed={soundEnabled}
          className="px-2 py-1 rounded text-[11px] border border-emerald-700 text-emerald-300 hover:bg-emerald-950 flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[14px]">{soundEnabled ? 'volume_up' : 'volume_off'}</span>
          SOUND: {soundEnabled ? 'ON' : 'OFF'}
        </button>
        <button
          onClick={onOpenDownload}
          className="px-2.5 py-1 rounded text-[11px] border border-cyan-500/80 bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 transition-all flex items-center gap-1 shadow-[0_0_12px_rgba(6,182,212,0.3)] font-bold animate-pulse"
          title="Dasturning to'liq kodini yuklab olish"
        >
          <span className="material-symbols-outlined text-[14px]">download</span>
          KODNI YUKLAB OLISH
        </button>
        <button
          onClick={onToggleMatrix}
          className={`px-2 py-1 rounded text-[11px] border transition-all flex items-center gap-1 ${
            isMatrixRain
              ? 'border-emerald-400 bg-emerald-950 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.4)]'
              : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-emerald-600 hover:text-emerald-300'
          }`}
          title="Matritsa yomg'iri"
        >
          <span className="material-symbols-outlined text-[14px]">terminal</span>
          MATRIX: {isMatrixRain ? 'ON' : 'OFF'}
        </button>
        <button
          onClick={onOpenHelp}
          className="px-2.5 py-1 rounded text-[11px] border border-emerald-600/60 bg-emerald-950/40 hover:bg-emerald-800/40 text-emerald-300 transition-all flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[14px]">help</span>
          KOMANDALAR
        </button>
      </div>
    </div>
  );
};
