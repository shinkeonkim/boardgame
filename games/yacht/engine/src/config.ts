/** 족보 */
export type Cat =
  | 'ones'
  | 'twos'
  | 'threes'
  | 'fours'
  | 'fives'
  | 'sixes'
  | 'choice'
  | 'threeKind'
  | 'fourKind'
  | 'fullHouse'
  | 'smallStraight'
  | 'largeStraight'
  | 'yacht';

export const UPPER: Cat[] = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes'];

export interface GameConfig {
  /** 족보: yacht = 기본 12칸 (포카드·풀하우스는 주사위 합), extended = 확장 13칸 (트리플, 풀하우스 25, 스트레이트 30/40, 요트 추가 보너스) */
  scoring: 'yacht' | 'extended';
  /** 한 차례에 굴릴 수 있는 횟수 */
  rolls: number;
  /** 위쪽(1~6) 합이 이 점수 이상이면 보너스 */
  bonusAt: number;
  bonus: number;
  /** 진행: turns = 한 명씩, together = 모두 동시에 (각자 자기 점수표, 같은 차례 수를 맞춰 진행) */
  mode: 'turns' | 'together';
  /** 몇 게임 (게임마다 점수표를 새로) */
  rounds: number;
  turnTimerSec: number;
}

export const LIMITS = {
  rolls: [1, 5],
  bonusAt: [0, 105],
  bonus: [0, 100],
  rounds: [1, 5],
  turnTimerSec: [0, 120],
  players: [1, 8],
} as const;

export const CLASSIC: GameConfig = { scoring: 'yacht', rolls: 3, bonusAt: 63, bonus: 35, mode: 'turns', rounds: 1, turnTimerSec: 0 };

export interface Preset {
  id: string;
  label: string;
  description: string;
  config: GameConfig;
}

export const PRESETS: Preset[] = [
  { id: 'classic', label: '기본 요트', description: '12칸 · 3번 굴리기 · 63점 넘으면 +35', config: CLASSIC },
  { id: 'together', label: '모두 동시에', description: '각자 자기 점수표를 한꺼번에 — 많이 모였을 때 빨라요', config: { ...CLASSIC, mode: 'together' } },
  { id: 'extended', label: '확장 족보', description: '트리플 추가 · 풀하우스 25 · 스트레이트 30/40 · 요트를 또 내면 +100', config: { ...CLASSIC, scoring: 'extended' } },
  { id: 'lucky', label: '넉넉하게', description: '4번까지 굴리기 · 처음 하는 사람과', config: { ...CLASSIC, rolls: 4 } },
  { id: 'hard', label: '한 번 더 어렵게', description: '2번만 굴리기 · 보너스 기준 73점', config: { ...CLASSIC, rolls: 2, bonusAt: 73 } },
];

export function catsFor(c: Pick<GameConfig, 'scoring'>): Cat[] {
  return c.scoring === 'extended'
    ? [...UPPER, 'threeKind', 'fourKind', 'fullHouse', 'smallStraight', 'largeStraight', 'yacht', 'choice']
    : [...UPPER, 'choice', 'fourKind', 'fullHouse', 'smallStraight', 'largeStraight', 'yacht'];
}

const clamp = (v: unknown, [lo, hi]: readonly [number, number], d: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d;
};

export function sanitizeConfig(input: Partial<GameConfig>): GameConfig {
  const c = { ...CLASSIC, ...input };
  return {
    scoring: c.scoring === 'extended' ? 'extended' : 'yacht',
    rolls: clamp(c.rolls, LIMITS.rolls, 3),
    bonusAt: clamp(c.bonusAt, LIMITS.bonusAt, 63),
    bonus: clamp(c.bonus, LIMITS.bonus, 35),
    mode: c.mode === 'together' ? 'together' : 'turns',
    rounds: clamp(c.rounds, LIMITS.rounds, 1),
    turnTimerSec: clamp(c.turnTimerSec, LIMITS.turnTimerSec, 0),
  };
}

export function validateConfig(_c: GameConfig, _players: number): string[] {
  return [];
}
