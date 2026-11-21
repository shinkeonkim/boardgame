export interface GameConfig {
  /** classic = 20×20 네 귀퉁이 · duo = 2명 14×14 가운데 두 점 */
  mode: 'classic' | 'duo';
  /** 판 크기 (classic 14~22, duo 12~16) */
  size: number;
  /** 조각: full = 21개, small = 1~4칸 9개(빠른 판), noFive = 5칸 빼고 */
  pieceSet: 'full' | 'small' | 'medium';
  /** 점수: basic = 남은 칸 −1씩, advanced = + 다 놓으면 +15, 마지막이 1칸이면 +5 더 */
  scoring: 'basic' | 'advanced';
  rounds: number;
  turnTimerSec: number;
}

export const LIMITS = {
  size: [12, 22],
  rounds: [1, 3],
  turnTimerSec: [0, 180],
  players: [2, 4],
} as const;

export const CLASSIC: GameConfig = {
  mode: 'classic',
  size: 20,
  pieceSet: 'full',
  scoring: 'advanced',
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
  { id: 'classic', label: '원작 (4색)', description: '20×20 · 조각 21개 · 2명이면 두 색씩', config: CLASSIC },
  { id: 'duo', label: '둘이서 (14×14)', description: '2명 · 가운데 가까운 두 점에서 시작', config: { ...CLASSIC, mode: 'duo', size: 14 } },
  { id: 'quick', label: '빠른 판', description: '14×14 · 1~4칸 조각만', config: { ...CLASSIC, size: 14, pieceSet: 'small' } },
  { id: 'basic', label: '단순 점수', description: '남은 칸만큼 감점', config: { ...CLASSIC, scoring: 'basic' } },
];

export function sanitizeConfig(input: Partial<GameConfig>): GameConfig {
  const c = { ...CLASSIC, ...input };
  const mode = c.mode === 'duo' ? 'duo' : 'classic';
  const n = Math.round(Number(c.size));
  return {
    mode,
    size: Number.isFinite(n) ? Math.min(mode === 'duo' ? 16 : 22, Math.max(mode === 'duo' ? 12 : 14, n)) : mode === 'duo' ? 14 : 20,
    pieceSet: c.pieceSet === 'small' || c.pieceSet === 'medium' ? c.pieceSet : 'full',
    scoring: c.scoring === 'basic' ? 'basic' : 'advanced',
    rounds: Math.min(3, Math.max(1, Math.round(Number(c.rounds)) || 1)),
    turnTimerSec: Math.min(180, Math.max(0, Math.round(Number(c.turnTimerSec)) || 0)),
  };
}

export function validateConfig(c: GameConfig, players: number): string[] {
  if (c.mode === 'duo' && players !== 2) return ['둘이서 모드는 2명일 때만 해요'];
  return [];
}

/** 색 수: classic 4, duo 2 */
export const colorCount = (c: GameConfig) => (c.mode === 'duo' ? 2 : 4);

/** 색마다 시작 칸 */
export function startCell(c: GameConfig, color: number): [number, number] {
  const s = c.size;
  if (c.mode === 'duo') return color === 0 ? [4, 4] : [s - 5, s - 5];
  return [[0, 0], [s - 1, 0], [s - 1, s - 1], [0, s - 1]][color] as [number, number];
}

/** 좌석별 색: 4명 1색씩 · 2명 0·2 / 1·3 · 3명은 4번째 색을 돌아가며 (owner = -1 → 차례마다 바뀜) */
export function colorOwner(c: GameConfig, players: number, color: number): number {
  if (c.mode === 'duo') return color;
  if (players === 4) return color;
  if (players === 2) return color % 2;
  return color < 3 ? color : -1;
}
