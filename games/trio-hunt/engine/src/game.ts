import { RuleError } from '@bg/core';
import { GameConfig, splitFor, validateConfig } from './config';

export class MoveError extends RuleError {}

/** id는 숫자를 드러내지 않게 무작위 */
export interface Card {
  id: string;
  n: number;
}

/** 공개: 누군가의 가장 작은/큰 카드, 또는 가운데 카드 */
export type Move = { type: 'reveal'; seat: number; end: 'low' | 'high' } | { type: 'reveal'; seat: -1; idx: number };

export interface Flip {
  id: string;
  n: number;
  from: number; // -1 = 가운데
  end: 'low' | 'high' | null;
  idx: number | null;
}

export type LogEntry = { n: number; type: 'flip'; seat: number; flip: Flip } | { n: number; type: 'trio'; seat: number; value: number } | { n: number; type: 'miss'; seat: number; flips: Flip[] } | { n: number; type: 'win'; seat: number; seven: boolean };

export interface MatchState {
  config: GameConfig;
  players: number;
  round: number;
  status: 'playing' | 'round-over' | 'match-over';
  turn: number;
  hands: Card[][];
  middle: (Card | null)[];
  /** 이번 차례에 뒤집은 카드 */
  flips: Flip[];
  /** 모은 세트 (좌석별 숫자) */
  trios: number[][];
  /** 바로 전 차례에 실패하며 공개됐던 카드 (화면에 잠깐) */
  lastMiss: Flip[];
  roundScores: number[][];
  winners: number[];
  log: LogEntry[];
  seq: number;
  rng: number;
}

function nextRandom(m: { rng: number }): number {
  let t = (m.rng = (m.rng + 0x6d2b79f5) >>> 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
type DistOmit<T, K extends keyof never> = T extends unknown ? Omit<T, K> : never;
function log(m: MatchState, e: DistOmit<LogEntry, 'n'>) {
  m.log.push({ ...(e as LogEntry), n: ++m.seq });
  if (m.log.length > 120) m.log.shift();
}

function deal(m: MatchState, first: number) {
  const cards: Card[] = [];
  for (let n = 1; n <= 12; n++) for (let k = 0; k < 3; k++) cards.push({ id: '', n });
  for (let i = cards.length - 1; i > 0; i--) {
    const k = Math.floor(nextRandom(m) * (i + 1));
    [cards[i], cards[k]] = [cards[k], cards[i]];
  }
  cards.forEach((c) => (c.id = Math.floor(nextRandom(m) * 2 ** 32).toString(36) + Math.floor(nextRandom(m) * 1e6).toString(36)));
  const { hand, middle } = splitFor(m.config, m.players);
  m.hands = Array.from({ length: m.players }, () => cards.splice(0, hand).sort((a, b) => a.n - b.n));
  m.middle = cards.splice(0, middle);
  m.flips = [];
  m.trios = Array.from({ length: m.players }, () => []);
  m.lastMiss = [];
  m.turn = first;
  m.status = 'playing';
}

export function newMatch(c: GameConfig, players: number, rng: () => number = Math.random): MatchState {
  const errors = validateConfig(c, players);
  if (errors.length) throw new MoveError(errors[0]);
  const m = { config: c, players, round: 1, roundScores: [], winners: [], log: [], seq: 0, rng: Math.floor(rng() * 4294967296) >>> 0 } as unknown as MatchState;
  deal(m, Math.floor(nextRandom(m) * players));
  return m;
}

export function actors(m: MatchState): number[] {
  return m.status === 'playing' ? [m.turn] : [];
}

/** 이 사람 손패에서 아직 안 뒤집은 가장 작은/큰 카드 */
export function endCard(m: Pick<MatchState, 'hands' | 'flips'>, seat: number, end: 'low' | 'high'): Card | null {
  const open = new Set(m.flips.map((f) => f.id));
  const h = m.hands[seat].filter((c) => !open.has(c.id));
  if (!h.length) return null;
  return end === 'low' ? h[0] : h[h.length - 1];
}

export function applyMove(m: MatchState, seat: number, move: Move) {
  if (m.status !== 'playing') throw new MoveError('지금은 진행 중인 판이 없어요');
  if (seat !== m.turn) throw new MoveError('지금은 내 차례가 아니에요');
  if (move.type !== 'reveal') throw new MoveError('카드를 뒤집어 주세요');
  let card: Card | null = null;
  let flip: Flip;
  if (move.seat === -1) {
    const idx = Number((move as { idx: number }).idx);
    card = Number.isInteger(idx) ? m.middle[idx] ?? null : null;
    if (!card || m.flips.some((f) => f.id === card!.id)) throw new MoveError('그 가운데 카드는 뒤집을 수 없어요');
    flip = { id: card.id, n: card.n, from: -1, end: null, idx };
  } else {
    const s = Number(move.seat);
    const end = (move as { end: 'low' | 'high' }).end === 'high' ? 'high' : 'low';
    if (!Number.isInteger(s) || s < 0 || s >= m.players) throw new MoveError('없는 자리예요');
    card = endCard(m, s, end);
    if (!card) throw new MoveError('그 사람은 더 뒤집을 카드가 없어요');
    flip = { id: card.id, n: card.n, from: s, end, idx: null };
  }
  m.flips.push(flip);
  m.lastMiss = [];
  log(m, { type: 'flip', seat, flip });
  const first = m.flips[0].n;
  if (flip.n !== first) {
    // 다른 숫자 → 차례 끝, 다시 덮음
    m.lastMiss = m.flips;
    log(m, { type: 'miss', seat, flips: m.flips });
    m.flips = [];
    m.turn = (m.turn + 1) % m.players;
    return;
  }
  if (m.flips.length < 3 && !options(m).length) {
    // 같은 숫자였지만 더 뒤집을 카드가 없으면 실패로 끝
    m.lastMiss = m.flips;
    log(m, { type: 'miss', seat, flips: m.flips });
    m.flips = [];
    m.turn = (m.turn + 1) % m.players;
    return;
  }
  if (m.flips.length === 3) {
    // 세트 완성 → 가져감
    const ids = new Set(m.flips.map((f) => f.id));
    m.hands = m.hands.map((h) => h.filter((c) => !ids.has(c.id)));
    m.middle = m.middle.map((c) => (c && ids.has(c.id) ? null : c));
    m.trios[seat].push(first);
    log(m, { type: 'trio', seat, value: first });
    m.flips = [];
    const seven = m.config.sevenWins && first === 7;
    if (seven || m.trios[seat].length >= m.config.goal) return win(m, seat, seven);
    // 카드가 다 떨어지면(아무도 목표에 못 닿음) 세트가 가장 많은 사람 승리 (같으면 방금 모은 사람)
    if (!options(m).length) {
      const best = Math.max(...m.trios.map((t) => t.length));
      return win(m, m.trios[seat].length === best ? seat : m.trios.findIndex((t) => t.length === best), false);
    }
    m.turn = (m.turn + 1) % m.players;
  }
}

function win(m: MatchState, seat: number, seven: boolean) {
  log(m, { type: 'win', seat, seven });
  m.roundScores.push(m.trios.map((t, i) => (i === seat ? 3 : 0) + t.length));
  m.winners.push(seat);
  m.status = m.round >= m.config.rounds ? 'match-over' : 'round-over';
}

export function startNextRound(m: MatchState) {
  if (m.status !== 'round-over') throw new MoveError('아직 판이 끝나지 않았어요');
  m.round++;
  deal(m, (m.winners[m.winners.length - 1] + 1) % m.players);
}

export function continueMatch(prev: MatchState, config: GameConfig, rng: () => number = Math.random): MatchState {
  const done = prev.roundScores.length;
  if (done >= config.rounds) throw new MoveError(`벌써 ${done}판을 마쳤어요. 판 수를 늘리면 이어서 할 수 있어요`);
  const m = newMatch(config, prev.players, rng);
  m.round = done + 1;
  m.roundScores = prev.roundScores.map((r) => [...r]);
  m.winners = [...prev.winners];
  return m;
}

export function matchTotals(m: Pick<MatchState, 'roundScores' | 'players'>): number[] {
  const t = Array(m.players).fill(0);
  for (const r of m.roundScores) r.forEach((v, i) => (t[i] += v));
  return t;
}

/** 지금 뒤집을 수 있는 모든 수 */
export function options(m: Pick<MatchState, 'hands' | 'flips' | 'middle' | 'players'>): Move[] {
  const out: Move[] = [];
  for (let s = 0; s < m.players; s++) {
    const lo = endCard(m, s, 'low');
    const hi = endCard(m, s, 'high');
    if (lo) out.push({ type: 'reveal', seat: s, end: 'low' });
    if (hi && hi !== lo) out.push({ type: 'reveal', seat: s, end: 'high' });
  }
  m.middle.forEach((c, idx) => {
    if (c && !m.flips.some((f) => f.id === c.id)) out.push({ type: 'reveal', seat: -1, idx });
  });
  return out;
}

/** 시간 초과·대신 진행: 뒤집을 수 있는 곳 중 아무 데나 (같은 수만 반복하면 판이 끝나지 않으므로) */
export function autoMove(m: MatchState, _seat: number): Move {
  const o = options(m);
  return o[Math.floor(nextRandom(m) * o.length)];
}
