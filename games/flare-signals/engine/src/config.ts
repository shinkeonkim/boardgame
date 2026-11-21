export interface GameConfig {
  /** 색 수: 5(원작) 또는 6 */
  colors: number;
  /** 여섯째 색의 성격: plain=보통 색, rainbow=모든 색 힌트에 반응하는 무지개 (colors=6일 때) */
  sixth: 'plain' | 'rainbow';
  /** 여섯째 색 카드 구성: full=다른 색처럼 10장, single=숫자마다 1장(5장, 모두 마지막 한 장) */
  sixthCount: 'full' | 'single';
  /** 0이면 인원에 따라 자동 (2~3명 5장, 4~5명 4장, 6명 3장) */
  handSize: number;
  /** 정보 토큰 (원작 8) */
  hints: number;
  /** 실수 허용 — 이만큼 틀리면 실패 (원작 3) */
  fuses: number;
  /** 실패했을 때 점수: zero=0점(최근 규칙), keep=쌓은 만큼 */
  bombScore: 'zero' | 'keep';
  /** 해당 카드가 없는 힌트도 허용 ("빨간색은 하나도 없어요") */
  emptyHints: boolean;
  /** 받은 힌트를 카드에 표시 (초보 도움 — 끄면 기억해야 해요) */
  showClues: boolean;
  /** 카드마다 가능한 색·숫자를 계산해 보여 주기 (카드 세기 도움) */
  showPossibilities: boolean;
  /** 덱이 바닥나면 한 바퀴 더 (원작) / 바로 끝 */
  lastRound: boolean;
  rounds: number;
  /** 0 = 제한 없음 */
  turnTimerSec: number;
}

export const LIMITS = {
  colors: [5, 6],
  handSize: [0, 6],
  hints: [3, 12],
  fuses: [1, 6],
  rounds: [1, 5],
  turnTimerSec: [0, 300],
  players: [2, 6],
} as const;

export const CLASSIC: GameConfig = {
  colors: 5,
  sixth: 'plain',
  sixthCount: 'full',
  handSize: 0,
  hints: 8,
  fuses: 3,
  bombScore: 'zero',
  emptyHints: false,
  showClues: true,
  showPossibilities: false,
  lastRound: true,
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
  { id: 'classic', label: '원작', description: '5색 · 힌트 8 · 실수 3번이면 실패', config: CLASSIC },
  { id: 'learn', label: '처음 하는 사람', description: '실수 5번까지 · 가능한 카드 계산 표시 · 실패해도 점수 유지', config: { ...CLASSIC, fuses: 5, showPossibilities: true, bombScore: 'keep' } },
  { id: 'six', label: '6색 (30점)', description: '여섯째 색을 보통 색으로 더해 30점 만점', config: { ...CLASSIC, colors: 6 } },
  { id: 'rainbow', label: '무지개', description: '무지개는 모든 색 힌트에 반응해요 · 숫자마다 1장', config: { ...CLASSIC, colors: 6, sixth: 'rainbow', sixthCount: 'single' } },
  { id: 'hard', label: '기억력 도전', description: '힌트 표시 없이 기억으로 · 힌트 6개', config: { ...CLASSIC, showClues: false, hints: 6 } },
];

const clamp = (v: unknown, [lo, hi]: readonly [number, number], d: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d;
};

export function sanitizeConfig(input: Partial<GameConfig>): GameConfig {
  const c = { ...CLASSIC, ...input };
  return {
    colors: clamp(c.colors, LIMITS.colors, 5),
    sixth: c.sixth === 'rainbow' ? 'rainbow' : 'plain',
    sixthCount: c.sixthCount === 'single' ? 'single' : 'full',
    handSize: clamp(c.handSize, LIMITS.handSize, 0),
    hints: clamp(c.hints, LIMITS.hints, 8),
    fuses: clamp(c.fuses, LIMITS.fuses, 3),
    bombScore: c.bombScore === 'keep' ? 'keep' : 'zero',
    emptyHints: c.emptyHints === true,
    showClues: c.showClues !== false,
    showPossibilities: c.showPossibilities === true,
    lastRound: c.lastRound !== false,
    rounds: clamp(c.rounds, LIMITS.rounds, 1),
    turnTimerSec: clamp(c.turnTimerSec, LIMITS.turnTimerSec, 0),
  };
}

export const handSizeFor = (c: GameConfig, players: number) => c.handSize || (players <= 3 ? 5 : players <= 5 ? 4 : 3);

/** 숫자별 장수 (1×3, 2×2, 3×2, 4×2, 5×1) */
export const COPIES = [0, 3, 2, 2, 2, 1];

export const copiesOf = (c: GameConfig, color: number, value: number) => (color === 5 && c.sixthCount === 'single' ? 1 : COPIES[value]);

export const deckSize = (c: GameConfig) => {
  let n = 0;
  for (let color = 0; color < c.colors; color++) for (let v = 1; v <= 5; v++) n += copiesOf(c, color, v);
  return n;
};

export const maxScore = (c: GameConfig) => c.colors * 5;

export function validateConfig(c: GameConfig, players: number): string[] {
  const errors: string[] = [];
  if (players * handSizeFor(c, players) >= deckSize(c)) errors.push('손패가 너무 많아 덱이 모자라요. 손패를 줄여 주세요');
  return errors;
}
