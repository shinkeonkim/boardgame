export interface GameConfig {
  /** 몇 단계까지 (0이면 인원에 맞춰: 2명 12 · 3명 10 · 4명 이상 8) */
  levels: number;
  /** 시작 생명 (0이면 인원 수만큼) */
  lives: number;
  /** 시작 수리검 (모두 동의하면 각자 가장 낮은 카드 한 장씩 버림) */
  stars: number;
  /** 단계를 깨면 생명·수리검 보상 (2·5·8단계 수리검, 3·6·9단계 생명) */
  rewards: boolean;
}

export const LIMITS = {
  levels: [0, 12],
  lives: [0, 6],
  stars: [0, 3],
  players: [2, 6],
} as const;

export const CLASSIC: GameConfig = { levels: 0, lives: 0, stars: 1, rewards: true };

export interface Preset {
  id: string;
  label: string;
  description: string;
  config: GameConfig;
}

export const PRESETS: Preset[] = [
  { id: 'classic', label: '기본', description: '인원에 맞춘 단계 · 생명은 인원 수 · 수리검 1개', config: CLASSIC },
  { id: 'easy', label: '넉넉하게', description: '생명 +2 · 수리검 2개', config: { ...CLASSIC, lives: 6, stars: 2 } },
  { id: 'short', label: '짧게', description: '5단계까지', config: { ...CLASSIC, levels: 5 } },
  { id: 'hard', label: '맨손', description: '보상 없음 · 수리검 없음', config: { ...CLASSIC, stars: 0, rewards: false } },
];

const clamp = (v: unknown, [lo, hi]: readonly [number, number], d: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d;
};

export function sanitizeConfig(input: Partial<GameConfig>): GameConfig {
  const c = { ...CLASSIC, ...input };
  return {
    levels: clamp(c.levels, LIMITS.levels, 0),
    lives: clamp(c.lives, LIMITS.lives, 0),
    stars: clamp(c.stars, LIMITS.stars, 1),
    rewards: c.rewards !== false,
  };
}

export const levelsFor = (c: GameConfig, players: number) => c.levels || (players <= 2 ? 12 : players === 3 ? 10 : 8);
export const livesFor = (c: GameConfig, players: number) => c.lives || Math.min(5, players);

export function validateConfig(c: GameConfig, players: number): string[] {
  if (levelsFor(c, players) * players > 100) return [`${players}명이면 ${Math.floor(100 / players)}단계까지만 할 수 있어요`];
  return [];
}
