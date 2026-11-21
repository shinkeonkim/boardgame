export interface GameConfig {
  /** 타일 숫자 0~maxNumber (원작 11 → 색마다 12장) */
  maxNumber: number;
  /** 조커 타일 수 (원작 선택 규칙 2) — 어느 자리에나 놓을 수 있는 「-」 */
  jokers: number;
  /** 0이면 인원에 따라 자동 (2~3명 4장, 4명 3장, 5명 이상 3장) */
  startTiles: number;
  /** 맞히면 계속 맞힐 수 있음 (원작) — 끄면 한 번 맞히면 차례 끝 */
  chain: boolean;
  /** 더미에서 가져올 타일 색을 고를 수 있음 (원작) — 끄면 무작위 */
  chooseColor: boolean;
  /** 틀린 추측 기록을 화면에 남기기 (추리 도움) */
  showMisses: boolean;
  rounds: number;
  turnTimerSec: number;
}

export const LIMITS = {
  maxNumber: [5, 15],
  jokers: [0, 2],
  startTiles: [0, 6],
  rounds: [1, 5],
  turnTimerSec: [0, 180],
  players: [2, 6],
} as const;

export const CLASSIC: GameConfig = {
  maxNumber: 11,
  jokers: 0,
  startTiles: 0,
  chain: true,
  chooseColor: true,
  showMisses: true,
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
  { id: 'classic', label: '원작', description: '0~11 흑백 24장 · 조커 없음', config: CLASSIC },
  { id: 'jokers', label: '조커 2장', description: '어디에나 놓이는 「-」 타일로 헷갈리게', config: { ...CLASSIC, jokers: 2 } },
  { id: 'small', label: '작은 금고', description: '0~7 · 16장 · 빠르게', config: { ...CLASSIC, maxNumber: 7 } },
  { id: 'big', label: '큰 금고 (5~6명)', description: '0~15 · 32장', config: { ...CLASSIC, maxNumber: 15 } },
  { id: 'memory', label: '기억력', description: '틀린 추측 기록 숨기기', config: { ...CLASSIC, showMisses: false } },
];

const clamp = (v: unknown, [lo, hi]: readonly [number, number], d: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d;
};

export function sanitizeConfig(input: Partial<GameConfig>): GameConfig {
  const c = { ...CLASSIC, ...input };
  return {
    maxNumber: clamp(c.maxNumber, LIMITS.maxNumber, 11),
    jokers: clamp(c.jokers, LIMITS.jokers, 0),
    startTiles: clamp(c.startTiles, LIMITS.startTiles, 0),
    chain: c.chain !== false,
    chooseColor: c.chooseColor !== false,
    showMisses: c.showMisses !== false,
    rounds: clamp(c.rounds, LIMITS.rounds, 1),
    turnTimerSec: clamp(c.turnTimerSec, LIMITS.turnTimerSec, 0),
  };
}

export const tileCount = (c: GameConfig) => (c.maxNumber + 1) * 2 + c.jokers;
export const startTilesFor = (c: GameConfig, players: number) => c.startTiles || (players <= 3 ? 4 : 3);

export function validateConfig(c: GameConfig, players: number): string[] {
  const need = startTilesFor(c, players) * players + 2;
  return need > tileCount(c) ? [`타일이 모자라요(${tileCount(c)}장, ${players}명이면 ${need}장 이상). 숫자 범위를 늘리거나 시작 타일을 줄여 주세요`] : [];
}
