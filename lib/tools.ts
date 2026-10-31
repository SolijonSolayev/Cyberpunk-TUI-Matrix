import type {PlayerStats} from '../types';

export const TOOL_IDS = ['decryptor', 'emp', 'coolant'] as const;
export type ToolId = typeof TOOL_IDS[number];
export type Inventory = Record<ToolId, number>;
export const INITIAL_INVENTORY: Inventory = {decryptor: 1, emp: 1, coolant: 1};
export const TOOLS = {
  decryptor: {name: 'HEX Decryptor', price: 90, ramCost: 12, description: 'Bitta hack urinishida birinchi HEX kodini avtomatik kiritadi.'},
  emp: {name: 'EMP Pulse', price: 120, ramCost: 18, description: 'Keyingi grid o‘yinida bitta daemonni o‘chiradi (3 → 2).'},
  coolant: {name: 'Cryo Patch', price: 60, ramCost: 0, description: 'CPU −35°C (kamida 22°C), RAM +24 MB (maksimumgacha).'}
} satisfies Record<ToolId, {name: string; price: number; ramCost: number; description: string}>;

export function isToolId(value: string): value is ToolId {
  return TOOL_IDS.some(id => id === value);
}
type ToolResult = {ok: true; stats: PlayerStats; inventory: Inventory; message: string} | {ok: false; message: string};

export function buyTool(stats: PlayerStats, inventory: Inventory, id: ToolId): ToolResult {
  const tool = TOOLS[id];
  if (inventory[id] >= 99) return {ok: false, message: 'Bu quroldan ko‘pi bilan 99 ta saqlanadi.'};
  if (stats.credits < tool.price) return {ok: false, message: `${tool.name} uchun ${tool.price} ₢ kerak.`};
  return {ok: true, stats: {...stats, credits: stats.credits - tool.price},
    inventory: {...inventory, [id]: inventory[id] + 1}, message: `${tool.name} olindi. −${tool.price} ₢`};
}

export function consumeTool(stats: PlayerStats, inventory: Inventory, id: ToolId): ToolResult {
  const tool = TOOLS[id];
  if (inventory[id] < 1) return {ok: false, message: `${tool.name} tugagan. "buy ${id}" bilan oling.`};
  if (stats.ram < tool.ramCost) return {ok: false, message: `${tool.name} uchun ${tool.ramCost} MB RAM kerak. "use coolant" bilan tiklang.`};
  const updated = {...stats, ram: stats.ram - tool.ramCost};
  if (id === 'coolant') {
    updated.cpuHeat = Math.max(22, stats.cpuHeat - 35);
    updated.ram = Math.min(stats.maxRam, stats.ram + 24);
  }
  return {ok: true, stats: updated, inventory: {...inventory, [id]: inventory[id] - 1}, message: `${tool.name} ishlatildi.`};
}
