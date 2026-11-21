export interface GameConfig {
  /** 색 수 (원작 4) */
  colors: number;
  /** 숫자 1~maxNumber (원작 13) */
  maxNumber: number;
  /** 같은 타일 벌 수 (원작 2) */
  copies: number;
  /** 조커 수 (원작 2) */
  jokers: number;
  /** 처음 손패 (원작 14) */
  handSize: number;
  /** 처음 등록에 필요한 합 (원작 30, 0 = 없음) */
  initialMeld: number;
  /** 판 수 — 점수를 더해요 */
  rounds: number;
  turnTimerSec: number;
}

export const LIMITS = {
  colors: [3, 5],
  maxNumber: [9, 13],
  copies: [1, 3],
  jokers: [0, 4],
  handSize: [8, 16],
  initialMeld: [0, 50],
  rounds: [1, 5],
  turnTimerSec: [0, 300],
  players: [2, 6],
} as const;

export const CLASSIC: GameConfig = {
  colors: 4,
  maxNumber: 13,
  copies: 2,
  jokers: 2,
  handSize: 14,
  initialMeld: 30,
  rounds: 1,
  turnTimerSec: 0,
};

export interface Preset {
  id: string;
  label: string;
  description: string;
  config: GameConfig;
}

export const PRESETS: Preset[] = [
  { id: 'classic', label: '원작', description: '4색 × 1~13 × 2벌 + 조커 2 · 처음 30점', config: CLASSIC },
  { id: 'easy', label: '처음 하는 사람', description: '처음 등록 조건 없음 · 손패 12장', config: { ...CLASSIC, initialMeld: 0, handSize: 12 } },
  { id: 'quick', label: '빠른 판', description: '1~10 · 손패 10장', config: { ...CLASSIC, maxNumber: 10, handSize: 10, initialMeld: 20 } },
  { id: 'big', label: '5~6명', description: '5색 · 조커 3', config: { ...CLASSIC, colors: 5, jokers: 3 } },
  { id: 'series', label: '3판 합계', description: '판마다 점수를 더해요', config: { ...CLASSIC, rounds: 3 } },
];

const clamp = (v: unknown, [lo, hi]: readonly [number, number], d: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d;
};

export function sanitizeConfig(input: Partial<GameConfig>): GameConfig {
  const c = { ...CLASSIC, ...input };
  return {
    colors: clamp(c.colors, LIMITS.colors, 4),
    maxNumber: clamp(c.maxNumber, LIMITS.maxNumber, 13),
    copies: clamp(c.copies, LIMITS.copies, 2),
    jokers: clamp(c.jokers, LIMITS.jokers, 2),
    handSize: clamp(c.handSize, LIMITS.handSize, 14),
    initialMeld: clamp(c.initialMeld, LIMITS.initialMeld, 30),
    rounds: clamp(c.rounds, LIMITS.rounds, 1),
    turnTimerSec: clamp(c.turnTimerSec, LIMITS.turnTimerSec, 0),
  };
}

export const tileTotal = (c: GameConfig) => c.colors * c.maxNumber * c.copies + c.jokers;

export function validateConfig(c: GameConfig, players: number): string[] {
  if (players * c.handSize + 10 > tileTotal(c)) return [`타일이 모자라요(${tileTotal(c)}장). 손패를 줄이거나 벌 수를 늘려 주세요`];
  return [];
}
