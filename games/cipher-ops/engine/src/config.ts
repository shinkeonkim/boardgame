import { PACKS, packWords } from './words';

export interface GameConfig {
  /** 보드 한 변 (원작 5 → 25장) */
  size: number;
  /** 암살자 카드 수 — 고르면 그 팀이 바로 져요 (원작 1) */
  assassins: number;
  /** 단어 묶음 */
  pack: string;
  /** 방장이 넣은 단어 (쉼표·줄바꿈으로 구분). 있으면 묶음 대신(모자라면 묶음에서 채움) */
  customWords: string;
  /** 한 번에 맞힐 수 있는 수: plusOne=숫자+1(원작), exact=숫자만큼, unlimited=틀릴 때까지 */
  guessLimit: 'plusOne' | 'exact' | 'unlimited';
  /** 판마다 팀장을 돌아가며 맡기 */
  rotateSpymaster: boolean;
  /** 판 수 — 이긴 판 수로 순위 */
  rounds: number;
  /** 힌트 주는 시간 (0 = 제한 없음) — 요원 차례에도 같은 시간 */
  turnTimerSec: number;
}

export const LIMITS = {
  size: [4, 6],
  assassins: [0, 3],
  rounds: [1, 7],
  turnTimerSec: [0, 300],
  players: [4, 10],
} as const;

export const CLASSIC: GameConfig = {
  size: 5,
  assassins: 1,
  pack: 'all',
  customWords: '',
  guessLimit: 'plusOne',
  rotateSpymaster: true,
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
  { id: 'classic', label: '원작', description: '5×5 · 암살자 1 · 숫자+1번까지', config: CLASSIC },
  { id: 'quick', label: '빠른 판 (4×4)', description: '16장 · 팀마다 6·5장', config: { ...CLASSIC, size: 4 } },
  { id: 'big', label: '큰 판 (6×6)', description: '36장 · 암살자 2', config: { ...CLASSIC, size: 6, assassins: 2 } },
  { id: 'safe', label: '암살자 없음', description: '처음 하는 사람과 함께', config: { ...CLASSIC, assassins: 0 } },
  { id: 'series', label: '3판 2선승', description: '팀장을 돌아가며 3판', config: { ...CLASSIC, rounds: 3 } },
];

const clamp = (v: unknown, [lo, hi]: readonly [number, number], d: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d;
};

export function parseCustom(s: string): string[] {
  return [...new Set(s.split(/[,\n]/).map((w) => w.trim().replace(/\s+/g, '')).filter((w) => w.length >= 1 && w.length <= 12))];
}

export function sanitizeConfig(input: Partial<GameConfig>): GameConfig {
  const c = { ...CLASSIC, ...input };
  return {
    size: clamp(c.size, LIMITS.size, 5),
    assassins: clamp(c.assassins, LIMITS.assassins, 1),
    pack: typeof c.pack === 'string' && PACKS[c.pack] ? c.pack : 'all',
    customWords: typeof c.customWords === 'string' ? parseCustom(c.customWords.slice(0, 3000)).join(', ') : '',
    guessLimit: c.guessLimit === 'exact' || c.guessLimit === 'unlimited' ? c.guessLimit : 'plusOne',
    rotateSpymaster: c.rotateSpymaster !== false,
    rounds: clamp(c.rounds, LIMITS.rounds, 1),
    turnTimerSec: clamp(c.turnTimerSec, LIMITS.turnTimerSec, 0),
  };
}

/** 카드 배분: 먼저 하는 팀 / 나중 팀 / 중립 / 암살자 (원작 5×5: 9·8·7·1) */
export function layout(c: GameConfig) {
  const total = c.size * c.size;
  const second = Math.round(total * 0.32);
  const first = second + 1;
  const neutral = total - first - second - c.assassins;
  return { total, first, second, neutral, assassins: c.assassins };
}

export const wordPool = (c: GameConfig) => {
  const custom = parseCustom(c.customWords);
  const pack = packWords(c.pack);
  return [...new Set([...custom, ...pack])];
};

export function validateConfig(c: GameConfig, players: number): string[] {
  const errors: string[] = [];
  const l = layout(c);
  if (l.neutral < 0) errors.push('암살자가 너무 많아요. 줄여 주세요');
  if (wordPool(c).length < l.total) errors.push(`단어가 모자라요(${wordPool(c).length}개, ${l.total}개 필요). 단어 묶음을 바꾸거나 단어를 더 넣어 주세요`);
  if (players < 4) errors.push('팀마다 팀장 1명 + 요원 1명 이상, 모두 4명이 필요해요 (봇으로 채울 수 있어요)');
  return errors;
}
