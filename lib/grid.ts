import type {RogueEntity} from '../types';

export const GRID_WIDTH = 28;
export const GRID_HEIGHT = 12;
export const GRID_STEPS = 100;
export const GRID_START = {x: 2, y: 2};
export const GRID_PORTAL = {x: GRID_WIDTH - 3, y: GRID_HEIGHT - 3};
export interface GridState {
  player: {x: number; y: number};
  entities: RogueEntity[];
  stepsLeft: number;
  message: string;
  outcome: 'active' | 'escaped' | 'expired';
}

export function isGridWall(x: number, y: number) {
  if (x <= 0 || x >= GRID_WIDTH - 1 || y <= 0 || y >= GRID_HEIGHT - 1) return true;
  // Alternating passages form one connected maze, including the exit.
  return x % 5 === 0 && x <= GRID_WIDTH - 8 && y !== (x % 10 === 5 ? GRID_HEIGHT - 3 : 2);
}

export function createGrid(random = Math.random): GridState {
  const spaces: {x: number; y: number}[] = [];
  for (let y = 1; y < GRID_HEIGHT - 1; y++) {
    for (let x = 1; x < GRID_WIDTH - 1; x++) {
      if (!isGridWall(x, y) && !(x === GRID_PORTAL.x && y === GRID_PORTAL.y) &&
          !(Math.abs(x - GRID_START.x) + Math.abs(y - GRID_START.y) <= 1)) spaces.push({x, y});
    }
  }
  for (let i = spaces.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [spaces[i], spaces[j]] = [spaces[j], spaces[i]];
  }
  const entities: RogueEntity[] = spaces.slice(0, 7).map((position, i) => ({
    ...position,
    symbol: i < 4 ? '◆' : '☠',
    color: i < 4 ? 'text-amber-400 font-bold' : 'text-red-500 font-bold',
    name: i < 4 ? 'Kripto Kesh' : 'Xavfsizlik Daemoni',
    type: i < 4 ? 'cache' : 'daemon'
  }));
  entities.push({...GRID_PORTAL, symbol: 'Ω', color: 'text-cyan-400 font-bold', name: 'Extractor Portal', type: 'portal'});
  return {player: {...GRID_START}, entities, stepsLeft: GRID_STEPS, outcome: 'active',
    message: 'WASD yoki strelkalar: harakat. Devorlardan o‘ting, Ω portaliga yeting. ESC: chiqish.'};
}

export function moveGrid(game: GridState, dx: number, dy: number) {
  const unchanged = {game, reward: 0, event: ''};
  if (game.outcome !== 'active' || Math.abs(dx) + Math.abs(dy) !== 1) return unchanged;
  const player = {x: game.player.x + dx, y: game.player.y + dy};
  if (isGridWall(player.x, player.y)) {
    return {...unchanged, game: {...game, message: 'Bu yo‘l devor bilan to‘silgan. Boshqa yo‘lakni tanlang.'}};
  }
  const item = game.entities.find(entity => entity.x === player.x && entity.y === player.y);
  let reward = 0;
  let event = '';
  let message = 'Yo‘lak bo‘ylab harakatlaning. Ω portaliga yeting.';
  let entities = game.entities;
  let outcome: GridState['outcome'] = 'active';
  const stepsLeft = Math.max(0, game.stepsLeft - 1 - (item?.type === 'daemon' ? 15 : 0));
  if (item?.type === 'cache') {
    reward = 120;
    event = message = 'Kripto-kesh olindi! +120 ₢';
    entities = entities.filter(entity => entity !== item);
  } else if (item?.type === 'daemon') {
    message = 'Daemon hujumi: -15 qadam! Boshqa yo‘lakdan yuring.';
  } else if (item?.type === 'portal') {
    reward = 300;
    event = message = 'Tizimdan muvaffaqiyatli chiqildi! Bonus +300 ₢';
    outcome = 'escaped';
  }
  if (outcome !== 'escaped' && stepsLeft === 0) {
    outcome = 'expired';
    message = 'Qadamlar tugadi! Tizim aloqani uzdi.';
  }
  return {game: {player, entities, stepsLeft, outcome, message}, reward, event};
}
