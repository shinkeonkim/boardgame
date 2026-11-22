export interface GameConfig {
  /** 카드 수 (맞혀야 할 단어 수) */
  cards: number;
  /** 단어 묶음 */
  pack: 'all' | 'nature' | 'daily' | 'fantasy';
  /** 같은 힌트 판정: exact = 글자가 같을 때만, similar = 한쪽이 다른 쪽을 품거나 앞 두 글자가 같아도 */
  dupes: 'exact' | 'similar';
  /** 틀리면 다음 카드도 잃기 (원작 규칙) */
  wrongCostsNext: boolean;
  /** 힌트 쓰는 시간 (0 = 없음) */
  clueSec: number;
  /** 맞히는 시간 (0 = 없음) */
  guessSec: number;
  rounds: number;
}

export const LIMITS = {
  cards: [5, 20],
  clueSec: [0, 120],
  guessSec: [0, 120],
  rounds: [1, 3],
  players: [3, 8],
} as const;

export const CLASSIC: GameConfig = { cards: 13, pack: 'all', dupes: 'similar', wrongCostsNext: true, clueSec: 0, guessSec: 0, rounds: 1 };

export interface Preset {
  id: string;
  label: string;
  description: string;
  config: GameConfig;
}

export const PRESETS: Preset[] = [
  { id: 'classic', label: '기본', description: '13장 · 비슷한 힌트도 지워짐 · 틀리면 다음 카드도 잃어요', config: CLASSIC },
  { id: 'easy', label: '느긋하게', description: '똑같은 힌트만 지워짐 · 틀려도 그 카드만', config: { ...CLASSIC, dupes: 'exact', wrongCostsNext: false } },
  { id: 'quick', label: '짧게', description: '7장 · 힌트 60초', config: { ...CLASSIC, cards: 7, clueSec: 60, guessSec: 45 } },
  { id: 'nature', label: '자연·동물', description: '자연과 동물 단어만', config: { ...CLASSIC, pack: 'nature' } },
  { id: 'fantasy', label: '모험·상상', description: '동화·마법·우주 단어만', config: { ...CLASSIC, pack: 'fantasy' } },
];

const clamp = (v: unknown, [lo, hi]: readonly [number, number], d: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d;
};

export function sanitizeConfig(input: Partial<GameConfig>): GameConfig {
  const c = { ...CLASSIC, ...input };
  return {
    cards: clamp(c.cards, LIMITS.cards, 13),
    pack: (['all', 'nature', 'daily', 'fantasy'] as const).includes(c.pack) ? c.pack : 'all',
    dupes: c.dupes === 'exact' ? 'exact' : 'similar',
    wrongCostsNext: c.wrongCostsNext !== false,
    clueSec: clamp(c.clueSec, LIMITS.clueSec, 0),
    guessSec: clamp(c.guessSec, LIMITS.guessSec, 0),
    rounds: clamp(c.rounds, LIMITS.rounds, 1),
  };
}

export function validateConfig(_c: GameConfig, players: number): string[] {
  return players < 3 ? ['3명 이상이어야 해요 (봇으로 채울 수 있어요)'] : [];
}
