/** 역할 (특수 역할은 설정으로 켜고 끔) */
export type Role = 'agent' | 'seer' | 'guard' | 'spy' | 'hunter' | 'falseSeer' | 'shadow' | 'loner';
export const SPY_ROLES: Role[] = ['spy', 'hunter', 'falseSeer', 'shadow', 'loner'];
export const isSpy = (r: Role) => SPY_ROLES.includes(r);

export interface GameConfig {
  /** 예언자(첩자를 앎) + 그림자 사냥꾼(마지막에 예언자를 맞히면 첩자 승) */
  seer: boolean;
  /** 호위무사: 예언자 후보를 봄 (가짜 예언자가 있으면 둘 중 하나) */
  guard: boolean;
  /** 가짜 예언자(첩자): 호위무사에게 예언자처럼 보임 */
  falseSeer: boolean;
  /** 숨은 우두머리(첩자): 예언자에게 안 보임 */
  shadow: boolean;
  /** 외톨이 첩자: 다른 첩자를 모르고, 다른 첩자도 모름 */
  loner: boolean;
  /** 투표 공개: names = 누가 찬성·반대했는지, count = 수만 */
  voteReveal: 'names' | 'count';
  /** 연속으로 원정대가 부결되면 첩자 승 (기본 5) */
  rejectLimit: number;
  /** 몇 게임 (게임마다 역할을 새로) */
  rounds: number;
  turnTimerSec: number;
}

export const LIMITS = {
  rejectLimit: [3, 7],
  rounds: [1, 7],
  turnTimerSec: [0, 180],
  players: [5, 10],
} as const;

export const CLASSIC: GameConfig = { seer: false, guard: false, falseSeer: false, shadow: false, loner: false, voteReveal: 'names', rejectLimit: 5, rounds: 1, turnTimerSec: 0 };

export interface Preset {
  id: string;
  label: string;
  description: string;
  config: GameConfig;
}

export const PRESETS: Preset[] = [
  { id: 'classic', label: '기본', description: '요원과 첩자만 · 처음 하는 모임에', config: CLASSIC },
  { id: 'seer', label: '예언자와 사냥꾼', description: '예언자는 첩자를 알지만, 들키면 마지막에 사냥당해요', config: { ...CLASSIC, seer: true } },
  { id: 'full', label: '모든 역할', description: '예언자·사냥꾼·호위무사·가짜 예언자·숨은 우두머리', config: { ...CLASSIC, seer: true, guard: true, falseSeer: true, shadow: true } },
  { id: 'chaos', label: '외톨이 첩자', description: '서로 모르는 첩자가 하나 섞여요 (7명 이상 추천)', config: { ...CLASSIC, seer: true, loner: true } },
  { id: 'secret', label: '익명 투표', description: '찬반 수만 공개 · 더 의심스럽게', config: { ...CLASSIC, voteReveal: 'count' } },
];

/** 인원별 첩자 수 */
export const SPIES: Record<number, number> = { 5: 2, 6: 2, 7: 3, 8: 3, 9: 3, 10: 4 };
/** 인원별 원정대 크기 (1~5번째 원정) */
export const TEAM_SIZES: Record<number, number[]> = {
  5: [2, 3, 2, 3, 3],
  6: [2, 3, 4, 3, 4],
  7: [2, 3, 3, 4, 4],
  8: [3, 4, 4, 5, 5],
  9: [3, 4, 4, 5, 5],
  10: [3, 4, 4, 5, 5],
};
/** 7명 이상이면 4번째 원정은 실패 카드 2장이어야 실패 */
export const failsNeeded = (players: number, mission: number) => (players >= 7 && mission === 3 ? 2 : 1);

const clamp = (v: unknown, [lo, hi]: readonly [number, number], d: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d;
};

export function sanitizeConfig(input: Partial<GameConfig>): GameConfig {
  const c = { ...CLASSIC, ...input };
  const seer = c.seer === true;
  return {
    seer,
    guard: seer && c.guard === true,
    falseSeer: seer && c.falseSeer === true,
    shadow: seer && c.shadow === true,
    loner: c.loner === true,
    voteReveal: c.voteReveal === 'count' ? 'count' : 'names',
    rejectLimit: clamp(c.rejectLimit, LIMITS.rejectLimit, 5),
    rounds: clamp(c.rounds, LIMITS.rounds, 1),
    turnTimerSec: clamp(c.turnTimerSec, LIMITS.turnTimerSec, 0),
  };
}

/** 이 설정·인원의 역할 목록 (요원 수는 나머지) */
export function rolesFor(c: GameConfig, players: number): Role[] {
  const spies = SPIES[players] ?? 2;
  const spyRoles: Role[] = [];
  if (c.seer) spyRoles.push('hunter');
  if (c.falseSeer) spyRoles.push('falseSeer');
  if (c.shadow) spyRoles.push('shadow');
  if (c.loner) spyRoles.push('loner');
  while (spyRoles.length < spies) spyRoles.push('spy');
  const good: Role[] = [];
  if (c.seer) good.push('seer');
  if (c.guard) good.push('guard');
  while (good.length < players - spies) good.push('agent');
  return [...good, ...spyRoles.slice(0, spies)];
}

export function validateConfig(c: GameConfig, players: number): string[] {
  const errors: string[] = [];
  if (players < 5) errors.push('5명 이상이어야 해요 (봇으로 채울 수 있어요)');
  const spies = SPIES[players] ?? 2;
  const special = [c.seer, c.falseSeer, c.shadow, c.loner].filter(Boolean).length;
  if (special > spies) errors.push(`첩자가 ${spies}명이라 특수 첩자 역할을 ${spies}개까지만 켤 수 있어요`);
  return errors;
}

/** 화면에 보일 역할 순서 */
export const ROLES_ORDER: Role[] = ['agent', 'seer', 'guard', 'spy', 'hunter', 'falseSeer', 'shadow', 'loner'];
