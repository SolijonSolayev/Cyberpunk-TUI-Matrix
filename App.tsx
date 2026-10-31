import React, { useState, useEffect, useRef } from 'react';
import { askOracle, type OracleMessage } from './lib/oracle';
import { PlayerStats, TerminalLog, HackNode } from './types';
import { ASCII_HEADER, INITIAL_NODES } from './constants';
import { TerminalHeader } from './components/TerminalHeader';
import { MatrixRainCanvas } from './components/MatrixRainCanvas';
import { GridMiniGame } from './components/GridMiniGame';
import { HackingPuzzle } from './components/HackingPuzzle';
import { HelpModal } from './components/HelpModal';
import { DownloadModal } from './components/DownloadModal';
// Kiberpank oflayn lokal javoblar bazasi (server vaqtincha band yoki uzilgan holatda)
const OFFLINE_ORACLE_RESPONSES = [
  '>> [KESH-JAVOB]: Neyron magistrallarida ma\'lumotlar oqimi haddan tashqari zich. Kiber-matritsa taxmini: Kelajak korporatsiyalar emas, balki shifrlangan tarmoq erkinligi qo\'lida bo\'ladi.',
  '>> [KESH-JAVOB]: Kvant shifrlari tahlil qilindi. Protokol: Doimo kiber-deck xotirangizni toza tuting va begona tugunlarga ruxsatsiz ulanmang.',
  '>> [KESH-JAVOB]: Neo-Toshkent sun\'iy intellekt arxivi: Texnologiya insoniyat ongini kengaytirishi mumkin, ammo qalb kodini hech qanday kvant mashinasi o\'zgartira olmaydi.',
  '>> [KESH-JAVOB]: Aloqa uzilishi fonida lokal AI yadro javobi: Siz qidirayotgan haqiqat tarmoqning eng chuqur shifrlangan qatlamlarida yashiringan.'
];
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
    if (!isGridActive && !isHelpOpen && !isDownloadOpen) inputRef.current?.focus();
  }, [isGridActive, isHelpOpen, isDownloadOpen]);
  useEffect(() => {
    const closeOverlay = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (isDownloadOpen) setIsDownloadOpen(false);
      else if (isHelpOpen) setIsHelpOpen(false);
    };
    window.addEventListener('keydown', closeOverlay);
    return () => window.removeEventListener('keydown', closeOverlay);
  }, [isHelpOpen, isDownloadOpen]);
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
  const focusInput = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isGridActive || isHelpOpen || isDownloadOpen ||
        (event.target as HTMLElement).closest('button, input, a')) return;
    inputRef.current?.focus();
  };
  const addLog = (text: string, type: TerminalLog['type'] = 'output') => {
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
  // Buyruqlarni bajarish mexanizmi
  const executeCommand = async (rawCmd: string) => {
    const trimmed = rawCmd.trim();
    if (!trimmed) return;
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
        addLog(
          `Mavjud buyruqlar:\n` +
          `• download      - Dasturning to'liq manba kodlarini yuklab olish oynasini ochish\n` +
          `• scan          - Atrofdagi korporativ serverlarni topish\n` +
          `• hack <IP>     - Tanlangan serverni buzish (masalan: hack 192.168.4.102)\n` +
          `• grid          - Kiber-labirint 2D mini-o'yinini ishga tushirish\n` +
          `• oracle <matn> - Gemini AI yadrosi bilan jonli kiberpank muloqot\n` +
          `• status        - Tizim apparat holati va resurslar\n` +
          `• cool          - CPU sovutgichini yoqish (haroratni pasaytirish)\n` +
          `• upgrade       - Tizim RAM hajmini oshirish (Narxi: 300 ₢)\n` +
          `• matrix        - Matritsa animatsiyasini yoqish/o'chirish\n` +
          `• clear         - Ekranni tozalash`,
          'system'
        );
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
        setActiveHackNode(target);
        break;
      }
      case 'grid': {
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
    <div
      onClick={focusInput}
      className="crt-terminal relative w-full h-full min-h-[550px] flex flex-col bg-[#050805] text-[#22c55e] font-mono select-text overflow-hidden"
    >
      {/* Orqa fondagi Matritsa */}
      <MatrixRainCanvas active={isMatrixRain} />
      {/* Yuqori TUI Status bar */}
      <TerminalHeader
        stats={stats}
        isMatrixRain={isMatrixRain}
        onToggleMatrix={() => setIsMatrixRain((p) => !p)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenDownload={() => setIsDownloadOpen(true)}
      />
      {/* Tezkor TUI boshqaruv tugmalari paneli */}
      <div className="bg-black/80 border-b border-emerald-950 px-4 py-1.5 flex items-center gap-2 overflow-x-auto text-[11px] z-10">
        <span className="text-zinc-500 font-bold">TEZKOR BUYRUQLAR:</span>
        <button
          onClick={() => executeCommand('download')}
          className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500 text-cyan-300 hover:bg-cyan-900/60 font-bold flex items-center gap-1 shadow-[0_0_8px_rgba(6,182,212,0.3)]"
        >
          <span className="material-symbols-outlined text-[13px]">download</span>
          $ download
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
      {/* Asosiy Terminal Jurnali */}
      <div className="flex-1 p-4 overflow-y-auto space-y-2 z-10 text-xs md:text-sm font-mono scroll-smooth">
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
            key={activeHackNode.id}
            node={activeHackNode}
            onSuccess={handleHackSuccess}
            onFail={handleHackFail}
          />
        )}
        {/* Interaktiv Mini-o'yin: 2D Grid Rogue */}
        {isGridActive && (
          <GridMiniGame
            paused={isHelpOpen || isDownloadOpen}
            onCollectReward={handleGridReward}
            onExit={() => {
              setIsGridActive(false);
              addLog('>> Grid rejimidan chiqildi.', 'system');
            }}
          />
        )}
        {isAiThinking && (
          <div className="flex items-center gap-2 text-cyan-300 text-xs animate-pulse">
            <span className="material-symbols-outlined text-[14px]">psychology</span>
            <span>AI Core tahlil qilmoqda va neyron to'rlarni hisoblamoqda...</span>
          </div>
        )}
        <div ref={logsEndRef} />
      </div>
      {/* Terminal Buyruq Kiritish Qatori */}
      <div className="border-t-2 border-emerald-500/40 bg-black/95 px-4 py-3 flex items-center gap-2 z-10 shadow-[0_-4px_20px_rgba(16,185,129,0.1)]">
        <span className="text-emerald-400 font-bold text-sm select-none animate-pulse">
          root@cyberdeck:~$
        </span>
        <input
          ref={inputRef}
          type="text"
          aria-label="Terminal buyrug‘i"
          disabled={isGridActive}
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isGridActive ? 'Grid: WASD / strelkalar. ESC bilan chiqing.' : 'Buyruq yozing: help, scan, grid, oracle <savol>...'}
          className="flex-1 bg-transparent text-emerald-300 outline-none font-mono text-xs md:text-sm placeholder-zinc-700 caret-emerald-400"
          autoFocus
        />
        <button
          disabled={isGridActive}
          onClick={() => {
            const val = inputVal;
            setInputVal('');
            executeCommand(val);
          }}
          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-black font-bold rounded text-xs transition-all flex items-center gap-1 active:scale-95"
        >
          <span>ENTER</span>
          <span className="material-symbols-outlined text-[14px]">subdirectory_arrow_left</span>
        </button>
      </div>
      {/* Buyruqlar haqida yordam modali */}
      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        onSelectCommand={(cmd) => executeCommand(cmd)}
      />
      {/* Kodni ko'rish va yuklab olish modali */}
      <DownloadModal
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
      />
    </div>
  );
}
