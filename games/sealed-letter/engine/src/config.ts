export interface GameConfig {
  /** classic = 16장 2~4명, extended = 21장(첩자·서기관 추가) 2~6명 */
  edition: 'classic' | 'extended';
  /** 이 개수만큼 인장을 모으면 우승. 0이면 인원에 따라 자동 (2명 7, 3명 5, 4명 4, 5~6명 3) */
  tokensToWin: number;
  /** 2명일 때 3장을 공개로 빼 둠 (원작) */
  twoPlayerReveal: boolean;
  /** 파수꾼이 다른 파수꾼을 지목할 수 없음 (원작) */
  guardNoGuard: boolean;
  /** 지난 판 승자가 먼저 (원작) / 무작위 */
  winnerStarts: boolean;
  turnTimerSec: number;
}

export const LIMITS = {
  tokensToWin: [0, 9],
  turnTimerSec: [0, 120],
  players: [2, 6],
} as const;

export const CLASSIC: GameConfig = {
  edition: 'classic',
  tokensToWin: 0,
  twoPlayerReveal: true,
  guardNoGuard: true,
  winnerStarts: true,
  turnTimerSec: 0,
};

export interface Preset {
  id: string;
  label: string;
  description: string;
  config: GameConfig;
}

export const PRESETS: Preset[] = [
  { id: 'classic', label: '원작 (16장)', description: '2~4명 · 인장 수 자동', config: CLASSIC },
  { id: 'extended', label: '확장 (21장)', description: '첩자·서기관 추가 · 5~6명도', config: { ...CLASSIC, edition: 'extended' } },
  { id: 'quick', label: '짧게 (인장 3개)', description: '세 번 이기면 끝', config: { ...CLASSIC, tokensToWin: 3 } },
];

const clamp = (v: unknown, [lo, hi]: readonly [number, number], d: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d;
};

export function sanitizeConfig(input: Partial<GameConfig>): GameConfig {
  const c = { ...CLASSIC, ...input };
  return {
    edition: c.edition === 'extended' ? 'extended' : 'classic',
    tokensToWin: clamp(c.tokensToWin, LIMITS.tokensToWin, 0),
    twoPlayerReveal: c.twoPlayerReveal !== false,
    guardNoGuard: c.guardNoGuard !== false,
    winnerStarts: c.winnerStarts !== false,
    turnTimerSec: clamp(c.turnTimerSec, LIMITS.turnTimerSec, 0),
  };
}

export const tokensFor = (c: GameConfig, players: number) => c.tokensToWin || (players <= 2 ? 7 : players === 3 ? 5 : players === 4 ? 4 : 3);

export function validateConfig(c: GameConfig, players: number): string[] {
  if (c.edition === 'classic' && players > 4) return ['원작 16장은 4명까지예요. 5~6명이면 「확장 (21장)」을 골라 주세요'];
  return [];
}
