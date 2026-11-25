export interface GameConfig {
  /** 왕국 크기: 5×5 (기본) · 7×7 (2명 「큰 왕국」) */
  size: 5 | 7;
  /** 성이 왕국 한가운데면 +10 */
  middle: boolean;
  /** 왕국을 빈칸 없이 다 채우면(버린 도미노 없음) +5 */
  harmony: boolean;
  rounds: number;
  turnTimerSec: number;
}

export const LIMITS = {
  rounds: [1, 3],
  turnTimerSec: [0, 120],
  players: [2, 4],
} as const;

export const CLASSIC: GameConfig = { size: 5, middle: false, harmony: false, rounds: 1, turnTimerSec: 0 };

export interface Preset {
  id: string;
  label: string;
  description: string;
  config: GameConfig;
}

export const PRESETS: Preset[] = [
  { id: 'classic', label: '기본', description: '5×5 왕국 · 땅 크기 × 왕관', config: CLASSIC },
  { id: 'bonus', label: '보너스 규칙', description: '성이 가운데면 +10 · 꽉 채우면 +5', config: { ...CLASSIC, middle: true, harmony: true } },
  { id: 'big', label: '큰 왕국 (2명)', description: '7×7 왕국 · 도미노를 모두 써요', config: { ...CLASSIC, size: 7 } },
];

const clamp = (v: unknown, [lo, hi]: readonly [number, number], d: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d;
};

export function sanitizeConfig(input: Partial<GameConfig>): GameConfig {
  const c = { ...CLASSIC, ...input };
  return {
    size: c.size === 7 ? 7 : 5,
    middle: c.middle === true,
    harmony: c.harmony === true,
    rounds: clamp(c.rounds, LIMITS.rounds, 1),
    turnTimerSec: clamp(c.turnTimerSec, LIMITS.turnTimerSec, 0),
  };
}

export function validateConfig(c: GameConfig, players: number): string[] {
  return c.size === 7 && players !== 2 ? ['7×7 큰 왕국은 2명일 때만 할 수 있어요'] : [];
}
