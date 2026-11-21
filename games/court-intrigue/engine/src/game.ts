import { RuleError } from '@bg/core';
import { GameConfig, validateConfig } from './config';
import { ACTION_DEFS, ActionKind, ROLES, Role } from './roles';

export class MoveError extends RuleError {}

export interface Influence {
  id: string;
  role: Role;
  /** 잃은(공개된) 카드 */
  lost: boolean;
}

export type Move =
  | { type: 'act'; action: ActionKind; target?: number }
  | { type: 'challenge' }
  | { type: 'pass' }
  | { type: 'block'; role: Role }
  | { type: 'lose'; cardId: string }
  | { type: 'keep'; cardIds: string[] };

export interface Pending {
  actor: number;
  action: ActionKind;
  target: number | null;
  /** 막은 사람과 주장한 역할 */
  blocker: number | null;
  blockRole: Role | null;
}

/** 영향력을 잃어야 하는 대기열 (먼저 처리) */
export interface LossItem {
  seat: number;
  why: string;
}

export type LogEntry =
  | { n: number; type: 'act'; seat: number; action: ActionKind; target: number | null }
  | { n: number; type: 'challenge'; seat: number; against: number; role: Role; ok: boolean }
  | { n: number; type: 'block'; seat: number; role: Role }
  | { n: number; type: 'lose'; seat: number; role: Role; why: string }
  | { n: number; type: 'resolve'; seat: number; action: ActionKind; target: number | null; text: string }
  | { n: number; type: 'out'; seat: number }
  | { n: number; type: 'win'; seat: number };

export interface MatchState {
  config: GameConfig;
  players: number;
  round: number;
  status: 'playing' | 'round-over' | 'match-over';
  /**
   * action: 차례인 사람이 행동 고르기
   * challenge: 행동(역할 주장)에 도전할 사람 — passed에 없는 살아 있는 상대 모두
   * block: 막을 수 있는 사람 (원조: 모두, 암살·약탈: 대상만)
   * blockChallenge: 막기(역할 주장)에 도전할 사람
   * lose: 영향력 하나를 골라 잃기 (losses 맨 앞 사람)
   * exchange: 외교관 교환 — 남길 카드 고르기
   */
  phase: 'action' | 'challenge' | 'block' | 'blockChallenge' | 'lose' | 'exchange';
  turn: number;
  deck: Role[];
  hands: Influence[][];
  coins: number[];
  pending: Pending | null;
  passed: number[];
  losses: LossItem[];
  /** lose를 다 처리한 뒤 할 일 */
  after: 'resolve' | 'fail' | 'next' | 'blocked' | null;
  /** 외교관 교환 중 뽑은 카드 */
  drawn: Influence[];
  winners: number[];
  outOrder: number[];
  log: LogEntry[];
  seq: number;
  cardSeq: number;
  rng: number;
}

function nextRandom(m: { rng: number }): number {
  let t = (m.rng = (m.rng + 0x6d2b79f5) >>> 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function shuffle<T>(arr: T[], m: { rng: number }): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(nextRandom(m) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

type DistOmit<T, K extends keyof never> = T extends unknown ? Omit<T, K> : never;
function log(m: MatchState, e: DistOmit<LogEntry, 'n'>) {
  m.log.push({ ...(e as LogEntry), n: ++m.seq });
  if (m.log.length > 60) m.log.shift();
}

const card = (m: MatchState, role: Role): Influence => ({ id: `c${++m.cardSeq}`, role, lost: false });

function deal(m: MatchState, first: number) {
  const c = m.config;
  const deck: Role[] = [];
  for (const r of ROLES) for (let k = 0; k < c.copies; k++) deck.push(r);
  shuffle(deck, m);
  m.hands = Array.from({ length: m.players }, () => [card(m, deck.pop()!), card(m, deck.pop()!)]);
  m.deck = deck;
  m.coins = Array(m.players).fill(c.startCoins);
  if (m.players === 2 && c.twoPlayerHandicap) m.coins[first] = Math.max(0, c.startCoins - 1);
  m.turn = first;
  m.phase = 'action';
  m.pending = null;
  m.passed = [];
  m.losses = [];
  m.after = null;
  m.drawn = [];
  m.outOrder = [];
  m.status = 'playing';
}

export function newMatch(c: GameConfig, players: number, rng: () => number = Math.random): MatchState {
  const errors = validateConfig(c, players);
  if (errors.length) throw new MoveError(errors[0]);
  const m = { config: c, players, round: 1, winners: [], log: [], seq: 0, cardSeq: 0, rng: Math.floor(rng() * 4294967296) >>> 0 } as unknown as MatchState;
  deal(m, Math.floor(nextRandom(m) * players));
  return m;
}

export const influence = (m: Pick<MatchState, 'hands'>, seat: number) => m.hands[seat].filter((h) => !h.lost).length;
export const aliveSeats = (m: Pick<MatchState, 'hands' | 'players'>) => Array.from({ length: m.players }, (_, i) => i).filter((s) => influence(m, s) > 0);
const has = (m: MatchState, seat: number, role: Role) => m.hands[seat].some((h) => !h.lost && h.role === role);

/** 지금 둘 수 있는 사람 */
export function actors(m: MatchState): number[] {
  if (m.status !== 'playing') return [];
  const p = m.pending;
  switch (m.phase) {
    case 'action':
    case 'exchange':
      return [m.turn];
    case 'lose':
      return m.losses.length ? [m.losses[0].seat] : [];
    case 'challenge':
      return aliveSeats(m).filter((s) => s !== p!.actor && !m.passed.includes(s));
    case 'block':
      return blockers(m).filter((s) => !m.passed.includes(s));
    case 'blockChallenge':
      return aliveSeats(m).filter((s) => s !== p!.blocker && !m.passed.includes(s));
  }
}

function blockers(m: MatchState): number[] {
  const p = m.pending!;
  const def = ACTION_DEFS[p.action];
  if (!def.blockers.length) return [];
  if (p.action === 'aid') return aliveSeats(m).filter((s) => s !== p.actor);
  return p.target !== null && influence(m, p.target) > 0 ? [p.target] : [];
}

export function legalActions(m: Pick<MatchState, 'coins' | 'config' | 'hands' | 'players'>, seat: number): ActionKind[] {
  const c = m.config;
  const coins = m.coins[seat];
  if (coins >= c.mustCoup) return ['coup'];
  const out: ActionKind[] = ['income', 'aid', 'tax', 'steal', 'exchange'];
  if (coins >= c.coupCost) out.push('coup');
  if (coins >= c.assassinCost) out.push('assassinate');
  return out;
}

export function applyMove(m: MatchState, seat: number, move: Move) {
  if (m.status !== 'playing') throw new MoveError('지금은 진행 중인 판이 없어요');
  if (!actors(m).includes(seat)) throw new MoveError(m.phase === 'action' ? '지금은 내 차례가 아니에요' : '지금은 할 수 있는 게 없어요. 잠시 기다려 주세요');
  const c = m.config;
  switch (m.phase) {
    case 'action': {
      if (move.type !== 'act') throw new MoveError('행동을 골라 주세요');
      const def = ACTION_DEFS[move.action];
      if (!def) throw new MoveError('그런 행동은 없어요');
      if (!legalActions(m, seat).includes(move.action)) throw new MoveError(m.coins[seat] >= c.mustCoup ? `금화가 ${c.mustCoup}개 이상이면 반드시 쿠데타를 해야 해요` : '금화가 모자라요');
      let target: number | null = null;
      if (def.target) {
        const t = move.target;
        if (t === undefined || t === seat || !Number.isInteger(t) || t < 0 || t >= m.players || influence(m, t) === 0) throw new MoveError('대상을 골라 주세요');
        if (move.action === 'steal' && m.coins[t] === 0) throw new MoveError('그 사람은 금화가 없어요');
        target = t;
      }
      if (move.action === 'coup') m.coins[seat] -= c.coupCost;
      if (move.action === 'assassinate') m.coins[seat] -= c.assassinCost; // 막혀도 돌려받지 않음 (원작)
      m.pending = { actor: seat, action: move.action, target, blocker: null, blockRole: null };
      log(m, { type: 'act', seat, action: move.action, target });
      m.passed = [];
      if (def.role) m.phase = 'challenge';
      else if (def.blockers.length) m.phase = 'block';
      else return resolve(m);
      return skipEmpty(m);
    }
    case 'challenge':
    case 'blockChallenge': {
      if (move.type === 'pass') {
        m.passed.push(seat);
        return skipEmpty(m);
      }
      if (move.type !== 'challenge') throw new MoveError('도전하거나 통과해 주세요');
      const p = m.pending!;
      const claimant = m.phase === 'challenge' ? p.actor : p.blocker!;
      const role = m.phase === 'challenge' ? ACTION_DEFS[p.action].role! : p.blockRole!;
      const truthful = has(m, claimant, role);
      log(m, { type: 'challenge', seat, against: claimant, role, ok: !truthful });
      if (truthful) {
        // 들킨 카드를 보여 주고 더미에 섞은 뒤 새로 받음. 도전한 사람이 영향력을 잃음
        const shown = m.hands[claimant].find((h) => !h.lost && h.role === role)!;
        m.deck.push(shown.role);
        shuffle(m.deck, m);
        const idx = m.hands[claimant].indexOf(shown);
        m.hands[claimant][idx] = card(m, m.deck.pop()!);
        m.losses.push({ seat, why: '도전에 실패했어요' });
        // 행동 주장이 사실 → 막기 단계(있으면)나 실행, 막기 주장이 사실 → 행동이 막힘
        m.after = m.phase === 'challenge' ? (ACTION_DEFS[p.action].blockers.length ? 'next' : 'resolve') : 'blocked';
      } else {
        m.losses.push({ seat: claimant, why: '거짓말이 들켰어요' });
        m.after = m.phase === 'challenge' ? 'fail' : 'resolve';
      }
      m.phase = 'lose';
      return afterLoss(m);
    }
    case 'block': {
      if (move.type === 'pass') {
        m.passed.push(seat);
        return skipEmpty(m);
      }
      if (move.type !== 'block') throw new MoveError('막거나 통과해 주세요');
      const p = m.pending!;
      if (!ACTION_DEFS[p.action].blockers.includes(move.role)) throw new MoveError('그 역할로는 이 행동을 막을 수 없어요');
      p.blocker = seat;
      p.blockRole = move.role;
      log(m, { type: 'block', seat, role: move.role });
      m.passed = [];
      m.phase = 'blockChallenge';
      return skipEmpty(m);
    }
    case 'lose': {
      if (move.type !== 'lose') throw new MoveError('잃을 카드를 골라 주세요');
      const item = m.losses[0];
      const h = m.hands[seat].find((x) => x.id === move.cardId && !x.lost);
      if (!h) throw new MoveError('그 카드는 고를 수 없어요');
      h.lost = true;
      m.losses.shift();
      log(m, { type: 'lose', seat, role: h.role, why: item.why });
      checkOut(m, seat);
      return afterLoss(m);
    }
    case 'exchange': {
      if (move.type !== 'keep') throw new MoveError('남길 카드를 골라 주세요');
      const live = m.hands[seat].filter((h) => !h.lost);
      const pool = [...live, ...m.drawn];
      const keepN = live.length;
      const ids = [...new Set(move.cardIds)];
      if (ids.length !== keepN || ids.some((id) => !pool.some((x) => x.id === id))) throw new MoveError(`${keepN}장을 골라 주세요`);
      const keep = pool.filter((x) => ids.includes(x.id));
      const back = pool.filter((x) => !ids.includes(x.id));
      m.hands[seat] = [...m.hands[seat].filter((h) => h.lost), ...keep];
      m.deck.push(...back.map((x) => x.role));
      shuffle(m.deck, m);
      m.drawn = [];
      return nextTurn(m);
    }
  }
}

/** 기다릴 사람이 없으면 다음 단계로 */
function skipEmpty(m: MatchState) {
  if (m.status !== 'playing') return;
  if (actors(m).length) return;
  const p = m.pending!;
  if (m.phase === 'challenge') {
    if (ACTION_DEFS[p.action].blockers.length && blockers(m).length) {
      m.phase = 'block';
      m.passed = [];
      return skipEmpty(m);
    }
    return resolve(m);
  }
  if (m.phase === 'block') return resolve(m);
  if (m.phase === 'blockChallenge') {
    // 막기 성공
    log(m, { type: 'resolve', seat: p.actor, action: p.action, target: p.target, text: '막혔어요' });
    return nextTurn(m);
  }
}

function afterLoss(m: MatchState) {
  // 탈락한 사람의 대기열은 건너뜀
  while (m.losses.length && influence(m, m.losses[0].seat) === 0) m.losses.shift();
  if (m.losses.length) return;
  if (checkWin(m)) return;
  const after = m.after;
  m.after = null;
  const p = m.pending;
  if (!p) return nextTurn(m);
  if (after === 'fail') {
    // 행동 주장이 거짓 → 행동 취소 (암살 금화는 돌려받음)
    if (p.action === 'assassinate') m.coins[p.actor] += m.config.assassinCost;
    log(m, { type: 'resolve', seat: p.actor, action: p.action, target: p.target, text: '거짓말이라 행동이 취소됐어요' });
    return nextTurn(m);
  }
  if (after === 'blocked') {
    log(m, { type: 'resolve', seat: p.actor, action: p.action, target: p.target, text: '막혔어요' });
    return nextTurn(m);
  }
  if (after === 'next') {
    // 행동 도전 실패 → 막기 단계
    if (blockers(m).length) {
      m.phase = 'block';
      m.passed = [];
      return skipEmpty(m);
    }
    return resolve(m);
  }
  if (after === 'resolve') return resolve(m);
  return nextTurn(m);
}

function resolve(m: MatchState) {
  const p = m.pending!;
  const c = m.config;
  const a = p.action;
  let text = '';
  if (a === 'income') {
    m.coins[p.actor] += 1;
    text = '금화 +1';
  } else if (a === 'aid') {
    m.coins[p.actor] += 2;
    text = '금화 +2';
  } else if (a === 'tax') {
    m.coins[p.actor] += 3;
    text = '금화 +3';
  } else if (a === 'steal' && p.target !== null) {
    const n = Math.min(c.stealAmount, m.coins[p.target]);
    m.coins[p.target] -= n;
    m.coins[p.actor] += n;
    text = `금화 ${n}개를 빼앗았어요`;
  } else if ((a === 'coup' || a === 'assassinate') && p.target !== null) {
    if (influence(m, p.target) > 0) {
      m.losses.push({ seat: p.target, why: a === 'coup' ? '쿠데타' : '암살' });
      m.phase = 'lose';
      m.after = null;
      text = a === 'coup' ? '쿠데타!' : '암살 성공';
      log(m, { type: 'resolve', seat: p.actor, action: a, target: p.target, text });
      m.pending = null;
      return;
    }
  } else if (a === 'exchange') {
    m.drawn = [card(m, m.deck.pop()!), card(m, m.deck.pop()!)];
    m.phase = 'exchange';
    log(m, { type: 'resolve', seat: p.actor, action: a, target: null, text: '카드 2장을 봐요' });
    return;
  }
  log(m, { type: 'resolve', seat: p.actor, action: a, target: p.target, text });
  nextTurn(m);
}

function checkOut(m: MatchState, seat: number) {
  if (influence(m, seat) === 0 && !m.outOrder.includes(seat)) {
    m.outOrder.push(seat);
    m.coins[seat] = 0;
    log(m, { type: 'out', seat });
  }
}

function checkWin(m: MatchState): boolean {
  const left = aliveSeats(m);
  if (left.length > 1) return false;
  const w = left[0];
  m.winners.push(w);
  log(m, { type: 'win', seat: w });
  m.status = m.round >= m.config.rounds || m.winners.filter((x) => x === w).length > m.config.rounds / 2 ? 'match-over' : 'round-over';
  return true;
}

function nextTurn(m: MatchState) {
  if (m.losses.length) {
    m.phase = 'lose';
    return;
  }
  if (checkWin(m)) return;
  m.pending = null;
  m.passed = [];
  m.after = null;
  do m.turn = (m.turn + 1) % m.players;
  while (influence(m, m.turn) === 0);
  m.phase = 'action';
}

export function startNextRound(m: MatchState) {
  if (m.status !== 'round-over') throw new MoveError('아직 판이 끝나지 않았어요');
  m.round++;
  deal(m, m.winners[m.winners.length - 1] ?? 0);
}

export function continueMatch(prev: MatchState, config: GameConfig, rng: () => number = Math.random): MatchState {
  const done = prev.winners.length;
  if (done >= config.rounds) throw new MoveError(`벌써 ${done}판을 마쳤어요. 판 수를 ${done + 1}판 이상으로 늘리면 이어서 할 수 있어요`);
  const m = newMatch(config, prev.players, rng);
  m.round = done + 1;
  m.winners = [...prev.winners];
  return m;
}

export function matchTotals(m: Pick<MatchState, 'winners' | 'players'>): number[] {
  return Array.from({ length: m.players }, (_, s) => m.winners.filter((w) => w === s).length);
}

/** 시간 초과·대신 진행: 통과 / 소득 (쿠데타 의무면 쿠데타) / 첫 카드 잃기 / 그대로 남기기 */
export function autoMove(m: MatchState, seat: number): Move {
  switch (m.phase) {
    case 'action': {
      const acts = legalActions(m, seat);
      if (acts.length === 1 && acts[0] === 'coup') return { type: 'act', action: 'coup', target: aliveSeats(m).find((s) => s !== seat) };
      return { type: 'act', action: 'income' };
    }
    case 'lose':
      return { type: 'lose', cardId: m.hands[seat].find((h) => !h.lost)!.id };
    case 'exchange':
      return { type: 'keep', cardIds: m.hands[seat].filter((h) => !h.lost).map((h) => h.id) };
    default:
      return { type: 'pass' };
  }
}

export const timerSec = (m: MatchState) => (m.phase === 'challenge' || m.phase === 'block' || m.phase === 'blockChallenge' ? m.config.reactionSec : m.config.turnTimerSec);
