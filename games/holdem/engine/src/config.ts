export interface GameConfig {
  /** 처음 칩 */
  startChips: number;
  /** 스몰 블라인드 (빅 블라인드는 두 배) */
  smallBlind: number;
  /** 몇 핸드마다 블라인드 두 배 (0 = 그대로) */
  blindUp: number;
  /** 핸드 수 제한 (0 = 한 명이 남을 때까지) — 끝나면 칩이 많은 순 */
  maxHands: number;
  /** 베팅 상한: no-limit = 올인까지, pot = 팟만큼 */
  limit: 'no-limit' | 'pot';
  turnTimerSec: number;
}

export const LIMITS = {
  startChips: [200, 5000],
  smallBlind: [1, 200],
  blindUp: [0, 30],
  maxHands: [0, 100],
  turnTimerSec: [0, 60],
  players: [2, 9],
} as const;

export const CLASSIC: GameConfig = { startChips: 1000, smallBlind: 10, blindUp: 10, maxHands: 0, limit: 'no-limit', turnTimerSec: 30 };

export interface Preset {
  id: string;
  label: string;
  description: string;
  config: GameConfig;
}

export const PRESETS: Preset[] = [
  { id: 'classic', label: '토너먼트', description: '칩 1000 · 블라인드 10/20 · 10핸드마다 두 배 · 한 명이 남을 때까지', config: CLASSIC },
  { id: 'quick', label: '빠른 판', description: '20핸드 뒤 칩이 많은 사람 승리 · 5핸드마다 블라인드 두 배', config: { ...CLASSIC, maxHands: 20, blindUp: 5 } },
  { id: 'deep', label: '여유 있게', description: '칩 3000 · 블라인드 고정', config: { ...CLASSIC, startChips: 3000, blindUp: 0 } },
  { id: 'pot', label: '팟 리밋', description: '한 번에 팟만큼까지만 베팅', config: { ...CLASSIC, limit: 'pot' } },
];

const clamp = (v: unknown, [lo, hi]: readonly [number, number], d: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d;
};

export function sanitizeConfig(input: Partial<GameConfig>): GameConfig {
  const c = { ...CLASSIC, ...input };
  return {
    startChips: clamp(c.startChips, LIMITS.startChips, 1000),
    smallBlind: clamp(c.smallBlind, LIMITS.smallBlind, 10),
    blindUp: clamp(c.blindUp, LIMITS.blindUp, 10),
    maxHands: clamp(c.maxHands, LIMITS.maxHands, 0),
    limit: c.limit === 'pot' ? 'pot' : 'no-limit',
    turnTimerSec: clamp(c.turnTimerSec, LIMITS.turnTimerSec, 30),
  };
}

export function validateConfig(c: GameConfig): string[] {
  return c.smallBlind * 2 > c.startChips / 5 ? ['빅 블라인드가 처음 칩의 1/5보다 작아야 해요'] : [];
}
