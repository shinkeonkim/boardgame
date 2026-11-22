export interface GameConfig {
  /** 이기려면 모을 세트 수 */
  goal: number;
  /** 7 세 장을 모으면 바로 승리 */
  sevenWins: boolean;
  /** 가운데에 둘 카드 수 (나머지는 똑같이 나눔) — 0이면 인원에 맞춰 기본 */
  middle: number;
  rounds: number;
  turnTimerSec: number;
}

export const LIMITS = {
  goal: [2, 4],
  middle: [0, 12],
  rounds: [1, 5],
  turnTimerSec: [0, 60],
  players: [3, 6],
} as const;

export const CLASSIC: GameConfig = { goal: 3, sevenWins: true, middle: 0, rounds: 1, turnTimerSec: 0 };

export interface Preset {
  id: string;
  label: string;
  description: string;
  config: GameConfig;
}

export const PRESETS: Preset[] = [
  { id: 'classic', label: '기본', description: '세트 3개, 또는 7 세 장이면 바로 승리', config: CLASSIC },
  { id: 'short', label: '짧게', description: '세트 2개면 승리', config: { ...CLASSIC, goal: 2 } },
  { id: 'long', label: '길게', description: '세트 4개 · 7 즉시 승리 없음', config: { ...CLASSIC, goal: 4, sevenWins: false } },
  { id: 'center', label: '가운데 많이', description: '가운데 카드 12장 — 기억력 싸움', config: { ...CLASSIC, middle: 12 } },
];

/** 인원별 기본: 손패 수와 가운데 수 */
export const DEFAULT_SPLIT: Record<number, { hand: number; middle: number }> = {
  3: { hand: 9, middle: 9 },
  4: { hand: 7, middle: 8 },
  5: { hand: 6, middle: 6 },
  6: { hand: 5, middle: 6 },
};

export function splitFor(c: GameConfig, players: number): { hand: number; middle: number } {
  if (!c.middle) return DEFAULT_SPLIT[players] ?? DEFAULT_SPLIT[4];
  const middle = Math.min(c.middle, 36 - players * 3);
  return { hand: Math.floor((36 - middle) / players), middle };
}

const clamp = (v: unknown, [lo, hi]: readonly [number, number], d: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d;
};

export function sanitizeConfig(input: Partial<GameConfig>): GameConfig {
  const c = { ...CLASSIC, ...input };
  return {
    goal: clamp(c.goal, LIMITS.goal, 3),
    sevenWins: c.sevenWins !== false,
    middle: clamp(c.middle, LIMITS.middle, 0),
    rounds: clamp(c.rounds, LIMITS.rounds, 1),
    turnTimerSec: clamp(c.turnTimerSec, LIMITS.turnTimerSec, 0),
  };
}

export function validateConfig(_c: GameConfig, players: number): string[] {
  return players < 3 ? ['3명 이상이어야 해요 (봇으로 채울 수 있어요)'] : [];
}
