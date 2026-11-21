import { RuleError } from '@bg/core';
import { GameConfig, penaltyOf, validateConfig } from './config';

export class MoveError extends RuleError {}

export type Move = { type: 'pick'; card: number } | { type: 'take'; row: number };

/** 공개된 카드 하나가 처리된 결과 */
export interface Placement {
  seat: number;
  card: number;
  row: number;
  /** 줄을 가져갔으면 그 카드들 */
  took: number[];
  /** took 벌점 합 */
  penalty: number;
  /** 가장 작은 카드라 줄을 골라 가져감 */
  low: boolean;
}

export type LogEntry =
  | { n: number; type: 'reveal'; turn: number; cards: { seat: number; card: number }[] }
  | ({ n: number; type: 'place' } & Placement)
  | { n: number; type: 'round'; round: number };

export interface MatchState {
  config: GameConfig;
  players: number;
  /** 1부터 */
  round: number;
  status: 'playing' | 'round-over' | 'match-over';
  phase: 'pick' | 'take';
  /** 이번 판 몇 번째 고르기 (1부터) */
  turn: number;
  hands: number[][];
  rows: number[][];
  /** 이번 판에 가져간 카드 */
  taken: number[][];
  /** 이번 차례에 고른 카드 (공개 전) */
  picks: (number | null)[];
  /** 공개 후 아직 처리하지 않은 카드 (작은 것부터) */
  queue: { seat: number; card: number }[];
  /** 줄을 골라야 하는 사람 */
  chooser: number | null;
  /** 이번 차례에 처리된 결과 (화면 애니메이션) */
  placed: Placement[];
  roundScores: number[][];
  log: LogEntry[];
  seq: number;
  rng: number;
}

// ---------- 난수 ----------
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

const LOG_SIZE = 40;
type DistOmit<T, K extends keyof never> = T extends unknown ? Omit<T, K> : never;
function log(m: MatchState, e: DistOmit<LogEntry, 'n'>) {
  m.log.push({ ...(e as LogEntry), n: ++m.seq });
  if (m.log.length > LOG_SIZE) m.log.shift();
}

function deal(m: MatchState) {
  const c = m.config;
  const deck = shuffle(
    Array.from({ length: c.maxCard }, (_, i) => i + 1),
    m,
  );
  m.hands = Array.from({ length: m.players }, () => deck.splice(0, c.handSize).sort((a, b) => a - b));
  m.rows = Array.from({ length: c.rows }, () => [deck.pop()!]).sort((a, b) => a[0] - b[0]);
  m.taken = Array.from({ length: m.players }, () => []);
  m.picks = Array(m.players).fill(null);
  m.queue = [];
  m.chooser = null;
  m.placed = [];
  m.phase = 'pick';
  m.turn = 1;
  m.status = 'playing';
}

export function newMatch(c: GameConfig, players: number, rng: () => number = Math.random): MatchState {
  const errors = validateConfig(c, players);
  if (errors.length) throw new MoveError(errors[0]);
  const m: MatchState = {
    config: c,
    players,
    round: 1,
    status: 'playing',
    phase: 'pick',
    turn: 1,
    hands: [],
    rows: [],
    taken: [],
    picks: [],
    queue: [],
    chooser: null,
    placed: [],
    roundScores: [],
    log: [],
    seq: 0,
    rng: Math.floor(rng() * 4294967296) >>> 0,
  };
  deal(m);
  return m;
}

export const rowPenalty = (c: GameConfig, row: number[]) => row.reduce((a, n) => a + penaltyOf(c, n), 0);

/** 카드가 들어갈 줄 (마지막 카드가 카드보다 작은 것 중 가장 큰 줄). 없으면 -1 */
export function targetRow(rows: number[][], card: number): number {
  let best = -1;
  for (let i = 0; i < rows.length; i++) {
    const end = rows[i][rows[i].length - 1];
    if (end < card && (best < 0 || end > rows[best][rows[best].length - 1])) best = i;
  }
  return best;
}

/** 벌점이 가장 적은 줄 (같으면 카드가 적은 줄, 그다음 앞 줄) */
export function lightestRow(c: GameConfig, rows: number[][]): number {
  let best = 0;
  for (let i = 1; i < rows.length; i++) {
    const a = rowPenalty(c, rows[i]);
    const b = rowPenalty(c, rows[best]);
    if (a < b || (a === b && rows[i].length < rows[best].length)) best = i;
  }
  return best;
}

export function actors(m: MatchState): number[] {
  if (m.status !== 'playing') return [];
  if (m.phase === 'take') return m.chooser === null ? [] : [m.chooser];
  return m.picks.flatMap((p, i) => (p === null ? [i] : []));
}

export function applyMove(m: MatchState, seat: number, move: Move) {
  if (m.status !== 'playing') throw new MoveError('지금은 진행 중인 판이 없어요');
  if (move.type === 'pick') {
    if (m.phase !== 'pick') throw new MoveError(m.chooser === seat ? '먼저 가져갈 줄을 골라 주세요' : '카드를 놓는 중이에요. 잠시만 기다려 주세요');
    const hand = m.hands[seat];
    if (!hand.includes(move.card)) throw new MoveError('손에 없는 카드예요');
    if (m.picks[seat] !== null) {
      if (!m.config.allowChange) throw new MoveError('이미 카드를 골랐어요');
      // 다시 고르기: 손으로 돌려놓고 새 카드
    }
    m.picks[seat] = move.card;
    if (m.picks.every((p) => p !== null)) reveal(m);
    return;
  }
  if (move.type === 'take') {
    if (m.phase !== 'take' || m.chooser !== seat) throw new MoveError('지금은 줄을 고를 때가 아니에요');
    if (!Number.isInteger(move.row) || move.row < 0 || move.row >= m.rows.length) throw new MoveError('그런 줄은 없어요');
    const next = m.queue.shift()!;
    place(m, next.seat, next.card, move.row, true);
    m.chooser = null;
    m.phase = 'pick';
    resolve(m);
    return;
  }
  throw new MoveError('할 수 없는 동작이에요');
}

/** 모두 골랐다: 손에서 빼고 작은 카드부터 처리 */
function reveal(m: MatchState) {
  const cards = m.picks.map((card, seat) => ({ seat, card: card! })).sort((a, b) => a.card - b.card);
  for (const { seat, card } of cards) m.hands[seat] = m.hands[seat].filter((x) => x !== card);
  m.picks = Array(m.players).fill(null);
  m.queue = cards;
  m.placed = [];
  log(m, { type: 'reveal', turn: m.turn, cards });
  resolve(m);
}

function resolve(m: MatchState) {
  while (m.queue.length) {
    const { seat, card } = m.queue[0];
    const r = targetRow(m.rows, card);
    if (r < 0) {
      if (m.config.lowCard === 'fewest') {
        m.queue.shift();
        place(m, seat, card, lightestRow(m.config, m.rows), true);
        continue;
      }
      m.phase = 'take';
      m.chooser = seat;
      return;
    }
    m.queue.shift();
    place(m, seat, card, r, false);
  }
  // 이번 차례 끝
  m.phase = 'pick';
  if (m.hands.every((h) => h.length === 0)) return endRound(m);
  m.turn++;
}

function place(m: MatchState, seat: number, card: number, row: number, low: boolean) {
  const c = m.config;
  let took: number[] = [];
  if (low || m.rows[row].length >= c.rowLimit) {
    took = m.rows[row];
    m.rows[row] = [card];
    m.taken[seat].push(...took);
  } else {
    m.rows[row].push(card);
  }
  const p: Placement = { seat, card, row, took, penalty: rowPenalty(c, took), low };
  m.placed.push(p);
  log(m, { type: 'place', ...p });
}

export const roundPenalties = (m: Pick<MatchState, 'taken' | 'config'>) => m.taken.map((t) => rowPenalty(m.config, t));

function endRound(m: MatchState) {
  m.roundScores.push(roundPenalties(m));
  log(m, { type: 'round', round: m.round });
  const totals = matchTotals(m);
  const c = m.config;
  const over = c.endMode === 'target' ? totals.some((t) => t >= c.target) || m.round >= c.rounds : m.round >= c.rounds;
  m.status = over ? 'match-over' : 'round-over';
}

export function startNextRound(m: MatchState) {
  if (m.status !== 'round-over') throw new MoveError('아직 판이 끝나지 않았어요');
  m.round++;
  deal(m);
}

export function continueMatch(prev: MatchState, config: GameConfig, rng: () => number = Math.random): MatchState {
  const done = prev.roundScores.length;
  if (config.endMode === 'rounds' && done >= config.rounds) throw new MoveError(`벌써 ${done}판을 마쳤어요. 판 수를 ${done + 1}판 이상으로 늘리면 이어서 할 수 있어요`);
  const m = newMatch(config, prev.players, rng);
  m.round = done + 1;
  m.roundScores = prev.roundScores.map((r) => [...r]);
  return m;
}

/** 좌석별 누적 벌점 (팀전이면 팀 합을 두 좌석에 똑같이) */
export function matchTotals(m: Pick<MatchState, 'roundScores' | 'players' | 'config'>): number[] {
  const t = Array(m.players).fill(0);
  for (const r of m.roundScores) r.forEach((v, i) => (t[i] += v));
  if (!m.config.teams) return t;
  return t.map((_, i) => t[teamMate(i)] + t[i]);
}

/** 팀전 짝: 0·1, 2·3 … */
export const teamMate = (seat: number) => (seat % 2 === 0 ? seat + 1 : seat - 1);

/** 시간 초과·대신 진행: 고르기면 줄에 안전하게 들어갈 카드, 줄 고르기면 가장 가벼운 줄 */
export function autoMove(m: MatchState, seat: number): Move {
  if (m.phase === 'take') return { type: 'take', row: lightestRow(m.config, m.rows) };
  const hand = m.hands[seat];
  // 6번째가 되지 않고 들어가는 카드 중 가장 작은 것, 없으면 가장 작은 카드
  const safe = hand.filter((card) => {
    const r = targetRow(m.rows, card);
    return r >= 0 && m.rows[r].length < m.config.rowLimit;
  });
  return { type: 'pick', card: (safe[0] ?? hand[0])! };
}
