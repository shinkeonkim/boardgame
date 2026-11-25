export interface GameConfig {
  /** 「고/스톱」을 부를 수 있는 점수 (0이면 인원에 맞춰: 2명 7점 · 3명 3점) */
  goAt: number;
  /** 피박·광박 (진 사람 점수 두 배) */
  bak: boolean;
  /** 쪽·따닥·싹쓸이 때 피 한 장씩 뺏기 */
  steal: boolean;
  rounds: number;
  turnTimerSec: number;
}

export const LIMITS = {
  goAt: [0, 10],
  rounds: [1, 10],
  turnTimerSec: [0, 120],
  players: [2, 3],
} as const;

export const CLASSIC: GameConfig = { goAt: 0, bak: true, steal: true, rounds: 3, turnTimerSec: 0 };

export interface Preset {
  id: string;
  label: string;
  description: string;
  config: GameConfig;
}

export const PRESETS: Preset[] = [
  { id: 'classic', label: '기본', description: '2명 7점 · 3명 3점부터 고/스톱 · 피박·광박 · 3판', config: CLASSIC },
  { id: 'easy', label: '처음 하는 사람과', description: '박 없이 · 피 뺏기 없이 · 1판', config: { ...CLASSIC, bak: false, steal: false, rounds: 1 } },
  { id: 'long', label: '길게', description: '5판', config: { ...CLASSIC, rounds: 5 } },
];

const clamp = (v: unknown, [lo, hi]: readonly [number, number], d: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d;
};

export function sanitizeConfig(input: Partial<GameConfig>): GameConfig {
  const c = { ...CLASSIC, ...input };
  return {
    goAt: clamp(c.goAt, LIMITS.goAt, 0),
    bak: c.bak !== false,
    steal: c.steal !== false,
    rounds: clamp(c.rounds, LIMITS.rounds, 3),
    turnTimerSec: clamp(c.turnTimerSec, LIMITS.turnTimerSec, 0),
  };
}

export const goAtFor = (c: GameConfig, players: number) => c.goAt || (players === 2 ? 7 : 3);

export function validateConfig(): string[] {
  return [];
}
