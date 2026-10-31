export const ASCII_HEADER = `
 ██████╗██╗   ██╗██████╗ ███████╗██████╗ ███╗   ██╗███████╗████████╗
██╔════╝╚██╗ ██╔╝██╔══██╗██╔════╝██╔══██╗████╗  ██║██╔════╝╚══██╔══╝
██║      ╚████╔╝ ██████╔╝█████╗  ██████╔╝██╔██╗ ██║█████╗     ██║   
██║       ╚██╔╝  ██╔══██╗██╔══╝  ██╔══██╗██║╚██╗██║██╔══╝     ██║   
╚██████╗   ██║   ██████╔╝███████╗██║  ██║██║ ╚████║███████╗   ██║   
 ╚═════╝   ╚═╝   ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝╚══════╝   ╚═╝   
    >> CYBER-OS v4.19.0-KERNEL-Z // SECURE SANDBOX PROTOCOL <<
`;
export const HELP_COMMANDS = [
  { cmd: 'help', desc: 'Barcha mavjud TUI buyruqlarini ko\'rsatish' },
  { cmd: 'download', desc: 'Dasturning barcha manba kodlarini (ZIP yoki fayl) to\'g\'ridan-to\'g\'ri yuklab olish' },
  { cmd: 'scan', desc: 'Tarmoqdagi yashirin korporativ serverlarni skanerlash' },
  { cmd: 'hack <IP>', desc: 'Nishon tugunga qarshi penetratsion hujum boshlash' },
  { cmd: 'grid', desc: 'Interaktiv 2D Cyber-Grid rogue mini-o\'yinini ishga tushirish' },
  { cmd: 'oracle <savol>', desc: 'Kiber-sun\'iy intellekt (AI Core) bilan to\'g\'ridan-to\'g\'ri muloqot' },
  { cmd: 'status', desc: 'Sizning kiber-deck apparatingiz va RAM holatini tekshirish' },
  { cmd: 'cool', desc: 'CPU qizishini pasaytirish va keshni tozalash' },
  { cmd: 'upgrade', desc: 'Credits evaziga RAM va dasturiy ta\'minotni kuchaytirish' },
  { cmd: 'matrix', desc: 'Matritsa yomg\'iri vizual rejimini yoqish/o\'chirish' },
  { cmd: 'clear', desc: 'Terminal ekranini tozalash' }
];
export const INITIAL_NODES = [
  {
    id: 'node-1',
    name: 'ARASAKA_CACHE_PROXY',
    ip: '192.168.4.102',
    securityLevel: 1,
    solved: false,
    codePattern: ['0xAA', '0x1F', '0x7C'],
    reward: 250
  },
  {
    id: 'node-2',
    name: 'NEO_TASHKENT_POWER_GRID',
    ip: '10.200.88.19',
    securityLevel: 2,
    solved: false,
    codePattern: ['0xDE', '0xAD', '0xBE', '0xEF'],
    reward: 600
  },
  {
    id: 'node-3',
    name: 'QUANTUM_BLACK_VAULT',
    ip: '172.31.99.255',
    securityLevel: 3,
    solved: false,
    codePattern: ['0xFF', '0x00', '0x42', '0x99', '0x3A'],
    reward: 1500
  }
];
export const APP_SOURCE_CODE: Record<string, string> = {
  'types.ts': `export type GameMode = 'STORY' | 'HACKING' | 'ROGUE_GRID' | 'AI_ORACLE' | 'STATUS';
export interface PlayerStats {
  handle: string;
  level: number;
  credits: number;
  ram: number;
  maxRam: number;
  cpuHeat: number;
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
`,
  'constants.ts': `// Constants va sozlamalar fayli`,
  'components/TerminalHeader.tsx': `// Terminal Header komponenti`,
  'components/MatrixRainCanvas.tsx': `// Matrix Rain Canvas komponenti`,
  'components/GridMiniGame.tsx': `// Grid Roguelike Mini-o'yin komponenti`,
  'components/HackingPuzzle.tsx': `// Hex Buffer inyeksiya jumboq komponenti`,
  'components/HelpModal.tsx': `// Buyruqlar yordam oynasi`,
  'components/DownloadModal.tsx': `// Kodni ko'rish, nusxalash va yuklab olish oynasi`,
  'App.tsx': `// Asosiy dastur komponenti`
};
