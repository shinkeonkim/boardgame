export interface GameConfig {
  /** 깃발 수 (원작 9) */
  flags: number;
  /** 깃발 한쪽에 놓는 카드 수 = 대형 크기 (원작 3) */
  size: number;
  /** 색 수 (원작 6) */
  colors: number;
  /** 숫자 범위 1~maxValue (원작 10) */
  maxValue: number;
  /** 손패 (원작 7) */
  handSize: number;
  /** 이만큼 깃발을 가지면 승리 (0 = 과반) */
  flagsToWin: number;
  /** 이만큼 연속한 깃발을 가지면 승리 (원작 3, 0 = 쓰지 않음) */
  adjacentToWin: number;
  /** 확정된 깃발을 차례 시작에 자동으로 가져가기 (온라인 편의) */
  autoClaim: boolean;
  rounds: number;
  turnTimerSec: number;
}

export const LIMITS = {
  flags: [5, 11],
  size: [2, 4],
  colors: [4, 6],
  maxValue: [8, 12],
  handSize: [5, 9],
  flagsToWin: [0, 9],
  adjacentToWin: [0, 5],
  rounds: [1, 5],
  turnTimerSec: [0, 180],
  players: [2, 4],
} as const;

export const CLASSIC: GameConfig = {
  flags: 9,
  size: 3,
  colors: 6,
  maxValue: 10,
  handSize: 7,
  flagsToWin: 0,
  adjacentToWin: 3,
  autoClaim: true,
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
  { id: 'classic', label: '원작', description: '깃발 9 · 3장 대형 · 6색 1~10 · 깃발 5개 또는 연속 3개', config: CLASSIC },
  { id: 'short', label: '짧은 전선', description: '깃발 7 · 4개 또는 연속 3개', config: { ...CLASSIC, flags: 7 } },
  { id: 'teams', label: '2:2 팀전', description: '4명 · 같은 편이 번갈아 · 손패 6', config: { ...CLASSIC, handSize: 6 } },
  { id: 'big', label: '4장 대형', description: '대형 4장 · 숫자 1~12', config: { ...CLASSIC, size: 4, maxValue: 12, handSize: 8 } },
];

const clamp = (v: unknown, [lo, hi]: readonly [number, number], d: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d;
};

export function sanitizeConfig(input: Partial<GameConfig>): GameConfig {
  const c = { ...CLASSIC, ...input };
  const flags = clamp(c.flags, LIMITS.flags, 9);
  return {
    flags,
    size: clamp(c.size, LIMITS.size, 3),
    colors: clamp(c.colors, LIMITS.colors, 6),
    maxValue: clamp(c.maxValue, LIMITS.maxValue, 10),
    handSize: clamp(c.handSize, LIMITS.handSize, 7),
    flagsToWin: Math.min(flags, clamp(c.flagsToWin, LIMITS.flagsToWin, 0)),
    adjacentToWin: Math.min(flags, clamp(c.adjacentToWin, LIMITS.adjacentToWin, 3)),
    autoClaim: c.autoClaim !== false,
    rounds: clamp(c.rounds, LIMITS.rounds, 1),
    turnTimerSec: clamp(c.turnTimerSec, LIMITS.turnTimerSec, 0),
  };
}

export const majority = (c: GameConfig) => c.flagsToWin || Math.floor(c.flags / 2) + 1;
export const deckSize = (c: GameConfig) => c.colors * c.maxValue;

export function validateConfig(c: GameConfig, players: number): string[] {
  const errors: string[] = [];
  if (players === 3) errors.push('2명 또는 4명(2:2 팀전)으로 해요');
  if (deckSize(c) < c.flags * c.size * 2) errors.push(`카드가 모자라 깃발을 다 채울 수 없어요(${deckSize(c)}장, ${c.flags * c.size * 2}장 필요). 색이나 숫자를 늘리거나 깃발을 줄여 주세요`);
  if (c.handSize * players >= deckSize(c)) errors.push('손패가 너무 많아요');
  return errors;
}
