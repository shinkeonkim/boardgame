export interface GameConfig {
  /** 누가 이 점수에 닿으면 그 판으로 끝 (점수가 가장 낮은 사람이 승리) */
  target: number;
  /** 판마다 카드 3장 건네기 (왼쪽 → 오른쪽 → 맞은편 → 안 건넴) */
  passing: boolean;
  /** 문(moon) 쏘기: 하트 전부 + 스페이드 Q 를 혼자 먹으면 나머지가 모두 26점 */
  shootMoon: boolean;
  /** 다이아 J 를 먹으면 -10 (변형) */
  jackBonus: boolean;
  turnTimerSec: number;
}

export const LIMITS = {
  target: [30, 150],
  turnTimerSec: [0, 120],
  players: [3, 6],
} as const;

export const CLASSIC: GameConfig = { target: 100, passing: true, shootMoon: true, jackBonus: false, turnTimerSec: 0 };

export interface Preset {
  id: string;
  label: string;
  description: string;
  config: GameConfig;
}

export const PRESETS: Preset[] = [
  { id: 'classic', label: '기본 하트', description: '100점에 닿으면 끝 · 3장 건네기 · 문 쏘기', config: CLASSIC },
  { id: 'quick', label: '짧게', description: '50점에 닿으면 끝', config: { ...CLASSIC, target: 50 } },
  { id: 'jack', label: '다이아 J -10', description: '다이아 J 를 먹으면 10점을 빼 줘요', config: { ...CLASSIC, jackBonus: true } },
  { id: 'simple', label: '건네기 없이', description: '처음 하는 사람과 — 건네기·문 쏘기 없음', config: { ...CLASSIC, passing: false, shootMoon: false, target: 50 } },
];

const clamp = (v: unknown, [lo, hi]: readonly [number, number], d: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d;
};

export function sanitizeConfig(input: Partial<GameConfig>): GameConfig {
  const c = { ...CLASSIC, ...input };
  return {
    target: Math.round(clamp(c.target, LIMITS.target, 100) / 10) * 10,
    passing: c.passing !== false,
    shootMoon: c.shootMoon !== false,
    jackBonus: c.jackBonus === true,
    turnTimerSec: clamp(c.turnTimerSec, LIMITS.turnTimerSec, 0),
  };
}

export function validateConfig(_c: GameConfig, players: number): string[] {
  return players < 3 ? ['하트는 3명부터 할 수 있어요'] : [];
}
