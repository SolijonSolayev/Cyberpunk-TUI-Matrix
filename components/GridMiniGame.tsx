import React, { useState, useEffect, useCallback, useRef } from 'react';
import {createGrid, moveGrid, isGridWall, GRID_WIDTH, GRID_HEIGHT} from '../lib/grid';
interface GridMiniGameProps {
  onCollectReward: (credits: number, msg: string) => void;
  onExit: () => void;
  paused?: boolean;
}
export const GridMiniGame: React.FC<GridMiniGameProps> = ({ onCollectReward, onExit, paused = false }) => {
  const [game, setGame] = useState(createGrid);
  const gameRef = useRef(game);
  const {player, entities, message, stepsLeft} = game;
  const movePlayer = useCallback((dx: number, dy: number) => {
    if (paused || gameRef.current.outcome !== 'active') return;
    const result = moveGrid(gameRef.current, dx, dy);
    gameRef.current = result.game;
    setGame(result.game);
    // Rewards occur once, outside React state updater callbacks.
    if (result.reward) onCollectReward(result.reward, result.event);
    if (result.game.outcome === 'escaped') onExit();
  }, [onCollectReward, onExit, paused]);
  useEffect(() => {
    if (game.outcome !== 'expired') return;
    const timer = window.setTimeout(onExit, 1200);
    return () => window.clearTimeout(timer);
  }, [game.outcome, onExit]);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (paused) return;
      if (['ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        movePlayer(0, -1);
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        e.preventDefault();
        movePlayer(0, 1);
      } else if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        e.preventDefault();
        movePlayer(-1, 0);
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        movePlayer(1, 0);
      } else if (e.code === 'Escape') {
        onExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [movePlayer, onExit, paused]);
  // Griddagi xonalarni chizish
  const rows = [];
  for (let y = 0; y < GRID_HEIGHT; y++) {
    const cols = [];
    for (let x = 0; x < GRID_WIDTH; x++) {
      const isWall = isGridWall(x, y);
      const isPlayer = player.x === x && player.y === y;
      const entity = entities.find((e) => e.x === x && e.y === y);
      if (isPlayer) {
        cols.push(
          <span key={x} className="inline-block w-[1.2em] text-center text-emerald-300 font-extrabold bg-emerald-950/80 rounded shadow-[0_0_8px_#34d399]">
            @
          </span>
        );
      } else if (entity) {
        cols.push(
          <span key={x} className={`inline-block w-[1.2em] text-center ${entity.color}`}>
            {entity.symbol}
          </span>
        );
      } else if (isWall) {
        cols.push(<span key={x} className="inline-block w-[1.2em] text-center text-zinc-600">#</span>);
      } else {
        cols.push(<span key={x} className="inline-block w-[1.2em] text-center text-zinc-800">·</span>);
      }
    }
    rows.push(
      <div key={y} data-grid-row={y} className="leading-tight tracking-widest whitespace-nowrap">
        {cols}
      </div>
    );
  }
  return (
    <div aria-label="Kiber-labirint" role="region" className="border border-emerald-500/50 bg-black/95 rounded p-4 font-mono text-xs my-2 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
      <div className="flex items-center justify-between border-b border-emerald-800/60 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-cyan-400">grid_view</span>
          <span className="font-bold text-cyan-300">ROGUELIKE GRID PROTOCOL [LEVEL 1]</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-yellow-400 font-bold">QADAMLAR: {stepsLeft}</span>
          <button
            onClick={onExit}
            className="text-red-400 hover:text-red-300 border border-red-500/40 px-2 py-0.5 rounded text-[11px]"
          >
            [ESC] Chiqish
          </button>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center p-2 bg-zinc-950/90 border border-zinc-800 rounded font-mono select-none overflow-x-auto">
        {rows}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between text-[11px] text-zinc-400 gap-2">
        <div className="flex items-center gap-3">
          <span className="text-emerald-400">@ Siz</span>
          <span className="text-amber-400">◆ Kripto Kesh (+120₢)</span>
          <span className="text-red-500">☠ Daemon (-15)</span>
          <span className="text-cyan-400">Ω Chiqish (+300₢)</span>
        </div>
        <div className="text-emerald-300 italic">{message}</div>
      </div>
      <div className="mt-3 grid grid-cols-3 max-w-[150px] mx-auto gap-1 text-center md:hidden">
        <div />
        <button
          onClick={() => movePlayer(0, -1)}
          className="bg-zinc-800 border border-zinc-700 py-1 rounded text-white"
        >
          ▲
        </button>
        <div />
        <button
          onClick={() => movePlayer(-1, 0)}
          className="bg-zinc-800 border border-zinc-700 py-1 rounded text-white"
        >
          ◀
        </button>
        <button
          onClick={() => movePlayer(0, 1)}
          className="bg-zinc-800 border border-zinc-700 py-1 rounded text-white"
        >
          ▼
        </button>
        <button
          onClick={() => movePlayer(1, 0)}
          className="bg-zinc-800 border border-zinc-700 py-1 rounded text-white"
        >
          ▶
        </button>
      </div>
    </div>
  );
};
