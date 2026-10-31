import React, { useState, useEffect, useCallback } from 'react';
import { RogueEntity } from '../types';
interface GridMiniGameProps {
  onCollectReward: (credits: number, msg: string) => void;
  onExit: () => void;
}
const GRID_WIDTH = 28;
const GRID_HEIGHT = 12;
export const GridMiniGame: React.FC<GridMiniGameProps> = ({ onCollectReward, onExit }) => {
  const [player, setPlayer] = useState<{ x: number; y: number }>({ x: 2, y: 2 });
  const [entities, setEntities] = useState<RogueEntity[]>([]);
  const [message, setMessage] = useState<string>('Tugmalar: W, A, S, D yoki Yo\'nalish strelkalari bilan harakatlaning.');
  const [stepsLeft, setStepsLeft] = useState<number>(45);
  // Xarita yaratish
  useEffect(() => {
    const initialEntities: RogueEntity[] = [];
    // Keshlar (Data Caches)
    for (let i = 0; i < 4; i++) {
      initialEntities.push({
        x: Math.floor(Math.random() * (GRID_WIDTH - 4)) + 2,
        y: Math.floor(Math.random() * (GRID_HEIGHT - 4)) + 2,
        symbol: '◆',
        color: 'text-amber-400 font-bold animate-pulse',
        name: 'Kripto Kesh',
        type: 'cache'
      });
    }
    // Xavfli daemons
    for (let i = 0; i < 3; i++) {
      initialEntities.push({
        x: Math.floor(Math.random() * (GRID_WIDTH - 6)) + 3,
        y: Math.floor(Math.random() * (GRID_HEIGHT - 4)) + 2,
        symbol: '☠',
        color: 'text-red-500 font-bold',
        name: 'Xavfsizlik Daemoni',
        type: 'daemon'
      });
    }
    // Chiqish portali
    initialEntities.push({
      x: GRID_WIDTH - 3,
      y: GRID_HEIGHT - 3,
      symbol: 'Ω',
      color: 'text-cyan-400 font-bold',
      name: 'Extractor Portal',
      type: 'portal'
    });
    setEntities(initialEntities);
  }, []);
  const movePlayer = useCallback(
    (dx: number, dy: number) => {
      setPlayer((prev) => {
        const nx = Math.max(1, Math.min(GRID_WIDTH - 2, prev.x + dx));
        const ny = Math.max(1, Math.min(GRID_HEIGHT - 2, prev.y + dy));
        // Tekshirish
        const hitIndex = entities.findIndex((e) => e.x === nx && e.y === ny);
        if (hitIndex !== -1) {
          const item = entities[hitIndex];
          if (item.type === 'cache') {
            const reward = 120;
            onCollectReward(reward, `Kripto-kesh olindi! +${reward} ₢`);
            setMessage(`Topilma! Kripto-kesh buzildi: +${reward} ₢`);
            setEntities((list) => list.filter((_, idx) => idx !== hitIndex));
          } else if (item.type === 'daemon') {
            setMessage('Diqqat! Daemon hujum qildi: -15 Qadam yo\'qotildi!');
            setStepsLeft((s) => Math.max(0, s - 15));
          } else if (item.type === 'portal') {
            onCollectReward(300, 'Tizimdan muvaffaqiyatli chiqildi! Bonus +300 ₢');
            onExit();
          }
        }
        setStepsLeft((s) => {
          if (s <= 1) {
            setMessage('Vaqt tugadi! Tizim aloqani uzdi.');
            setTimeout(onExit, 1200);
            return 0;
          }
          return s - 1;
        });
        return { x: nx, y: ny };
      });
    },
    [entities, onCollectReward, onExit]
  );
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
  }, [movePlayer, onExit]);
  // Griddagi xonalarni chizish
  const rows = [];
  for (let y = 0; y < GRID_HEIGHT; y++) {
    const cols = [];
    for (let x = 0; x < GRID_WIDTH; x++) {
      const isWall = x === 0 || x === GRID_WIDTH - 1 || y === 0 || y === GRID_HEIGHT - 1;
      const isPlayer = player.x === x && player.y === y;
      const entity = entities.find((e) => e.x === x && e.y === y);
      if (isPlayer) {
        cols.push(
          <span key={x} className="text-emerald-300 font-extrabold bg-emerald-950/80 px-0.5 rounded shadow-[0_0_8px_#34d399]">
            @
          </span>
        );
      } else if (entity) {
        cols.push(
          <span key={x} className={`px-0.5 ${entity.color}`}>
            {entity.symbol}
          </span>
        );
      } else if (isWall) {
        cols.push(<span key={x} className="text-zinc-600">#</span>);
      } else {
        cols.push(<span key={x} className="text-zinc-800">·</span>);
      }
    }
    rows.push(
      <div key={y} className="leading-tight tracking-widest">
        {cols}
      </div>
    );
  }
  return (
    <div className="border border-emerald-500/50 bg-black/95 rounded p-4 font-mono text-xs my-2 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
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
