export type GameMode = 'STORY' | 'HACKING' | 'ROGUE_GRID' | 'AI_ORACLE' | 'STATUS';
export interface PlayerStats {
  handle: string;
  level: number;
  credits: number;
  ram: number;
  maxRam: number;
  cpuHeat: number; // 0 - 100%
  cryptoKeys: number;
  firmwareVersion: string;
  cyberDecks: string[];
  reputation: number;
}
export interface TerminalLog {
  id: string;
  timestamp: string;
  type: 'system' | 'input' | 'output' | 'error' | 'success' | 'warning' | 'story' | 'ai';
  text: string;
}
export interface RogueEntity {
  x: number;
  y: number;
  symbol: string;
  color: string;
  name: string;
  type: 'player' | 'daemon' | 'cache' | 'firewall' | 'portal';
  hp?: number;
}
export interface HackNode {
  id: string;
  name: string;
  ip: string;
  securityLevel: number;
  solved: boolean;
  codePattern: string[];
  reward: number;
}
