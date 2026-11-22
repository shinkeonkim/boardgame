export interface GameConfig {
  /** 처음 나눠 줄 카드 수 */
  deal: number;
  /** 조커 (흑백 +5, 컬러 +7) */
  jokers: boolean;
  /** 공격 카드: 2(+2) · A(+3, ♠A +5) */
  attacks: boolean;
  /** 7: 무늬 바꾸기 */
  seven: boolean;
  /** J: 다음 사람 건너뛰기 */
  jack: boolean;
  /** Q: 방향 바꾸기 */
  queen: boolean;
  /** K: 한 장 더 */
  king: boolean;
  /** 원카드 외치기: 한 장 남으면 몇 초 안에 「원카드!」 — 남이 먼저 「잡았다!」 하면 벌칙 */
  call: boolean;
  callSec: number;
  /** 원카드를 못 외쳐 잡히면 가져갈 장수 */
  callPenalty: number;
  /** 손패가 이 장수를 넘으면 파산 (0 = 없음) */
  bankrupt: number;
  /** 판 끝: first = 한 명이 다 내면, last = 한 명만 남을 때까지 (순위) */
  until: 'first' | 'last';
  rounds: number;
  turnTimerSec: number;
}

export const LIMITS = {
  deal: [4, 10],
  callSec: [2, 10],
  callPenalty: [1, 5],
  bankrupt: [0, 30],
  rounds: [1, 7],
  turnTimerSec: [0, 60],
  players: [2, 8],
} as const;

export const CLASSIC: GameConfig = { deal: 7, jokers: true, attacks: true, seven: true, jack: true, queen: true, king: true, call: true, callSec: 5, callPenalty: 2, bankrupt: 20, until: 'first', rounds: 3, turnTimerSec: 0 };

export interface Preset {
  id: string;
  label: string;
  description: string;
  config: GameConfig;
}

export const PRESETS: Preset[] = [
  { id: 'classic', label: '기본 원카드', description: '7장 · 공격 2·A·조커 · 7 무늬 · J 건너뛰기 · Q 반대로 · K 한 장 더 · 20장 넘으면 파산', config: CLASSIC },
  { id: 'simple', label: '순한 맛', description: '공격·조커 없이 · 처음 하는 사람과', config: { ...CLASSIC, attacks: false, jokers: false, bankrupt: 0 } },
  { id: 'spicy', label: '매운 맛', description: '5장으로 시작 · 원카드 놓치면 3장 · 15장 파산', config: { ...CLASSIC, deal: 5, callPenalty: 3, bankrupt: 15 } },
  { id: 'rank', label: '끝까지 순위', description: '한 명만 남을 때까지 — 나간 순서대로 순위', config: { ...CLASSIC, until: 'last', rounds: 1 } },
  { id: 'nocall', label: '외치기 없이', description: '원카드를 외치지 않아도 돼요', config: { ...CLASSIC, call: false } },
];

const clamp = (v: unknown, [lo, hi]: readonly [number, number], d: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d;
};
const bool = (v: unknown, d: boolean) => (typeof v === 'boolean' ? v : d);

export function sanitizeConfig(input: Partial<GameConfig>): GameConfig {
  const c = { ...CLASSIC, ...input };
  return {
    deal: clamp(c.deal, LIMITS.deal, 7),
    jokers: bool(c.jokers, true),
    attacks: bool(c.attacks, true),
    seven: bool(c.seven, true),
    jack: bool(c.jack, true),
    queen: bool(c.queen, true),
    king: bool(c.king, true),
    call: bool(c.call, true),
    callSec: clamp(c.callSec, LIMITS.callSec, 5),
    callPenalty: clamp(c.callPenalty, LIMITS.callPenalty, 2),
    bankrupt: clamp(c.bankrupt, LIMITS.bankrupt, 20),
    until: c.until === 'last' ? 'last' : 'first',
    rounds: clamp(c.rounds, LIMITS.rounds, 3),
    turnTimerSec: clamp(c.turnTimerSec, LIMITS.turnTimerSec, 0),
  };
}

export function validateConfig(c: GameConfig, players: number): string[] {
  const deck = 52 + (c.jokers ? 2 : 0);
  if (players * c.deal + 1 > deck) return [`${players}명에게 ${c.deal}장씩 나누기엔 카드가 모자라요 (한 사람 ${Math.floor((deck - 1) / players)}장까지)`];
  if (c.bankrupt && c.bankrupt <= c.deal) return ['파산 기준은 처음 카드 수보다 커야 해요'];
  return [];
}
