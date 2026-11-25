export interface GameConfig {
  /** 판 크기 (줄 수) */
  size: 13 | 15 | 19;
  /** true = 딱 다섯만 이김(여섯 이상 장목은 무효), false = 다섯 이상이면 이김 */
  exactFive: boolean;
  /** 몇 판 (판마다 흑·백을 바꿈) */
  rounds: number;
  turnTimerSec: number;
}

export const LIMITS = {
  rounds: [1, 7],
  turnTimerSec: [0, 120],
  players: [2, 2],
} as const;

export const CLASSIC: GameConfig = { size: 15, exactFive: false, rounds: 1, turnTimerSec: 0 };

export interface Preset {
  id: string;
  label: string;
  description: string;
  config: GameConfig;
}

export const PRESETS: Preset[] = [
  { id: 'classic', label: '기본 오목', description: '15줄 · 다섯 이상이면 승리', config: CLASSIC },
  { id: 'exact', label: '딱 다섯', description: '여섯 이상(장목)은 무효 — 조금 더 까다롭게', config: { ...CLASSIC, exactFive: true } },
  { id: 'big', label: '바둑판', description: '19줄 넓은 판', config: { ...CLASSIC, size: 19 } },
  { id: 'quick', label: '작은 판', description: '13줄 · 빨리 끝나요', config: { ...CLASSIC, size: 13 } },
  { id: 'match', label: '3판 2선승', description: '판마다 흑백을 바꿔 3판', config: { ...CLASSIC, rounds: 3 } },
];

const clamp = (v: unknown, [lo, hi]: readonly [number, number], d: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d;
};

export function sanitizeConfig(input: Partial<GameConfig>): GameConfig {
  const c = { ...CLASSIC, ...input };
  return {
    size: c.size === 13 || c.size === 19 ? c.size : 15,
    exactFive: c.exactFive === true,
    rounds: clamp(c.rounds, LIMITS.rounds, 1),
    turnTimerSec: clamp(c.turnTimerSec, LIMITS.turnTimerSec, 0),
  };
}

export function validateConfig(_c: GameConfig, players: number): string[] {
  return players === 2 ? [] : ['오목은 2명이 해요'];
}
