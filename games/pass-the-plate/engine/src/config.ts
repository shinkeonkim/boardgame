import { DISH, Dish, Group } from './cards';

export interface GameConfig {
  /** 판 수 (원작 3) */
  rounds: number;
  /** 0이면 인원에 따라 자동 (2명 10장 · 3명 9 · 4명 8 · 5명 7 · 6~8명 6) */
  handSize: number;
  /** 손패를 넘기는 방향: left=늘 왼쪽(원작), alternate=판마다 반대로 */
  pass: 'left' | 'alternate';
  /** 메뉴: 빼고 싶은 요리 묶음 */
  menu: Record<Group, boolean>;
  /** 공개 전에 고른 카드 바꾸기 */
  allowChange: boolean;
  /** 남이 지금까지 먹은 요리(앞에 놓인 카드) 보기 — 원작은 늘 공개 */
  showTableaus: boolean;
  turnTimerSec: number;
}

export const LIMITS = {
  rounds: [1, 5],
  handSize: [0, 12],
  turnTimerSec: [0, 120],
  players: [2, 8],
} as const;

export const FULL_MENU: Record<Group, boolean> = { maki: true, tempura: true, sashimi: true, dumpling: true, nigiri: true, wasabi: true, chopsticks: true, pudding: true };

export const CLASSIC: GameConfig = {
  rounds: 3,
  handSize: 0,
  pass: 'left',
  menu: FULL_MENU,
  allowChange: true,
  showTableaus: true,
  turnTimerSec: 0,
};

export interface Preset {
  id: string;
  label: string;
  description: string;
  config: GameConfig;
}

export const PRESETS: Preset[] = [
  { id: 'classic', label: '원작', description: '3판 · 모든 요리', config: CLASSIC },
  { id: 'simple', label: '처음 하는 사람', description: '젓가락·겨자 빼고 · 2판', config: { ...CLASSIC, rounds: 2, menu: { ...FULL_MENU, chopsticks: false, wasabi: false } } },
  { id: 'quick', label: '한 판', description: '1판으로 바로 결판 (푸딩 없음)', config: { ...CLASSIC, rounds: 1, menu: { ...FULL_MENU, pudding: false } } },
  { id: 'swirl', label: '돌려 돌려', description: '판마다 넘기는 방향이 바뀌어요', config: { ...CLASSIC, pass: 'alternate' } },
];

const clamp = (v: unknown, [lo, hi]: readonly [number, number], d: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d;
};

export function sanitizeConfig(input: Partial<GameConfig>): GameConfig {
  const c = { ...CLASSIC, ...input };
  const menu = { ...FULL_MENU };
  for (const k of Object.keys(FULL_MENU) as Group[]) if (c.menu && typeof c.menu === 'object' && (c.menu as Record<string, unknown>)[k] === false) menu[k] = false;
  if (!menu.nigiri) menu.wasabi = false; // 초밥 없이 겨자는 의미 없음
  return {
    rounds: clamp(c.rounds, LIMITS.rounds, 3),
    handSize: clamp(c.handSize, LIMITS.handSize, 0),
    pass: c.pass === 'alternate' ? 'alternate' : 'left',
    menu,
    allowChange: c.allowChange !== false,
    showTableaus: c.showTableaus !== false,
    turnTimerSec: clamp(c.turnTimerSec, LIMITS.turnTimerSec, 0),
  };
}

export const handSizeFor = (c: GameConfig, players: number) => c.handSize || [10, 10, 10, 9, 8, 7, 6, 6, 6][players] || 6;

/** 한 벌에 든 카드 수 (메뉴 반영) */
export function oneDeck(c: GameConfig): Dish[] {
  const out: Dish[] = [];
  for (const [k, d] of Object.entries(DISH) as [Dish, (typeof DISH)[Dish]][]) if (c.menu[d.group]) for (let i = 0; i < d.copies; i++) out.push(k);
  return out;
}

/** 필요한 벌 수: 모든 판에 쓸 카드가 한 덱으로 모자라면 여러 벌 */
export const deckCopies = (c: GameConfig, players: number) => Math.max(1, Math.ceil((players * handSizeFor(c, players) * c.rounds) / Math.max(1, oneDeck(c).length)));

export function validateConfig(c: GameConfig, players: number): string[] {
  const errors: string[] = [];
  if (!oneDeck(c).length) errors.push('메뉴에 요리가 하나도 없어요');
  if (oneDeck(c).length < 20) errors.push('메뉴가 너무 적어요. 요리를 더 켜 주세요');
  if (handSizeFor(c, players) < 2) errors.push('손패가 너무 적어요');
  return errors;
}
