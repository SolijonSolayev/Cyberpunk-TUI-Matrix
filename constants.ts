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
  { cmd: 'whoami', desc: 'Agent identifikatori, darajasi va reputatsiyasi' },
  { cmd: 'history', desc: 'Oxirgi 20 ta terminal buyrug‘i' },
  { cmd: 'uptime', desc: 'Joriy sessiya davomiyligi' },
  { cmd: 'probe <IP>', desc: 'O‘yin nishonining himoyasi, mukofoti va bufer uzunligi' },
  { cmd: 'tools', desc: 'Xakerlik qurollari inventari va tayyorlangan EMP' },
  { cmd: 'shop', desc: 'Qurollar narxi, RAM talabi va imkoniyatlari' },
  { cmd: 'buy <qurol>', desc: 'decryptor (90₢), emp (120₢), coolant (60₢) sotib olish' },
  { cmd: 'use <qurol> [IP]', desc: 'use decryptor <IP>, use emp yoki use coolant' },
  { cmd: 'sound on', desc: 'Audio effektlarni yoqish (sound off bilan o‘chirish)' },
  { cmd: 'sound volume 20', desc: 'Ovoz balandligini 0–100 oralig‘ida sozlash' },
  { cmd: 'sound test', desc: 'Audio yoqilgan bo‘lsa namuna ovozini eshitish' },
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
