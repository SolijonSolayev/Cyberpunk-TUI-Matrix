import {DarkGradientBg} from '@/components/ui/elegant-dark-pattern';
import {Icon} from './components/Icon';
import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { askOracle, type OracleMessage } from './lib/oracle';
import { PlayerStats, TerminalLog, HackNode } from './types';
import { ASCII_HEADER, INITIAL_NODES, HELP_COMMANDS } from './constants';
import { TerminalHeader } from './components/TerminalHeader';
import { MatrixRainCanvas } from './components/MatrixRainCanvas';
import { GridMiniGame } from './components/GridMiniGame';
import { HackingPuzzle } from './components/HackingPuzzle';
import { HelpModal } from './components/HelpModal';
const DownloadModal = lazy(() => import('./components/DownloadModal').then(module => ({default: module.DownloadModal})));
import {TerminalAudio} from './lib/audio';
import {TOOLS, TOOL_IDS, INITIAL_INVENTORY, isToolId, buyTool, consumeTool} from './lib/tools';
// Kiberpank oflayn lokal javoblar bazasi (server vaqtincha band yoki uzilgan holatda)
const OFFLINE_ORACLE_RESPONSES = [
  '>> [KESH-JAVOB]: Neyron magistrallarida ma\'lumotlar oqimi haddan tashqari zich. Kiber-matritsa taxmini: Kelajak korporatsiyalar emas, balki shifrlangan tarmoq erkinligi qo\'lida bo\'ladi.',
  '>> [KESH-JAVOB]: Kvant shifrlari tahlil qilindi. Protokol: Doimo kiber-deck xotirangizni toza tuting va begona tugunlarga ruxsatsiz ulanmang.',
  '>> [KESH-JAVOB]: Neo-Toshkent sun\'iy intellekt arxivi: Texnologiya insoniyat ongini kengaytirishi mumkin, ammo qalb kodini hech qanday kvant mashinasi o\'zgartira olmaydi.',
  '>> [KESH-JAVOB]: Aloqa uzilishi fonida lokal AI yadro javobi: Siz qidirayotgan haqiqat tarmoqning eng chuqur shifrlangan qatlamlarida yashiringan.'
];
const BrowserWorkspace = lazy(() => import('./components/BrowserWorkspace'));
function awardReputation(stats: PlayerStats, points: number): PlayerStats {
  const reputation = Math.min(100, stats.reputation + points);
  return {...stats, reputation, level: stats.level + Math.floor(reputation / 20) - Math.floor(stats.reputation / 20)};
}
export default function App() {
  const [stats, setStats] = useState<PlayerStats>({
    handle: 'CYBER_GHOST',
    level: 1,
    credits: 350,
    ram: 64,
    maxRam: 128,
    cpuHeat: 34,
    cryptoKeys: 1,
    firmwareVersion: 'v4.19.0-k',
    cyberDecks: ['Onyx Neural Deck v1'],
    reputation: 15
  });
  const [logs, setLogs] = useState<TerminalLog[]>([
    {
      id: 'log-0',
      timestamp: '00:00:01',
      type: 'system',
      text: ASCII_HEADER
    },
    {
      id: 'log-1',
      timestamp: '00:00:02',
      type: 'story',
      text: '>> Xush kelibsiz, Agent! Siz hozirda xavfsiz neyron TUI terminalidasiz.\n>> Dastur kodlarini yuklab olish uchun "download" deb yozing yoki yuqoridagi "KODNI YUKLAB OLISH" tugmasini bosing!\n>> Boshlash uchun "help" yozing.'
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [workspaceOpened, setWorkspaceOpened] = useState(false);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const openWorkspace = () => {setWorkspaceOpened(true); setIsWorkspaceOpen(true);};
  const [inventory, setInventory] = useState({...INITIAL_INVENTORY});
  const [empArmed, setEmpArmed] = useState(false);
  const [gridEmp, setGridEmp] = useState(false);
  const [decryptorNode, setDecryptorNode] = useState<string | null>(null);
  const [hackSession, setHackSession] = useState(0);
  const [audio] = useState(() => new TerminalAudio());
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [soundVolume, setSoundVolume] = useState(20);
  const soundRequest = useRef(0);
  const sessionStarted = useRef(Date.now());
  useEffect(() => () => audio.dispose(), [audio]);
  const [nodes, setNodes] = useState<HackNode[]>(INITIAL_NODES);
  const [activeHackNode, setActiveHackNode] = useState<HackNode | null>(null);
  const [isGridActive, setIsGridActive] = useState(false);
  const [isMatrixRain, setIsMatrixRain] = useState(true);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const logsEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const commandHistory = useRef<string[]>([]);
  const historyIndex = useRef(0);
  const historyDraft = useRef('');
  const oracleHistory = useRef<OracleMessage[]>([]);
  const oraclePending = useRef(false);
  useEffect(() => {
    if (!isGridActive && !isHelpOpen && !isDownloadOpen && !isWorkspaceOpen) inputRef.current?.focus();
  }, [isGridActive, isHelpOpen, isDownloadOpen, isWorkspaceOpen]);
  useEffect(() => {
    const closeOverlay = (event: KeyboardEvent) => {
      if (isWorkspaceOpen || event.key !== 'Escape') return;
      if (isDownloadOpen) setIsDownloadOpen(false);
      else if (isHelpOpen) setIsHelpOpen(false);
    };
    window.addEventListener('keydown', closeOverlay);
    return () => window.removeEventListener('keydown', closeOverlay);
  }, [isHelpOpen, isDownloadOpen, isWorkspaceOpen]);
  // Global unhandled promise rejection hodisalarini ushlash
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.warn('Unhandled rejection captured:', event.reason);
      event.preventDefault();
      addLog(`[TIZIM OGOHLANTIRISHI]: Aloqa xatosi ushlandi (${event.reason?.message || 'Xizmat vaqtincha band'}). Tizim barqaror ishlamoqda.`, 'warning');
    };
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);
  // Avtomatik pastga aylantirish
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, activeHackNode, isGridActive]);
  // Terminalni fokusda saqlash
  const focusInput = (event: React.MouseEvent<HTMLElement>) => {
    if (isWorkspaceOpen || isGridActive || isHelpOpen || isDownloadOpen ||
        (event.target as HTMLElement).closest('button, input, a')) return;
    inputRef.current?.focus();
  };
  const addLog = (text: string, type: TerminalLog['type'] = 'output') => {
    if (type === 'success' || type === 'error' || type === 'warning') audio.play(type);
    const time = new Date().toTimeString().split(' ')[0];
    setLogs((prev) => [
      ...prev,
      {
        id: `log-${Date.now()}-${Math.random()}`,
        timestamp: time,
        type,
        text
      }
    ]);
  };
  const setSound = async (enabled: boolean) => {
    const request = ++soundRequest.current;
    if (!enabled) {
      audio.disable(); setSoundEnabled(false);
      addLog('Audio effektlar: O‘CHIRILDI.', 'system');
      return;
    }
    const ready = await audio.enable();
    if (request !== soundRequest.current) return;
    setSoundEnabled(ready);
    addLog(ready ? `Audio effektlar: YOQILDI. Ovoz: ${soundVolume}%.` : 'Brauzer audio chiqishini ocholmadi. Ovoz tugmasini yana bosing.', ready ? 'success' : 'error');
  };
  // Buyruqlarni bajarish mexanizmi
  const executeCommand = async (rawCmd: string) => {
    const trimmed = rawCmd.trim();
    if (!trimmed) return;
    audio.play('command');
    commandHistory.current = [...commandHistory.current, trimmed].slice(-100);
    historyIndex.current = commandHistory.current.length;
    historyDraft.current = '';
    addLog(`$ ${trimmed}`, 'input');
    const [command, ...args] = trimmed.split(/\s+/);
    const cmd = command.toLowerCase();
    const cpuHeat = cmd === 'cool' ? Math.max(22, stats.cpuHeat - 25) : Math.min(100, stats.cpuHeat + 3);
    setStats(s => ({...s, cpuHeat}));
    switch (cmd) {
      case 'download': {
        setIsDownloadOpen(true);
        addLog('>> Manba kodlari ombori ochilmoqda... Fayllarni ZIP ko\'rinishida yuklab olishingiz mumkin.', 'success');
        break;
      }
      case 'help': {
        addLog('Mavjud buyruqlar:\n' + HELP_COMMANDS.map(item => `• ${item.cmd.padEnd(20)} - ${item.desc}`).join('\n'), 'system');
        break;
      }
      case 'terminal':
      case 'lab': {
        openWorkspace();
        break;
      }
      case 'whoami': {
        addLog(`Agent: @${stats.handle} | Daraja: ${stats.level} | Reputatsiya: ${stats.reputation}/100`, 'system');
        break;
      }
      case 'history': {
        const start = Math.max(0, commandHistory.current.length - 20);
        addLog('BUYRUQLAR TARIXI:\n' + commandHistory.current.slice(start).map((line, i) => `${start + i + 1}. ${line}`).join('\n'), 'system');
        break;
      }
      case 'uptime': {
        const seconds = Math.floor((Date.now() - sessionStarted.current) / 1000);
        addLog(`SESSIYA: ${Math.floor(seconds / 60)} daqiqa ${seconds % 60} soniya.`, 'system');
        break;
      }
      case 'probe': {
        const target = nodes.find(node => node.ip === args[0]);
        if (!target) { addLog('Nishon topilmadi. "probe <IP>" uchun scan ro‘yxatidagi IP ni kiriting.', 'error'); break; }
        audio.play('scan');
        addLog(`NISHON TAHLILI: ${target.name}\nIP: ${target.ip}\nHimoya: LVL ${target.securityLevel}\nHEX buferi: ${target.codePattern.length} ta kod\nMukofot: ${target.reward} ₢\nHolat: ${target.solved ? 'BUZILGAN' : 'HIMOYALANGAN'}\nYordamchi: use decryptor ${target.ip}`, 'system');
        break;
      }
      case 'tools':
      case 'inventory': {
        addLog('XAKERLIK INVENTARI:\n' + TOOL_IDS.map(id => `${id.padEnd(12)} ×${inventory[id]} — ${TOOLS[id].name}`).join('\n') +
          `\nEMP: ${empArmed ? 'TAYYOR — keyingi grid uchun' : 'tayyorlanmagan'}\nIshlatish: use decryptor <IP> | use emp | use coolant`, 'system');
        break;
      }
      case 'shop': {
        addLog('KIBER-QUROLLAR DO‘KONI:\n' + TOOL_IDS.map(id => `${id} — ${TOOLS[id].price} ₢, ${TOOLS[id].ramCost} MB RAM\n  ${TOOLS[id].description}`).join('\n') +
          `\nMablag‘: ${stats.credits} ₢. Sotib olish: buy <qurol>`, 'system');
        break;
      }
      case 'buy': {
        const id = args[0];
        if (!isToolId(id) || args.length !== 1) { addLog('Ishlatish: buy decryptor | buy emp | buy coolant', 'error'); break; }
        const result = buyTool({...stats, cpuHeat}, inventory, id);
        if (!result.ok) { addLog(result.message, 'error'); break; }
        setStats(result.stats); setInventory(result.inventory);
        addLog(result.message, 'success');
        break;
      }
      case 'use': {
        const id = args[0];
        if (!isToolId(id) || args.length !== (id === 'decryptor' ? 2 : 1)) {
          addLog('Ishlatish: use decryptor <IP> | use emp | use coolant', 'error'); break;
        }
        const target = id === 'decryptor' ? nodes.find(node => node.ip === args[1]) : undefined;
        if (id === 'decryptor' && (!target || target.solved)) {
          addLog('Buzilmagan o‘yin nishonini kiriting. "scan" ro‘yxatini tekshiring.', 'error'); break;
        }
        if (id === 'decryptor' && activeHackNode?.id === target?.id && decryptorNode === target?.id) {
          addLog('Bu urinish uchun decryptor allaqachon ishlatilgan.', 'warning'); break;
        }
        if (id === 'emp' && (empArmed || isGridActive)) {
          addLog('EMP keyingi labirint uchun tayyorlangan yoki grid hozir faol.', 'warning'); break;
        }
        const result = consumeTool({...stats, cpuHeat}, inventory, id);
        if (!result.ok) { addLog(result.message, 'error'); break; }
        setStats(result.stats); setInventory(result.inventory);
        if (id === 'decryptor' && target) {
          setDecryptorNode(target.id); setHackSession(value => value + 1); setActiveHackNode(target);
          addLog(`Decryptor ${target.name} buferining birinchi HEX kodini kiritdi. −12 MB RAM.`, 'success');
        } else if (id === 'emp') {
          setEmpArmed(true);
          addLog('EMP tayyor! Keyingi grid o‘yinida daemonlar 3 → 2. −18 MB RAM.', 'success');
        } else {
          addLog(`Cryo Patch: CPU ${result.stats.cpuHeat}°C, RAM ${result.stats.ram}/${result.stats.maxRam} MB.`, 'success');
        }
        break;
      }
      case 'sound': {
        if (!args.length) { addLog(`AUDIO: ${soundEnabled ? 'ON' : 'OFF'} | Ovoz: ${soundVolume}%. Buyruqlar: sound on/off, sound volume 0–100, sound test.`, 'system'); break; }
        if (args[0] === 'on' && args.length === 1) await setSound(true);
        else if (args[0] === 'off' && args.length === 1) await setSound(false);
        else if (args[0] === 'volume' && args.length === 2 && args[1].trim() !== '' && Number.isFinite(Number(args[1])) && Number(args[1]) >= 0 && Number(args[1]) <= 100) {
          const volume = Number(args[1]); audio.setVolume(volume); setSoundVolume(volume);
          addLog(`Ovoz balandligi: ${volume}%.`, 'system');
        } else if (args[0] === 'test' && args.length === 1) {
          if (soundEnabled) { audio.play('success'); addLog('Audio namuna ijro etildi.', 'system'); }
          else addLog('Avval "sound on" bilan ovozni yoqing.', 'warning');
        } else addLog('Ishlatish: sound on | sound off | sound volume 0–100 | sound test', 'error');
        break;
      }
      case 'clear': {
        setLogs([]);
        break;
      }
      case 'matrix': {
        setIsMatrixRain((prev) => !prev);
        addLog(`Matritsa fon rejimi o'zgartirildi: ${!isMatrixRain ? 'YOQILDI' : 'O\'CHIRILDI'}`);
        break;
      }
      case 'cool': {
        addLog('>> Kriogen sovutgich ishga tushirildi. CPU harorati normallashdi.', 'success');
        break;
      }
      case 'status': {
        addLog(
          `=== [KIBER-DECK STATUSI] ===\n` +
          `Foydalanuvchi: @${stats.handle}\n` +
          `Daraja: ${stats.level}\n` +
          `Mablag': ${stats.credits} ₢ (Kiber-kripto)\n` +
          `Operativ xotira (RAM): ${stats.ram} MB / ${stats.maxRam} MB\n` +
          `CPU harorati: ${cpuHeat}°C\n` +
          `Dastur versiyasi: ${stats.firmwareVersion}\n` +
          `Reputatsiya darajasi: ${stats.reputation} / 100\n` +
          `Jihozlar: ${stats.cyberDecks.join(', ')}`,
          'system'
        );
        break;
      }
      case 'upgrade': {
        if (stats.credits < 300) {
          addLog('XATOLIK: Yangilash uchun kamida 300 ₢ kerak! Serverlarni buzib pul toping.', 'error');
        } else {
          setStats((s) => ({
            ...s,
            credits: s.credits - 300,
            maxRam: s.maxRam + 64,
            ram: s.ram + 32,
            level: s.level + 1
          }));
          addLog('>> YANGILANISH YAKUNLANDI! Maksimal RAM +64MB ga oshirildi, Daraja +1.', 'success');
        }
        break;
      }
      case 'scan': {
        audio.play('scan');
        addLog('>> Tarmoq lokal chastotalari skanerlanmoqda...', 'system');
        setTimeout(() => {
          const list = nodes
            .map(
              (n) =>
                `[${n.solved ? 'BUZILGAN ✓' : 'HIMOYA'}] ${n.name.padEnd(25)} IP: ${n.ip.padEnd(16)} XAVF: LVL ${n.securityLevel} MUKOFOT: +${n.reward}₢`
            )
            .join('\n');
          addLog(`Mavjud nishonlar:\n${list}\n\nBuzish uchun: "hack <IP>" buyrug'ini yozing.`, 'output');
        }, 600);
        break;
      }
      case 'hack': {
        const targetIp = args[0];
        if (!targetIp) {
          addLog('XATOLIK: IP manzil ko\'rsatilmadi! Masalan: hack 192.168.4.102', 'error');
          return;
        }
        const target = nodes.find((n) => n.ip === targetIp);
        if (!target) {
          addLog(`XATOLIK: "${targetIp}" manzili bo'yicha server topilmadi. "scan" buyrug'ini tekshiring.`, 'error');
          return;
        }
        if (target.solved) {
          addLog(`OGOHLANTIRISH: ${target.name} allaqachon buzilgan va bo'shatilgan.`, 'warning');
          return;
        }
        addLog(`>> ${target.name} (${target.ip}) bilan aloqa o'rnatildi. Shifrlovchi bufer ochilmoqda...`, 'system');
        setDecryptorNode(null); setHackSession(value => value + 1);
        setActiveHackNode(target);
        break;
      }
      case 'grid': {
        if (isGridActive) { addLog('Grid allaqachon faol. ESC bilan chiqing.', 'warning'); break; }
        setGridEmp(empArmed); setEmpArmed(false);
        addLog('>> Neyron 2D Kiber-Grid rejimiga kirilmoqda...', 'system');
        setIsGridActive(true);
        break;
      }
      case 'oracle': {
        if (oraclePending.current) { addLog('AI javobini kuting.', 'warning'); return; }
        const question = args.join(' ');
        if (!question) {
          addLog('XATOLIK: Savol kiritilmadi! Masalan: oracle kiber-urush nima?', 'error');
          return;
        }
        if (question.length > 2000) { addLog('Savol 2000 belgidan oshmasin.', 'error'); return; }
        oraclePending.current = true;
        setIsAiThinking(true);
        addLog(`>> Kiber-AI yadrosiga so'rov yuborilmoqda: "${question}"...`, 'system');
        let answered = false;
        try {
          const text = await askOracle(question, oracleHistory.current, {
            handle: stats.handle, level: stats.level, credits: stats.credits,
            ram: stats.ram, maxRam: stats.maxRam, cpuHeat, reputation: stats.reputation
          });
          oracleHistory.current = [...oracleHistory.current,
            {role: 'user' as const, text: question}, {role: 'model' as const, text: text.slice(0, 2000)}].slice(-8);
          addLog(`[AI_ORACLE]: ${text}`, 'ai');
          answered = true;
        } catch (outerErr) {
          console.warn('Tashqi Oracle xatoligi:', outerErr);
        }
        // Agar xizmat vaqtincha band bo'lsa yoki javob qaytmasa, oflayn lokal keshdan javob beradi
        if (!answered) {
          const fallback = OFFLINE_ORACLE_RESPONSES[Math.floor(Math.random() * OFFLINE_ORACLE_RESPONSES.length)];
          addLog(
            `[OGOHLANTIRISH]: Jonli AI sozlanmagan yoki hozir javob bermadi. Oflayn kiber-kesh ishga tushirildi:\n${fallback}`,
            'warning'
          );
        }
        oraclePending.current = false;
        setIsAiThinking(false);
        break;
      }
      default: {
        addLog(`XATO BUYRUQ: "${cmd}". Barcha buyruqlarni ko'rish uchun "help" deb yozing.`, 'error');
      }
    }
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      if (!inputVal.includes(' ')) {
        const commands = [...new Set(HELP_COMMANDS.map(item => item.cmd.split(' ')[0]))].filter(cmd => cmd.startsWith(inputVal));
        if (commands.length === 1) setInputVal(commands[0] + ' ');
        else if (commands.length > 1) addLog(commands.join('  '), 'system');
      }
      return;
    }
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex.current === commandHistory.current.length) historyDraft.current = inputVal;
      historyIndex.current = Math.max(0, Math.min(commandHistory.current.length,
        historyIndex.current + (e.key === 'ArrowUp' ? -1 : 1)));
      setInputVal(commandHistory.current[historyIndex.current] ?? historyDraft.current);
      return;
    }
    if (e.ctrlKey && e.key.toLowerCase() === 'l') {
      e.preventDefault(); setLogs([]); return;
    }
    if (e.key === 'Enter') {
      const val = inputVal;
      setInputVal('');
      executeCommand(val);
    }
  };
  const handleHackSuccess = (credits: number) => {
    if (!activeHackNode) return;
    setStats((s) => ({
      ...awardReputation(s, 10),
      credits: s.credits + credits
    }));
    setNodes((prev) =>
      prev.map((n) => (n.id === activeHackNode.id ? { ...n, solved: true } : n))
    );
    addLog(`>> MUVAFFAQITYATLI XAK: ${activeHackNode.name} buzildi! Sizga +${credits} ₢ berildi.`, 'success');
    setActiveHackNode(null);
  };
  const handleHackFail = () => {
    setStats((s) => ({
      ...s,
      cpuHeat: Math.min(100, s.cpuHeat + 20)
    }));
    addLog('>> XAK MAG\'LUBIYATI! Tizim sizning izingizni aniqladi va aloqani uzdi.', 'error');
    setActiveHackNode(null);
  };
  const handleGridReward = (reward: number, msg: string) => {
    setStats((s) => ({
      ...awardReputation(s, 5),
      credits: s.credits + reward
    }));
    addLog(`>> GRID REJIMIDAN: ${msg}`, 'success');
  };
  return (
    <DarkGradientBg active={!isWorkspaceOpen} className="app-background h-full min-h-[550px]">
    <main
      onClick={focusInput}
      className="crt-terminal relative w-full h-full min-h-[550px] flex flex-col bg-[#050805] text-[#22c55e] font-mono select-text overflow-hidden"
    >
      <h1 className="sr-only">Cyberpunk TUI Matrix — terminal o‘yini va Browser Lab</h1>
      {/* Orqa fondagi Matritsa */}
      <MatrixRainCanvas active={isMatrixRain && !isWorkspaceOpen} />
      {/* Yuqori TUI Status bar */}
      <TerminalHeader
        onOpenWorkspace={openWorkspace}
        stats={stats}
        soundEnabled={soundEnabled}
        onToggleSound={() => { void setSound(!soundEnabled); }}
        isMatrixRain={isMatrixRain}
        onToggleMatrix={() => setIsMatrixRain((p) => !p)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenDownload={() => setIsDownloadOpen(true)}
      />
      {/* Tezkor TUI boshqaruv tugmalari paneli */}
      <div className="command-strip">
        <span className="text-zinc-500 font-bold">TEZKOR BUYRUQLAR:</span>
        <button
          onClick={() => executeCommand('download')}
          className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500 text-cyan-300 hover:bg-cyan-900/60 font-bold flex items-center gap-1 shadow-[0_0_8px_rgba(6,182,212,0.3)]"
        >
          <Icon name="download" className="text-[13px]"/>
          $ download
        </button>
        <button
          onClick={() => executeCommand('tools')}
          className="px-2 py-0.5 rounded bg-zinc-900 border border-cyan-700 text-cyan-300"
        >
          $ tools
        </button>
        <button
          onClick={() => executeCommand('shop')}
          className="px-2 py-0.5 rounded bg-zinc-900 border border-yellow-700 text-yellow-300"
        >
          $ shop
        </button>
        <button
          onClick={() => executeCommand('scan')}
          className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 hover:border-emerald-500 text-emerald-300 hover:bg-emerald-950/60"
        >
          $ scan
        </button>
        <button
          onClick={() => executeCommand('grid')}
          className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 hover:border-cyan-500 text-cyan-300 hover:bg-cyan-950/60"
        >
          $ grid
        </button>
        <button
          onClick={() => executeCommand('status')}
          className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 hover:border-yellow-500 text-yellow-300 hover:bg-yellow-950/60"
        >
          $ status
        </button>
        <button
          onClick={() => executeCommand('cool')}
          className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 hover:border-blue-500 text-blue-300 hover:bg-blue-950/60"
        >
          $ cool
        </button>
        <button
          onClick={() => executeCommand('upgrade')}
          className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 hover:border-purple-500 text-purple-300 hover:bg-purple-950/60"
        >
          $ upgrade
        </button>
        <button
          onClick={() => executeCommand('oracle kelajak qanday bo\'ladi?')}
          className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 hover:border-emerald-400 text-emerald-200 hover:bg-emerald-950/60"
        >
          $ oracle [savol]
        </button>
      </div>
      <div className="console-layout">
      <section className="console-panel" aria-label="Terminal konsoli">
      <div className="console-title"><span><span className="console-dots" aria-hidden="true">● ● ●</span> root@cyberdeck:~</span><span className="console-protocol">INTERACTIVE SHELL // v4.19</span></div>
      <div className="console-output space-y-2 text-xs md:text-sm font-mono">
        {logs.map((log) => {
          let colorClass = 'text-emerald-400';
          if (log.type === 'input') colorClass = 'text-emerald-200 font-bold';
          if (log.type === 'error') colorClass = 'text-red-400 font-semibold';
          if (log.type === 'warning') colorClass = 'text-amber-300';
          if (log.type === 'success') colorClass = 'text-emerald-300 font-bold bg-emerald-950/30 p-1 rounded inline-block';
          if (log.type === 'ai') colorClass = 'text-cyan-300 bg-cyan-950/40 border-l-2 border-cyan-400 p-2 rounded block shadow-[0_0_10px_rgba(6,182,212,0.15)]';
          if (log.type === 'system') colorClass = 'text-zinc-400';
          return (
            <div key={log.id} className={log.id === 'log-0' ? 'whitespace-pre leading-relaxed overflow-x-auto' : 'whitespace-pre-wrap leading-relaxed break-words'}>
              <span className="text-zinc-600 text-[10px] mr-2 select-none">
                [{log.timestamp}]
              </span>
              <span className={colorClass}>{log.text}</span>
            </div>
          );
        })}
        {/* Interaktiv Mini-o'yin: Hacking Hex Puzzle */}
        {activeHackNode && (
          <HackingPuzzle
            key={`${activeHackNode.id}-${hackSession}`}
            initialHexes={decryptorNode === activeHackNode.id ? activeHackNode.codePattern.slice(0, 1) : []}
            node={activeHackNode}
            onSuccess={handleHackSuccess}
            onFail={handleHackFail}
          />
        )}
        {/* Interaktiv Mini-o'yin: 2D Grid Rogue */}
        {isGridActive && (
          <GridMiniGame
            emp={gridEmp}
            onDanger={() => audio.play('error')}
            paused={isHelpOpen || isDownloadOpen || isWorkspaceOpen}
            onCollectReward={handleGridReward}
            onExit={() => {
              setIsGridActive(false);
              addLog('>> Grid rejimidan chiqildi.', 'system');
            }}
          />
        )}
        {isAiThinking && (
          <div className="flex items-center gap-2 text-cyan-300 text-xs animate-pulse">
            <Icon name="psychology" className="text-[14px]"/>
            <span>AI Core tahlil qilmoqda va neyron to'rlarni hisoblamoqda...</span>
          </div>
        )}
        <div ref={logsEndRef} />
      </div>
      </section>
      <aside className="deck-sidebar" aria-label="O‘yin tugunlari va inventar">
        <div className="side-heading"><Icon name="security"/> NETWORK NODES <span>{nodes.filter(node => node.solved).length}/{nodes.length}</span></div>
        <p className="side-caption">SIMULATED NETWORK / O‘YIN</p>
        {nodes.map(node => <button key={node.id} className="node-card" onClick={() => executeCommand(`probe ${node.ip}`)}><span className="node-state">{node.solved ? 'DECRYPTED' : `SECURITY ${node.securityLevel}`}</span><strong>{node.name}</strong><span className="node-address">{node.ip}<Icon name="arrow"/></span></button>)}
        <div className="side-heading inventory-heading"><Icon name="code_blocks"/> LOADOUT</div>
        {TOOL_IDS.map(id => <button className="loadout-item" key={id} onClick={() => executeCommand('tools')}><span>{TOOLS[id].name}</span><strong>×{inventory[id]}</strong></button>)}
        <div className="side-note">// Boshlash uchun <button onClick={() => executeCommand('scan')}>scan</button> yozing.<br/>Tugunni tanlang va HEX shifrni yeching.</div>
      </aside>
      </div>
      {/* Terminal Buyruq Kiritish Qatori */}
      <div className="command-input">
        <span className="text-emerald-400 font-bold text-sm select-none">
          root@cyberdeck:~$
        </span>
        <input
          ref={inputRef}
          type="text"
          aria-label="Terminal buyrug‘i"
          disabled={isGridActive || isWorkspaceOpen}
          value={inputVal}
          onChange={(e) => { setInputVal(e.target.value); audio.play('key'); }}
          onKeyDown={handleKeyDown}
          placeholder={isGridActive ? 'Grid: WASD / strelkalar. ESC bilan chiqing.' : 'Buyruq yozing: help, scan, grid, oracle <savol>...'}
          className="flex-1 min-w-0 bg-transparent text-emerald-300 outline-none font-mono text-xs md:text-sm placeholder-zinc-700 caret-emerald-400"
          autoFocus
        />
        <button
          disabled={isGridActive || isWorkspaceOpen}
          onClick={() => {
            const val = inputVal;
            setInputVal('');
            executeCommand(val);
          }}
          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-black font-bold rounded text-xs transition-all flex items-center gap-1 active:scale-95"
        >
          <span>ENTER</span>
          <Icon name="subdirectory_arrow_left" className="text-[14px]"/>
        </button>
      </div>
      {/* Buyruqlar haqida yordam modali */}
      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        onSelectCommand={(cmd) => { if (cmd.includes('<')) setInputVal(cmd.split(' ')[0] + ' '); else void executeCommand(cmd); }}
      />
      {/* Kodni ko'rish va yuklab olish modali */}
      {isDownloadOpen && <Suspense fallback={<div role="status" className="fixed inset-0 z-50 bg-black/90 text-emerald-300 p-8">Kod arxivi yuklanmoqda…</div>}><DownloadModal isOpen onClose={() => setIsDownloadOpen(false)}/></Suspense>}
      {workspaceOpened && <Suspense fallback={<div className="fixed inset-0 z-[60] bg-black text-emerald-300 p-8">Brauzer terminali yuklanmoqda…</div>}>
        <BrowserWorkspace open={isWorkspaceOpen} onClose={() => setIsWorkspaceOpen(false)}/>
      </Suspense>}
    </main>
    </DarkGradientBg>
  );
}
