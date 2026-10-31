import type {PlayerStats} from '../types';
export interface OracleMessage {role: 'user' | 'model'; text: string;}
export type OracleContext = Pick<PlayerStats, 'handle' | 'level' | 'credits' | 'ram' | 'maxRam' | 'cpuHeat' | 'reputation'>;
export async function askOracle(question: string, history: OracleMessage[] = [], context?: OracleContext): Promise<string> {
  const response = await fetch('/api/oracle', {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({question, history, context}), signal: AbortSignal.timeout(18_000)
  });
  if (!response.ok) throw new Error('Jonli AI mavjud emas.');
  const data = await response.json();
  if (typeof data.text !== 'string' || !data.text.trim()) throw new Error('AI javobi bo‘sh.');
  return data.text;
}
