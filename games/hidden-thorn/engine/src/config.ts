export interface GameConfig {
  /** 한 사람의 장미 원판 수 (원작 3) */
  roses: number;
  /** 한 사람의 가시 원판 수 (원작 1) */
  thorns: number;
  /** 이만큼 도전에 성공하면 우승 (원작 2) */
  winPoints: number;
  /** 자기 가시에 걸렸을 때 잃을 원판을 직접 고르기 (원작) — 끄면 무작위 */
  chooseOwnLoss: boolean;
  /** 남의 가시에 걸리면 가시 주인이 무작위로 하나를 빼앗음 (원작) — 끄면 내가 고름 */
  randomLoss: boolean;
  /** 판 수 (여러 게임) */
  rounds: number;
  turnTimerSec: number;
}

export const LIMITS = {
  roses: [2, 5],
  thorns: [1, 2],
  winPoints: [1, 4],
  rounds: [1, 5],
  turnTimerSec: [0, 120],
  players: [2, 8],
} as const;

export const CLASSIC: GameConfig = {
  roses: 3,
  thorns: 1,
  winPoints: 2,
  chooseOwnLoss: true,
  randomLoss: true,
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
  { id: 'classic', label: '원작', description: '장미 3 · 가시 1 · 2번 성공하면 우승', config: CLASSIC },
  { id: 'quick', label: '한 번에 결판', description: '1번 성공하면 우승', config: { ...CLASSIC, winPoints: 1 } },
  { id: 'spiky', label: '가시 2개', description: '장미 3 · 가시 2 — 더 위험하게', config: { ...CLASSIC, thorns: 2 } },
  { id: 'long', label: '길게', description: '장미 4 · 3번 성공', config: { ...CLASSIC, roses: 4, winPoints: 3 } },
];

const clamp = (v: unknown, [lo, hi]: readonly [number, number], d: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d;
};

export function sanitizeConfig(input: Partial<GameConfig>): GameConfig {
  const c = { ...CLASSIC, ...input };
  return {
    roses: clamp(c.roses, LIMITS.roses, 3),
    thorns: clamp(c.thorns, LIMITS.thorns, 1),
    winPoints: clamp(c.winPoints, LIMITS.winPoints, 2),
    chooseOwnLoss: c.chooseOwnLoss !== false,
    randomLoss: c.randomLoss !== false,
    rounds: clamp(c.rounds, LIMITS.rounds, 1),
    turnTimerSec: clamp(c.turnTimerSec, LIMITS.turnTimerSec, 0),
  };
}

export function validateConfig(): string[] {
  return [];
}
