import React from 'react';
import type {PlayerStats} from '../types';
import {Icon} from './Icon';
interface TerminalHeaderProps {
  stats: PlayerStats;
  onOpenWorkspace: () => void;
  isMatrixRain: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onToggleMatrix: () => void;
  onOpenHelp: () => void;
  onOpenDownload: () => void;
}
export const TerminalHeader: React.FC<TerminalHeaderProps> = ({stats, onOpenWorkspace, isMatrixRain, soundEnabled, onToggleSound, onToggleMatrix, onOpenHelp, onOpenDownload}) => {
  const heatClass = stats.cpuHeat > 75 ? 'is-hot' : stats.cpuHeat > 45 ? 'is-warm' : '';
  return <header className="terminal-header">
    <div className="header-topline">
      <div className="brand-lockup">
        <div className="brand-mark" aria-hidden="true"><Icon name="terminal"/></div>
        <div><div className="brand-name">CYBER<span>NET</span><span className="brand-slash">_</span></div>
          <div className="brand-caption">NEO-TASHKENT // INTERACTIVE TERMINAL</div></div>
      </div>
      <div className="header-actions">
        <button onClick={onOpenWorkspace} className="hud-button hud-button-primary"><Icon name="terminal"/>BROWSER LAB<Icon name="arrow"/></button>
        <button onClick={onToggleSound} aria-label={`SOUND: ${soundEnabled ? 'ON' : 'OFF'} — Audio effektlar`} aria-pressed={soundEnabled} className="hud-button"><Icon name={soundEnabled ? 'volume_up' : 'volume_off'}/>SOUND: {soundEnabled ? 'ON' : 'OFF'}</button>
        <button onClick={onToggleMatrix} aria-pressed={isMatrixRain} className="hud-button"><Icon name="grid_view"/>MATRIX: {isMatrixRain ? 'ON' : 'OFF'}</button>
        <button onClick={onOpenDownload} className="hud-button"><Icon name="download"/>KODNI YUKLAB OLISH</button>
        <button onClick={onOpenHelp} className="hud-button"><Icon name="help"/>KOMANDALAR</button>
      </div>
    </div>
    <div className="telemetry-strip">
      <div className="agent-identity"><span className="online-light" aria-hidden="true"/><span><span className="telemetry-caption">AGENT // LVL {stats.level}</span><strong>@{stats.handle}</strong></span><span className="session-tag">GAME SESSION</span></div>
      <div className="telemetry-stat"><span className="telemetry-caption">CREDITS</span><strong className="credit-value">{stats.credits} <span>₢</span></strong></div>
      <div className="telemetry-stat telemetry-memory"><span className="telemetry-caption">RAM / MEMORY</span><strong>{stats.ram}<span className="stat-secondary"> / {stats.maxRam} MB</span></strong><div className="meter" aria-hidden="true"><span style={{width:`${Math.min(100, stats.ram / stats.maxRam * 100)}%`}}/></div></div>
      <div className={`telemetry-stat telemetry-heat ${heatClass}`}><span className="telemetry-caption">CPU / THERMAL</span><strong>{stats.cpuHeat}°C</strong><div className="meter" aria-hidden="true"><span style={{width:`${stats.cpuHeat}%`}}/></div></div>
      <div className="telemetry-stat reputation-stat"><span className="telemetry-caption">REPUTATION</span><strong>{stats.reputation}<span className="stat-secondary"> / 100</span></strong></div>
    </div>
  </header>;
};
