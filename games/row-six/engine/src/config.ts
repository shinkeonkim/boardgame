export interface GameConfig {
  /** 카드 숫자 1~maxCard (원작 104) */
  maxCard: number;
  /** 줄 수 (원작 4) */
  rows: number;
  /** 한 줄에 놓을 수 있는 카드 수 — 다음 카드가 오면 그 사람이 줄을 가져간다 (원작 5 → 6번째가 가져감) */
  rowLimit: number;
  /** 한 판에 나눠 주는 카드 (원작 10) */
  handSize: number;
  /** 벌점 계산: classic=원작 규칙(5의 배수 2·10의 배수 3·같은 숫자 두 자리 5·55는 7), flat=모두 1점 */
  penalty: 'classic' | 'flat';
  /** 가장 작은 카드보다 작은 카드를 냈을 때: choose=가져갈 줄을 직접 고름(원작), fewest=벌점이 가장 적은 줄을 자동으로 */
  lowCard: 'choose' | 'fewest';
  /** 끝내는 방법: target=누군가 목표 벌점에 닿으면(원작 66), rounds=정한 판 수만큼 */
  endMode: 'target' | 'rounds';
  /** 목표 벌점 (endMode=target) */
  target: number;
  /** 판 수 (endMode=rounds) — target 모드에서도 최대 판 수로 쓴다 */
  rounds: number;
  /** 가져간 벌점을 모두에게 보여 주기 (원작은 뒤집어 둠) */
  openPenalties: boolean;
  /** 고른 카드를 공개하기 전에 바꿀 수 있음 */
  allowChange: boolean;
  /** 0 = 제한 없음 (모두가 고를 때까지의 시간) */
  turnTimerSec: number;
  /** 2명씩 팀 (좌석 0·1 / 2·3 …) 벌점 합산 — 짝수 인원 4명 이상 */
  teams: boolean;
}

export const LIMITS = {
  maxCard: [30, 154],
  rows: [3, 6],
  rowLimit: [3, 7],
  handSize: [5, 12],
  target: [20, 200],
  rounds: [1, 10],
  turnTimerSec: [0, 120],
  players: [2, 10],
} as const;

export const CLASSIC: GameConfig = {
  maxCard: 104,
  rows: 4,
  rowLimit: 5,
  handSize: 10,
  penalty: 'classic',
  lowCard: 'choose',
  endMode: 'target',
  target: 66,
  rounds: 10,
  openPenalties: true,
  allowChange: true,
  turnTimerSec: 0,
  teams: false,
};

export interface Preset {
  id: string;
  label: string;
  description: string;
  config: GameConfig;
}

export const PRESETS: Preset[] = [
  { id: 'classic', label: '원작 (66점)', description: '1~104 · 4줄 · 6번째에 가져감 · 66점이 넘으면 끝', config: CLASSIC },
  { id: 'quick', label: '한 판만', description: '10장 한 판으로 바로 결판', config: { ...CLASSIC, endMode: 'rounds', rounds: 1 } },
  {
    id: 'tactical',
    label: '수 싸움 (인원 맞춤)',
    description: '1~44(4명 기준) · 모든 카드가 나와 셈이 가능 · 인원이 다르면 「인원에 맞추기」',
    config: { ...CLASSIC, maxCard: 44 },
  },
  { id: 'easy', label: '처음 하는 사람', description: '벌점 모두 1점 · 작은 카드는 가장 가벼운 줄을 자동으로', config: { ...CLASSIC, penalty: 'flat', lowCard: 'fewest', target: 30 } },
  { id: 'tight', label: '좁은 줄', description: '3줄 · 4번째에 가져가는 빡빡한 판', config: { ...CLASSIC, rows: 3, rowLimit: 3, target: 50 } },
  { id: 'party', label: '큰 모임 (8~10명)', description: '1~124 · 5줄 · 손패 9장', config: { ...CLASSIC, maxCard: 124, rows: 5, handSize: 9 } },
];

const clamp = (v: unknown, [lo, hi]: readonly [number, number], d: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d;
};

export function sanitizeConfig(input: Partial<GameConfig>): GameConfig {
  const c = { ...CLASSIC, ...input };
  return {
    maxCard: clamp(c.maxCard, LIMITS.maxCard, CLASSIC.maxCard),
    rows: clamp(c.rows, LIMITS.rows, CLASSIC.rows),
    rowLimit: clamp(c.rowLimit, LIMITS.rowLimit, CLASSIC.rowLimit),
    handSize: clamp(c.handSize, LIMITS.handSize, CLASSIC.handSize),
    penalty: c.penalty === 'flat' ? 'flat' : 'classic',
    lowCard: c.lowCard === 'fewest' ? 'fewest' : 'choose',
    endMode: c.endMode === 'rounds' ? 'rounds' : 'target',
    target: clamp(c.target, LIMITS.target, CLASSIC.target),
    rounds: clamp(c.rounds, LIMITS.rounds, CLASSIC.rounds),
    openPenalties: c.openPenalties !== false,
    allowChange: c.allowChange !== false,
    turnTimerSec: clamp(c.turnTimerSec, LIMITS.turnTimerSec, 0),
    teams: c.teams === true,
  };
}

/** 한 판에 필요한 카드 수 */
export const cardsNeeded = (c: GameConfig, players: number) => players * c.handSize + c.rows;

/** 인원에 맞는 추천 카드 범위 (원작 비율: 10명이면 104장 모두) */
export const suggestedMaxCard = (c: GameConfig, players: number) => Math.max(cardsNeeded(c, players), Math.min(LIMITS.maxCard[1], Math.round(cardsNeeded(c, players) * 1.0)));

export function validateConfig(c: GameConfig, players: number): string[] {
  const errors: string[] = [];
  const need = cardsNeeded(c, players);
  if (need > c.maxCard) errors.push(`카드가 모자라요(1~${c.maxCard}, ${players}명이면 ${need}장 필요). 카드 범위를 늘리거나 손패를 줄여 주세요`);
  if (c.teams && (players < 4 || players % 2 === 1)) errors.push('팀전은 4명 이상 짝수 인원일 때만 할 수 있어요');
  return errors;
}

/** 이 숫자 카드의 벌점 */
export function penaltyOf(c: Pick<GameConfig, 'penalty'>, n: number): number {
  if (c.penalty === 'flat') return 1;
  if (n === 55) return 7;
  if (n % 11 === 0) return 5;
  if (n % 10 === 0) return 3;
  if (n % 5 === 0) return 2;
  return 1;
}

/** 한 사람이 평균 몇 번 고르는지 */
export const turnsPerRound = (c: GameConfig) => c.handSize;
