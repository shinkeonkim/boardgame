export interface GameConfig {
  /** 역할마다 카드 장수 (원작 3) — 인원이 많으면 4 */
  copies: number;
  startCoins: number;
  /** 쿠데타 비용 (원작 7) */
  coupCost: number;
  /** 이만큼 모이면 반드시 쿠데타 (원작 10) */
  mustCoup: number;
  /** 암살 비용 (원작 3) */
  assassinCost: number;
  /** 약탈 (원작 2) */
  stealAmount: number;
  /** 도전·막기를 기다리는 시간(초) — 지나면 모두 통과 */
  reactionSec: number;
  /** 2명일 때 원작 2인 규칙: 시작 동전 1개를 덜 받는 선 플레이어 */
  twoPlayerHandicap: boolean;
  rounds: number;
  /** 내 차례(행동 고르기) 제한시간 */
  turnTimerSec: number;
}

export const LIMITS = {
  copies: [2, 4],
  startCoins: [0, 5],
  coupCost: [5, 9],
  mustCoup: [8, 14],
  assassinCost: [2, 5],
  stealAmount: [1, 3],
  reactionSec: [5, 40],
  rounds: [1, 5],
  turnTimerSec: [0, 120],
  players: [2, 6],
} as const;

export const CLASSIC: GameConfig = {
  copies: 3,
  startCoins: 2,
  coupCost: 7,
  mustCoup: 10,
  assassinCost: 3,
  stealAmount: 2,
  reactionSec: 12,
  twoPlayerHandicap: true,
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
  { id: 'classic', label: '원작', description: '역할 3장씩 15장 · 동전 2개로 시작', config: CLASSIC },
  { id: 'big', label: '5~6명', description: '역할 4장씩 20장', config: { ...CLASSIC, copies: 4 } },
  { id: 'fast', label: '빠른 판', description: '동전 3개로 시작 · 쿠데타 6', config: { ...CLASSIC, startCoins: 3, coupCost: 6, mustCoup: 9 } },
  { id: 'slow', label: '여유 있게', description: '도전 대기 25초', config: { ...CLASSIC, reactionSec: 25 } },
];

const clamp = (v: unknown, [lo, hi]: readonly [number, number], d: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d;
};

export function sanitizeConfig(input: Partial<GameConfig>): GameConfig {
  const c = { ...CLASSIC, ...input };
  const coupCost = clamp(c.coupCost, LIMITS.coupCost, 7);
  return {
    copies: clamp(c.copies, LIMITS.copies, 3),
    startCoins: clamp(c.startCoins, LIMITS.startCoins, 2),
    coupCost,
    mustCoup: Math.max(coupCost, clamp(c.mustCoup, LIMITS.mustCoup, 10)),
    assassinCost: clamp(c.assassinCost, LIMITS.assassinCost, 3),
    stealAmount: clamp(c.stealAmount, LIMITS.stealAmount, 2),
    reactionSec: clamp(c.reactionSec, LIMITS.reactionSec, 12),
    twoPlayerHandicap: c.twoPlayerHandicap !== false,
    rounds: clamp(c.rounds, LIMITS.rounds, 1),
    turnTimerSec: clamp(c.turnTimerSec, LIMITS.turnTimerSec, 0),
  };
}

export function validateConfig(c: GameConfig, players: number): string[] {
  if (players * 2 + 2 > c.copies * 5) return [`카드가 모자라요. ${players}명이면 역할을 ${Math.ceil((players * 2 + 2) / 5)}장씩 이상으로 늘려 주세요`];
  return [];
}
