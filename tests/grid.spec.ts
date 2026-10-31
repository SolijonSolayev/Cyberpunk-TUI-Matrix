import {test, expect} from '@playwright/test';
import {createGrid, moveGrid, isGridWall, GRID_WIDTH, GRID_HEIGHT, GRID_START, GRID_PORTAL, GRID_STEPS} from '../lib/grid';

test('maze has internal walls and every item is reachable without overlapping', () => {
  for (const random of [() => 0, () => 0.5, () => 0.999]) {
    const game = createGrid(random);
    const seen = new Set<string>();
    const queue = [GRID_START];
    for (let i = 0; i < queue.length; i++) {
      const {x, y} = queue[i];
      if (isGridWall(x, y) || seen.has(`${x},${y}`)) continue;
      seen.add(`${x},${y}`);
      for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) queue.push({x: x + dx, y: y + dy});
    }
    expect(isGridWall(5, 2)).toBe(true);
    expect(isGridWall(5, GRID_HEIGHT - 3)).toBe(false);
    expect(game.entities.filter(e => e.type === 'cache')).toHaveLength(4);
    expect(game.entities.filter(e => e.type === 'daemon')).toHaveLength(3);
    expect(new Set(game.entities.map(e => `${e.x},${e.y}`)).size).toBe(8);
    for (const entity of game.entities) expect(seen.has(`${entity.x},${entity.y}`)).toBe(true);
    expect(seen.has(`${GRID_PORTAL.x},${GRID_PORTAL.y}`)).toBe(true);
    expect(seen.size).toBeLessThan((GRID_WIDTH - 2) * (GRID_HEIGHT - 2));
  }
});
test('walls stop movement; caches pay only once; daemons deduct 15 additional steps', () => {
  const game = createGrid(() => 0.5);
  const wall = moveGrid({...game, player: {x: 4, y: 2}}, 1, 0);
  expect(wall.game.player).toEqual({x: 4, y: 2});
  expect(wall.game.stepsLeft).toBe(GRID_STEPS);
  const cache = game.entities.find(e => e.type === 'cache')!;
  // A traversable neighbor exists for every reachable entity.
  const direction = [[1, 0], [-1, 0], [0, 1], [0, -1]].find(([dx, dy]) => !isGridWall(cache.x - dx, cache.y - dy))!;
  const [dx, dy] = direction;
  const reward = moveGrid({...game, player: {x: cache.x - dx, y: cache.y - dy}}, dx, dy);
  expect(reward.reward).toBe(120);
  expect(reward.game.entities).not.toContainEqual(cache);
  const again = moveGrid({...reward.game, player: {x: cache.x - dx, y: cache.y - dy}}, dx, dy);
  expect(again.reward).toBe(0);
  const daemon = game.entities.find(e => e.type === 'daemon')!;
  const delta = [[1, 0], [-1, 0], [0, 1], [0, -1]].find(([x, y]) => !isGridWall(daemon.x - x, daemon.y - y))!;
  const hit = moveGrid({...game, player: {x: daemon.x - delta[0], y: daemon.y - delta[1]}}, delta[0], delta[1]);
  expect(hit.game.stepsLeft).toBe(GRID_STEPS - 16);
});
test('portal pays once and exhausted runs cannot move or collect rewards', () => {
  const game = createGrid();
  const win = moveGrid({...game, player: {x: GRID_PORTAL.x - 1, y: GRID_PORTAL.y}}, 1, 0);
  expect(win.reward).toBe(300);
  expect(win.game.outcome).toBe('escaped');
  expect(moveGrid(win.game, 1, 0).reward).toBe(0);
  const expired = moveGrid({...game, stepsLeft: 1}, 1, 0);
  expect(expired.game.outcome).toBe('expired');
  expect(moveGrid(expired.game, 0, 1).game).toEqual(expired.game);
});
