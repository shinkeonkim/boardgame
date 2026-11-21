export interface GameConfig {
  /** 이 점수에 닿으면 그 바퀴까지 하고 끝 (원작 15) */
  winPoints: number;
  /** 색마다 보석 수 (0 = 인원에 따라 자동: 2명 4 · 3명 5 · 4명 7 · 5명 8 · 6명 9) */
  gemsPerColor: number;
  /** 황금(조커) 수 (원작 5) */
  gold: number;
  /** 단계마다 펼쳐 놓는 카드 수 (원작 4) */
  market: number;
  /** 예약 최대 (원작 3) */
  maxReserve: number;
  /** 들고 있을 수 있는 보석 최대 (원작 10) */
  tokenLimit: number;
  /** 귀족 수 (0 = 인원+1 자동, -1 = 귀족 없음) */
  nobles: number;
  /** 같은 색 2개를 가져가려면 그 색이 이만큼 이상 남아야 (원작 4) */
  takeTwoMin: number;
  rounds: number;
  turnTimerSec: number;
}

export const LIMITS = {
  winPoints: [8, 25],
  gemsPerColor: [0, 10],
  gold: [0, 8],
  market: [3, 5],
  maxReserve: [0, 5],
  tokenLimit: [6, 14],
  nobles: [-1, 7],
  takeTwoMin: [3, 6],
  rounds: [1, 3],
  turnTimerSec: [0, 180],
  players: [2, 6],
} as const;

export const CLASSIC: GameConfig = {
  winPoints: 15,
  gemsPerColor: 0,
  gold: 5,
  market: 4,
  maxReserve: 3,
  tokenLimit: 10,
  nobles: 0,
  takeTwoMin: 4,
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
  { id: 'classic', label: '원작 (15점)', description: '귀족 인원+1 · 황금 5 · 예약 3', config: CLASSIC },
  { id: 'quick', label: '빠른 판 (10점)', description: '10점에 닿으면 마무리', config: { ...CLASSIC, winPoints: 10 } },
  { id: 'long', label: '긴 판 (21점)', description: '시장 5장씩', config: { ...CLASSIC, winPoints: 21, market: 5 } },
  { id: 'nonobles', label: '귀족 없음', description: '카드 점수만으로', config: { ...CLASSIC, nobles: -1 } },
];

const clamp = (v: unknown, [lo, hi]: readonly [number, number], d: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d;
};

export function sanitizeConfig(input: Partial<GameConfig>): GameConfig {
  const c = { ...CLASSIC, ...input };
  return {
    winPoints: clamp(c.winPoints, LIMITS.winPoints, 15),
    gemsPerColor: clamp(c.gemsPerColor, LIMITS.gemsPerColor, 0),
    gold: clamp(c.gold, LIMITS.gold, 5),
    market: clamp(c.market, LIMITS.market, 4),
    maxReserve: clamp(c.maxReserve, LIMITS.maxReserve, 3),
    tokenLimit: clamp(c.tokenLimit, LIMITS.tokenLimit, 10),
    nobles: clamp(c.nobles, LIMITS.nobles, 0),
    takeTwoMin: clamp(c.takeTwoMin, LIMITS.takeTwoMin, 4),
    rounds: clamp(c.rounds, LIMITS.rounds, 1),
    turnTimerSec: clamp(c.turnTimerSec, LIMITS.turnTimerSec, 0),
  };
}

export const gemsFor = (c: GameConfig, players: number) => c.gemsPerColor || [0, 0, 4, 5, 7, 8, 9][players] || 7;
export const noblesFor = (c: GameConfig, players: number) => (c.nobles < 0 ? 0 : c.nobles || players + 1);

export function validateConfig(): string[] {
  return [];
}
