export interface GameConfig {
  /** 색 수 = 벽 크기 (원작 5) */
  colors: number;
  /** 색마다 타일 수 (원작 20) */
  tilesPerColor: number;
  /** 공장 수 (0 = 인원×2+1 자동) */
  factories: number;
  /** 공장마다 타일 (원작 4) */
  perFactory: number;
  /** 자유 벽 (원작 뒷면: 같은 줄·같은 칸에 같은 색만 없으면 어디든) */
  freeWall: boolean;
  /** 바닥 감점 (원작 −1,−1,−2,−2,−2,−3,−3) */
  floor: number[];
  /** 끝 보너스: 가로줄 / 세로줄 / 한 색 모두 */
  rowBonus: number;
  colBonus: number;
  colorBonus: number;
  /** 0이면 가로줄 완성으로 끝(원작), 아니면 이 판 수에 끝 */
  maxRounds: number;
  rounds: number;
  turnTimerSec: number;
}

export const LIMITS = {
  colors: [4, 6],
  tilesPerColor: [12, 30],
  factories: [0, 11],
  perFactory: [3, 5],
  rowBonus: [0, 5],
  colBonus: [0, 12],
  colorBonus: [0, 15],
  maxRounds: [0, 10],
  rounds: [1, 3],
  turnTimerSec: [0, 180],
  players: [2, 4],
} as const;

export const CLASSIC: GameConfig = {
  colors: 5,
  tilesPerColor: 20,
  factories: 0,
  perFactory: 4,
  freeWall: false,
  floor: [-1, -1, -2, -2, -2, -3, -3],
  rowBonus: 2,
  colBonus: 7,
  colorBonus: 10,
  maxRounds: 0,
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
  { id: 'classic', label: '원작', description: '5색 · 정해진 벽 무늬 · 가로줄 완성하면 끝', config: CLASSIC },
  { id: 'free', label: '자유 벽', description: '원작 뒷면 — 벽 어디에 놓을지 직접 골라요', config: { ...CLASSIC, freeWall: true } },
  { id: 'short', label: '짧게 (4판)', description: '4판 뒤 점수로 끝', config: { ...CLASSIC, maxRounds: 4 } },
  { id: 'six', label: '6색 공방', description: '6×6 벽 · 색마다 22장', config: { ...CLASSIC, colors: 6, tilesPerColor: 22 } },
];

const clamp = (v: unknown, [lo, hi]: readonly [number, number], d: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d;
};

export function sanitizeConfig(input: Partial<GameConfig>): GameConfig {
  const c = { ...CLASSIC, ...input };
  const floor = Array.isArray(c.floor) && c.floor.length >= 3 && c.floor.length <= 9 ? c.floor.map((x) => Math.max(-6, Math.min(0, Math.round(Number(x)) || 0))) : CLASSIC.floor;
  return {
    colors: clamp(c.colors, LIMITS.colors, 5),
    tilesPerColor: clamp(c.tilesPerColor, LIMITS.tilesPerColor, 20),
    factories: clamp(c.factories, LIMITS.factories, 0),
    perFactory: clamp(c.perFactory, LIMITS.perFactory, 4),
    freeWall: c.freeWall === true,
    floor,
    rowBonus: clamp(c.rowBonus, LIMITS.rowBonus, 2),
    colBonus: clamp(c.colBonus, LIMITS.colBonus, 7),
    colorBonus: clamp(c.colorBonus, LIMITS.colorBonus, 10),
    maxRounds: clamp(c.maxRounds, LIMITS.maxRounds, 0),
    rounds: clamp(c.rounds, LIMITS.rounds, 1),
    turnTimerSec: clamp(c.turnTimerSec, LIMITS.turnTimerSec, 0),
  };
}

export const factoriesFor = (c: GameConfig, players: number) => c.factories || players * 2 + 1;

export function validateConfig(c: GameConfig, players: number): string[] {
  if (factoriesFor(c, players) * c.perFactory > c.colors * c.tilesPerColor) return ['타일이 모자라요. 색마다 타일을 늘리거나 공장을 줄여 주세요'];
  return [];
}

/** 정해진 벽: r행 c열의 색 (원작처럼 한 칸씩 밀린 무늬) */
export const wallColor = (n: number, r: number, c: number) => (c - r + n) % n;
export const wallCol = (n: number, r: number, color: number) => (color + r) % n;
