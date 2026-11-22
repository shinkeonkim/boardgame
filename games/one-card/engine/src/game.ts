import { RuleError } from '@bg/core';
import { GameConfig, validateConfig } from './config';

export class MoveError extends RuleError {}

/** suit: 0 ♠ · 1 ♥ · 2 ♦ · 3 ♣ · -1 조커 / rank: 1(A)~13(K), 조커는 0(흑백)·1(컬러) */
export interface Card {
  id: string;
  suit: number;
  rank: number;
}
export const isJoker = (c: Card) => c.suit < 0;

export type Move = { type: 'play'; cardId: string; suit?: number } | { type: 'draw' } | { type: 'call' } | { type: 'pass' };

export type LogEntry =
  | { n: number; type: 'play'; seat: number; card: Card; attack: number; suit: number | null }
  | { n: number; type: 'draw'; seat: number; count: number; attacked: boolean }
  | { n: number; type: 'call'; seat: number; target: number; caught: boolean; penalty: number }
  | { n: number; type: 'out'; seat: number; place: number; bankrupt: boolean }
  | { n: number; type: 'end'; winner: number };

export interface MatchState {
  config: GameConfig;
  players: number;
  round: number;
  status: 'playing' | 'round-over' | 'match-over';
  phase: 'play' | 'call';
  deck: Card[];
  discard: Card[];
  hands: Card[][];
  turn: number;
  dir: 1 | -1;
  /** 지금 맞춰야 할 무늬 (null = 아무거나: 조커 다음) */
  suit: number | null;
  /** 쌓인 공격 장수와 그 세기 */
  attack: number;
  attackPower: number;
  /** K로 한 번 더 내는 중 */
  again: boolean;
  /** 나간 순서 (파산 포함) */
  out: number[];
  bankrupt: boolean[];
  /** 원카드 외치기 창: 한 장 남은 사람, 아직 안 누른 사람 */
  callFor: number | null;
  callWaiting: number[];
  roundScores: number[][];
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
  if (m.log.length > 60) m.log.shift();
}
function shuffle(m: MatchState, a: Card[]) {
  for (let i = a.length - 1; i > 0; i--) {
    const k = Math.floor(nextRandom(m) * (i + 1));
    [a[i], a[k]] = [a[k], a[i]];
  }
  return a;
}

export function buildDeck(c: Pick<GameConfig, 'jokers'>): Card[] {
  const out: Card[] = [];
  for (let s = 0; s < 4; s++) for (let r = 1; r <= 13; r++) out.push({ id: `${s}-${r}`, suit: s, rank: r });
  if (c.jokers) out.push({ id: 'J0', suit: -1, rank: 0 }, { id: 'J1', suit: -1, rank: 1 });
  return out;
}

/** 공격 카드의 장수와 세기 (공격이 아니면 null) */
export function attackOf(c: GameConfig, card: Card): { amount: number; power: number } | null {
  if (isJoker(card)) return c.jokers ? (card.rank === 1 ? { amount: 7, power: 4 } : { amount: 5, power: 3 }) : null;
  if (!c.attacks) return null;
  if (card.rank === 2) return { amount: 2, power: 1 };
  if (card.rank === 1) return card.suit === 0 ? { amount: 5, power: 3 } : { amount: 3, power: 2 };
  return null;
}

function deal(m: MatchState, first: number) {
  const deck = shuffle(m, buildDeck(m.config));
  m.hands = Array.from({ length: m.players }, () => deck.splice(0, m.config.deal));
  // 시작 카드는 특수 카드가 아닌 것으로
  let i = deck.findIndex((x) => !isJoker(x) && !attackOf(m.config, x) && ![7, 11, 12, 13].includes(x.rank));
  if (i < 0) i = 0;
  m.discard = deck.splice(i, 1);
  m.deck = deck;
  m.suit = m.discard[0].suit;
  m.turn = first;
  m.dir = 1;
  m.attack = 0;
  m.attackPower = 0;
  m.again = false;
  m.out = [];
  m.bankrupt = Array(m.players).fill(false);
  m.phase = 'play';
  m.callFor = null;
  m.callWaiting = [];
  m.status = 'playing';
}

export function newMatch(c: GameConfig, players: number, rng: () => number = Math.random): MatchState {
  const errors = validateConfig(c, players);
  if (errors.length) throw new MoveError(errors[0]);
  const m = { config: c, players, round: 1, roundScores: [], log: [], seq: 0, rng: Math.floor(rng() * 4294967296) >>> 0 } as unknown as MatchState;
  deal(m, Math.floor(nextRandom(m) * players));
  return m;
}

export const top = (m: Pick<MatchState, 'discard'>) => m.discard[m.discard.length - 1];
export const inGame = (m: Pick<MatchState, 'out'>, s: number) => !m.out.includes(s);

/** 이 카드를 지금 낼 수 있는지 (안 되면 이유) */
export function playProblem(m: Pick<MatchState, 'config' | 'discard' | 'suit' | 'attack' | 'attackPower'>, card: Card): string | null {
  const t = top(m);
  if (m.attack > 0) {
    const a = attackOf(m.config, card);
    if (!a) return `공격을 받는 중이에요 — 공격 카드로 막거나 ${m.attack}장 받기`;
    if (a.power < m.attackPower) return '더 약한 공격 카드로는 못 막아요';
    if (!isJoker(card) && !isJoker(t) && card.suit !== m.suit && card.rank !== t.rank) return '공격 카드도 무늬나 숫자가 맞아야 해요 (조커는 언제나)';
    return null;
  }
  if (isJoker(card) || m.suit === null) return null;
  if (card.suit === m.suit) return null;
  if (!isJoker(t) && card.rank === t.rank) return null;
  return `무늬(${'♠♥♦♣'[m.suit]})나 숫자가 같아야 해요`;
}

export function playable(m: MatchState, seat: number): Card[] {
  return m.hands[seat].filter((c) => !playProblem(m, c));
}

export function actors(m: MatchState): number[] {
  if (m.status !== 'playing') return [];
  if (m.phase === 'call') return m.callWaiting;
  return [m.turn];
}

function refill(m: MatchState) {
  if (m.deck.length) return;
  const keep = m.discard.pop()!;
  m.deck = shuffle(m, m.discard);
  m.discard = [keep];
}
function drawCards(m: MatchState, seat: number, n: number): number {
  let got = 0;
  for (let i = 0; i < n; i++) {
    refill(m);
    const c = m.deck.pop();
    if (!c) break;
    m.hands[seat].push(c);
    got++;
  }
  return got;
}

function nextSeat(m: MatchState, from: number, steps = 1): number {
  let s = from;
  for (let k = 0; k < steps; k++) {
    for (let j = 0; j < m.players; j++) {
      s = (s + m.dir + m.players) % m.players;
      if (inGame(m, s)) break;
    }
  }
  return s;
}

function checkBankrupt(m: MatchState, seat: number) {
  if (m.config.bankrupt && m.hands[seat].length > m.config.bankrupt && inGame(m, seat)) {
    m.bankrupt[seat] = true;
    m.out.push(seat);
    m.deck.unshift(...m.hands[seat]);
    m.hands[seat] = [];
    log(m, { type: 'out', seat, place: 0, bankrupt: true });
  }
}

export function applyMove(m: MatchState, seat: number, move: Move) {
  if (m.status !== 'playing') throw new MoveError('지금은 진행 중인 판이 없어요');
  if (!actors(m).includes(seat)) throw new MoveError(m.phase === 'call' ? '지금은 원카드 외치기 시간이에요' : '지금은 내 차례가 아니에요');
  if (m.phase === 'call') return callMove(m, seat, move);
  if (move.type === 'draw') {
    const attacked = m.attack > 0;
    const n = drawCards(m, seat, attacked ? m.attack : 1);
    log(m, { type: 'draw', seat, count: n, attacked });
    m.attack = 0;
    m.attackPower = 0;
    m.again = false;
    checkBankrupt(m, seat);
    if (finishedCheck(m)) return;
    m.turn = nextSeat(m, seat);
    return;
  }
  if (move.type !== 'play') throw new MoveError('카드를 내거나 가져와요');
  const idx = m.hands[seat].findIndex((c) => c.id === move.cardId);
  if (idx < 0) throw new MoveError('없는 카드예요');
  const card = m.hands[seat][idx];
  const problem = playProblem(m, card);
  if (problem) throw new MoveError(problem);
  const c = m.config;
  m.hands[seat].splice(idx, 1);
  m.discard.push(card);
  // 무늬
  let suit: number | null = isJoker(card) ? null : card.suit;
  if (!isJoker(card) && card.rank === 7 && c.seven && m.attack === 0) {
    const s = Number(move.suit);
    suit = Number.isInteger(s) && s >= 0 && s <= 3 ? s : card.suit;
  }
  m.suit = suit;
  const a = attackOf(c, card);
  if (a) {
    m.attack += a.amount;
    m.attackPower = a.power;
  }
  log(m, { type: 'play', seat, card, attack: m.attack, suit });
  m.again = false;
  // 다 냈으면 나감
  if (!m.hands[seat].length) {
    m.out.push(seat);
    log(m, { type: 'out', seat, place: m.out.filter((s) => !m.bankrupt[s]).length, bankrupt: false });
    if (finishedCheck(m)) return;
    m.turn = nextSeat(m, seat);
    return;
  }
  // 원카드 외치기 창
  if (c.call && m.hands[seat].length === 1) {
    m.phase = 'call';
    m.callFor = seat;
    m.callWaiting = Array.from({ length: m.players }, (_, i) => i).filter((s) => inGame(m, s));
  }
  // 다음 차례
  let next = nextSeat(m, seat);
  if (!a && !isJoker(card)) {
    if (card.rank === 11 && c.jack) next = nextSeat(m, seat, 2);
    else if (card.rank === 12 && c.queen) {
      const live = m.players - m.out.length;
      if (live === 2) next = seat;
      else {
        m.dir = m.dir === 1 ? -1 : 1;
        next = nextSeat(m, seat);
      }
    } else if (card.rank === 13 && c.king) {
      next = seat;
      m.again = true;
    }
  }
  m.turn = next;
}

function callMove(m: MatchState, seat: number, move: Move) {
  const owner = m.callFor!;
  if (move.type === 'call') {
    const caught = seat !== owner;
    const penalty = caught ? drawCards(m, owner, m.config.callPenalty) : 0;
    log(m, { type: 'call', seat, target: owner, caught, penalty });
    endCall(m);
    if (caught) checkBankrupt(m, owner);
    finishedCheck(m);
    return;
  }
  if (move.type !== 'pass') throw new MoveError('「원카드!」를 누르거나 넘겨요');
  m.callWaiting = m.callWaiting.filter((s) => s !== seat);
  if (!m.callWaiting.length) endCall(m);
}
function endCall(m: MatchState) {
  m.phase = 'play';
  m.callFor = null;
  m.callWaiting = [];
  if (!inGame(m, m.turn)) m.turn = nextSeat(m, m.turn);
}

function finishedCheck(m: MatchState): boolean {
  const live = Array.from({ length: m.players }, (_, i) => i).filter((s) => inGame(m, s));
  const someoneWon = m.out.some((s) => !m.bankrupt[s]);
  if ((m.config.until === 'first' && someoneWon) || live.length <= 1) {
    for (const s of live) m.out.push(s);
    finish(m);
    return true;
  }
  return false;
}

/** 판 점수: 다 낸 사람 0, 남은 카드 장수만큼 감점, 파산은 기준+5 감점 */
function finish(m: MatchState) {
  const scores = Array.from({ length: m.players }, (_, s) => (m.bankrupt[s] ? -(m.config.bankrupt + 5) : -m.hands[s].length));
  if (m.config.until === 'last') {
    // 순위: 먼저 나간 사람(파산 아님)부터 높은 점수
    const order = m.out.filter((s) => !m.bankrupt[s]);
    order.forEach((s, i) => (scores[s] = m.players - i - 1));
  }
  m.roundScores.push(scores);
  const winner = m.out.find((s) => !m.bankrupt[s]) ?? 0;
  log(m, { type: 'end', winner });
  m.phase = 'play';
  m.status = m.round >= m.config.rounds ? 'match-over' : 'round-over';
}

export function startNextRound(m: MatchState) {
  if (m.status !== 'round-over') throw new MoveError('아직 판이 끝나지 않았어요');
  m.round++;
  const last = m.roundScores[m.roundScores.length - 1];
  deal(m, last.indexOf(Math.max(...last)));
}

export function continueMatch(prev: MatchState, config: GameConfig, rng: () => number = Math.random): MatchState {
  const done = prev.roundScores.length;
  if (done >= config.rounds) throw new MoveError(`벌써 ${done}판을 마쳤어요. 판 수를 ${done + 1} 이상으로 늘리면 이어서 할 수 있어요`);
  const m = newMatch(config, prev.players, rng);
  m.round = done + 1;
  m.roundScores = prev.roundScores.map((r) => [...r]);
  return m;
}

export function matchTotals(m: Pick<MatchState, 'roundScores' | 'players'>): number[] {
  const t = Array(m.players).fill(0);
  for (const r of m.roundScores) r.forEach((v, i) => (t[i] += v));
  return t;
}

/** 시간 초과·대신 진행: 낼 수 있는 첫 카드(7이면 가장 많은 무늬), 없으면 가져오기 · 외치기 창은 넘기기 */
export function autoMove(m: MatchState, seat: number): Move {
  if (m.phase === 'call') return { type: 'pass' };
  const p = playable(m, seat)[0];
  if (!p) return { type: 'draw' };
  return { type: 'play', cardId: p.id, suit: mostSuit(m.hands[seat].filter((c) => c.id !== p.id)) };
}
export function mostSuit(hand: Card[]): number {
  const k = [0, 0, 0, 0];
  for (const c of hand) if (!isJoker(c)) k[c.suit]++;
  return k.indexOf(Math.max(...k));
}
