export interface GameConfig {
  /** 시작 주사위 수 (보통 5) */
  dice: number;
  /** 주사위 면 수 (보통 6) */
  faces: number;
  /** 1은 어떤 숫자로도 센다 (와일드) */
  wildOnes: boolean;
  /** 1에 거는 특별 규칙: 1로 바꾸면 개수 절반(올림)부터, 1에서 돌아오면 두 배+1부터 (페루 규칙) */
  aceBids: boolean;
  /** 「딱 맞다!」 외치기: 맞으면 주사위 하나를 되찾고, 틀리면 하나 잃어요 */
  exactCall: boolean;
  /** 주사위가 1개가 된 사람이 처음 나오면 그 판은 1이 와일드가 아니고 숫자를 못 바꿔요 */
  palifico: boolean;
  /** 진 사람: die=주사위 1개 잃기, diff=틀린 차이만큼 잃기 */
  penalty: 'die' | 'diff';
  /** 이 개수까지만 다시 늘어남 (딱 맞다로 되찾을 때) */
  maxDice: number;
  /** 몇 게임 (이긴 게임 수로 순위) */
  rounds: number;
  turnTimerSec: number;
}

export const LIMITS = {
  dice: [1, 8],
  faces: [4, 8],
  maxDice: [1, 8],
  rounds: [1, 5],
  turnTimerSec: [0, 120],
  players: [2, 8],
} as const;

export const CLASSIC: GameConfig = {
  dice: 5,
  faces: 6,
  wildOnes: true,
  aceBids: true,
  exactCall: true,
  palifico: false,
  penalty: 'die',
  maxDice: 5,
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
  { id: 'classic', label: '기본 (페루 규칙)', description: '주사위 5개 · 1은 와일드 · 1에 걸면 절반 · 딱 맞다', config: CLASSIC },
  { id: 'simple', label: '단순 규칙', description: '와일드 없이 개수만 · 처음 하는 사람과', config: { ...CLASSIC, wildOnes: false, aceBids: false, exactCall: false } },
  { id: 'pro', label: '팔리피코', description: '주사위 1개가 된 사람 판은 숫자 고정 · 1은 와일드 아님', config: { ...CLASSIC, palifico: true } },
  { id: 'quick', label: '빠른 판', description: '주사위 3개로 시작', config: { ...CLASSIC, dice: 3, maxDice: 3 } },
  { id: 'brutal', label: '차이만큼 잃기', description: '틀린 개수만큼 주사위를 잃어요', config: { ...CLASSIC, penalty: 'diff' } },
];

const clamp = (v: unknown, [lo, hi]: readonly [number, number], d: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d;
};

export function sanitizeConfig(input: Partial<GameConfig>): GameConfig {
  const c = { ...CLASSIC, ...input };
  const dice = clamp(c.dice, LIMITS.dice, 5);
  const wildOnes = c.wildOnes !== false;
  return {
    dice,
    faces: clamp(c.faces, LIMITS.faces, 6),
    wildOnes,
    aceBids: wildOnes && c.aceBids !== false,
    exactCall: c.exactCall !== false,
    palifico: c.palifico === true,
    penalty: c.penalty === 'diff' ? 'diff' : 'die',
    maxDice: Math.max(dice, clamp(c.maxDice, LIMITS.maxDice, dice)),
    rounds: clamp(c.rounds, LIMITS.rounds, 1),
    turnTimerSec: clamp(c.turnTimerSec, LIMITS.turnTimerSec, 0),
  };
}

export function validateConfig(_c: GameConfig, _players: number): string[] {
  return [];
}
