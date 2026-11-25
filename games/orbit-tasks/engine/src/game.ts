import { RuleError, TrickPlay, followSuit, nextSeat, trickWinner } from '@bg/core';
import { GameConfig, validateConfig } from './config';

export class MoveError extends RuleError {}

/** 색 0~3 (분홍·파랑·초록·노랑) 숫자 1~9, 로켓(suit 4) 1~4 = 으뜸 */
export interface Card {
  id: string;
  suit: number;
  rank: number;
}
export const ROCKET = 4;
export const COLORS = 4;

export interface Task {
  card: Card;
  /** 맡은 사람 (고르기 전이면 null) */
  owner: number | null;
  /** 순서 표시 (1부터, 없으면 null) */
  order: number | null;
  done: boolean;
}
export interface Signal {
  card: Card;
  kind: 'top' | 'bottom' | 'only';
}

export type Move = { type: 'take'; task: string } | { type: 'signal'; card: string } | { type: 'play'; card: string };

export type LogEntry =
  | { n: number; type: 'mission'; no: number; tasks: number; captain: number }
  | { n: number; type: 'take'; seat: number; card: Card }
  | { n: number; type: 'signal'; seat: number; card: Card; kind: Signal['kind'] }
  | { n: number; type: 'play'; seat: number; card: Card }
  | { n: number; type: 'trick'; seat: number; cards: Card[]; done: Card[] }
  | { n: number; type: 'result'; success: boolean; why: string | null }
  | { n: number; type: 'end'; best: number };

export interface MatchState {
  config: GameConfig;
  players: number;
  /** 몇 번째 도전 (1부터) */
  round: number;
  status: 'playing' | 'round-over' | 'match-over';
  phase: 'draft' | 'play';
  /** 이번 임무의 과제 수 */
  level: number;
  hands: Card[][];
  tasks: Task[];
  captain: number;
  turn: number;
  trick: TrickPlay<Card>[];
  lastTrick: { plays: TrickPlay<Card>[]; winner: number } | null;
  trickNo: number;
  signals: (Signal | null)[];
  /** 순서 표시가 붙은 과제 중 다음에 해내야 할 번호 */
  nextOrder: number;
  /** 도전별 결과 (성공한 과제 수, 실패면 0) */
  results: { level: number; success: boolean }[];
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
function shuffle<T>(m: MatchState, a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(nextRandom(m) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function fullDeck(): Card[] {
  const d: Card[] = [];
  for (let s = 0; s < COLORS; s++) for (let r = 1; r <= 9; r++) d.push({ id: `${s}-${r}`, suit: s, rank: r });
  for (let r = 1; r <= 4; r++) d.push({ id: `${ROCKET}-${r}`, suit: ROCKET, rank: r });
  return d;
}

function deal(m: MatchState) {
  const deck = shuffle(m, fullDeck());
  m.hands = Array.from({ length: m.players }, () => []);
  deck.forEach((c, i) => m.hands[i % m.players].push(c));
  m.captain = m.hands.findIndex((h) => h.some((c) => c.suit === ROCKET && c.rank === 4));
  // 과제: 색 카드 중에서 (로켓은 과제가 되지 않음)
  const pool = shuffle(m, fullDeck().filter((c) => c.suit !== ROCKET));
  m.tasks = pool.slice(0, m.level).map((card, i) => ({ card, owner: null, order: i < Math.min(m.config.ordered, m.level) ? i + 1 : null, done: false }));
  m.signals = Array(m.players).fill(null);
  m.trick = [];
  m.lastTrick = null;
  m.trickNo = 0;
  m.nextOrder = 1;
  m.phase = 'draft';
  m.turn = m.captain;
  m.status = 'playing';
  log(m, { type: 'mission', no: m.round, tasks: m.level, captain: m.captain });
}

export function newMatch(c: GameConfig, players: number, rng: () => number = Math.random): MatchState {
  const errors = validateConfig(c, players);
  if (errors.length) throw new MoveError(errors[0]);
  const m = { config: c, players, round: 1, level: c.tasks, results: [], log: [], seq: 0, rng: Math.floor(rng() * 4294967296) >>> 0 } as unknown as MatchState;
  deal(m);
  return m;
}

export function actors(m: MatchState): number[] {
  return m.status === 'playing' ? [m.turn] : [];
}

/** 신호 종류: 그 색이 하나뿐이면 only, 가장 높으면 top, 가장 낮으면 bottom (중간이면 알릴 수 없음) */
export function signalKind(hand: Card[], card: Card): Signal['kind'] | null {
  if (card.suit === ROCKET) return null;
  const same = hand.filter((c) => c.suit === card.suit);
  if (same.length === 1) return 'only';
  const max = Math.max(...same.map((c) => c.rank));
  const min = Math.min(...same.map((c) => c.rank));
  return card.rank === max ? 'top' : card.rank === min ? 'bottom' : null;
}

export function legalCards(m: MatchState, seat: number): Card[] {
  if (m.phase !== 'play' || seat !== m.turn) return [];
  return followSuit(m.hands[seat], m.trick.length ? m.trick[0].card.suit : null);
}

export function applyMove(m: MatchState, seat: number, move: Move) {
  if (m.status !== 'playing') throw new MoveError('지금은 진행 중인 임무가 없어요');
  if (move.type === 'signal') {
    if (!m.config.signals) throw new MoveError('이번 규칙에는 신호가 없어요');
    if (m.phase !== 'play') throw new MoveError('과제를 다 고른 뒤에 신호를 보낼 수 있어요');
    if (m.trick.length) throw new MoveError('트릭 사이(카드가 나오기 전)에만 신호를 보낼 수 있어요');
    if (m.signals[seat]) throw new MoveError('신호는 임무마다 한 번만 보낼 수 있어요');
    const card = m.hands[seat].find((c) => c.id === move.card);
    if (!card) throw new MoveError('손에 없는 카드예요');
    const kind = signalKind(m.hands[seat], card);
    if (!kind) throw new MoveError(card.suit === ROCKET ? '로켓은 신호로 알릴 수 없어요' : '그 색에서 가장 높거나 가장 낮거나 하나뿐인 카드만 알릴 수 있어요');
    m.signals[seat] = { card, kind };
    log(m, { type: 'signal', seat, card, kind });
    return;
  }
  if (seat !== m.turn) throw new MoveError('지금은 내 차례가 아니에요');
  if (move.type === 'take') {
    if (m.phase !== 'draft') throw new MoveError('지금은 과제를 고를 때가 아니에요');
    const task = m.tasks.find((t) => t.card.id === move.task && t.owner === null);
    if (!task) throw new MoveError('그 과제는 이미 누가 맡았어요');
    task.owner = seat;
    log(m, { type: 'take', seat, card: task.card });
    if (m.tasks.every((t) => t.owner !== null)) {
      m.phase = 'play';
      m.turn = m.captain;
    } else m.turn = nextSeat(seat, m.players);
    return;
  }
  if (move.type !== 'play') throw new MoveError('할 수 없는 동작이에요');
  if (m.phase !== 'play') throw new MoveError('먼저 과제를 모두 골라 주세요');
  const card = m.hands[seat].find((c) => c.id === move.card);
  if (!card) throw new MoveError('손에 없는 카드예요');
  if (!legalCards(m, seat).includes(card)) throw new MoveError('처음 낸 색이 있으면 그 색을 내야 해요');
  m.hands[seat] = m.hands[seat].filter((c) => c !== card);
  m.lastTrick = null;
  m.trick.push({ seat, card });
  log(m, { type: 'play', seat, card });
  if (m.trick.length < m.players) {
    m.turn = nextSeat(seat, m.players);
    return;
  }
  const winner = trickWinner(m.trick, ROCKET, (c) => c.rank);
  const cards = m.trick.map((p) => p.card);
  const done: Card[] = [];
  let fail: string | null = null;
  for (const t of m.tasks) {
    if (t.done || !cards.some((c) => c.id === t.card.id)) continue;
    if (t.owner !== winner) {
      fail = `과제 카드를 맡은 사람이 아닌 사람이 가져갔어요`;
      continue;
    }
    if (t.order !== null) {
      if (t.order !== m.nextOrder) fail = `순서 표시 ${m.nextOrder}번보다 ${t.order}번을 먼저 해냈어요`;
      m.nextOrder = t.order + 1;
    }
    t.done = true;
    done.push(t.card);
  }
  log(m, { type: 'trick', seat: winner, cards, done });
  m.lastTrick = { plays: m.trick, winner };
  m.trick = [];
  m.trickNo++;
  m.turn = winner;
  if (fail) return endMission(m, false, fail);
  if (m.tasks.every((t) => t.done)) return endMission(m, true, null);
  if (m.hands.every((h) => h.length === 0)) endMission(m, false, '카드가 떨어졌는데 과제가 남았어요');
}

function endMission(m: MatchState, success: boolean, why: string | null) {
  m.results.push({ level: m.level, success });
  log(m, { type: 'result', success, why });
  if (m.round >= m.config.attempts) {
    log(m, { type: 'end', best: bestLevel(m) });
    m.status = 'match-over';
  } else m.status = 'round-over';
}

export const bestLevel = (m: Pick<MatchState, 'results'>) => m.results.reduce((a, r) => (r.success ? Math.max(a, r.level) : a), 0);

export function startNextRound(m: MatchState) {
  if (m.status !== 'round-over') throw new MoveError('아직 임무가 끝나지 않았어요');
  const last = m.results[m.results.length - 1];
  if (last?.success && m.config.climb) m.level = Math.min(10, m.level + 1);
  m.round++;
  deal(m);
}

export function continueMatch(prev: MatchState, config: GameConfig, rng: () => number = Math.random): MatchState {
  if (prev.results.length >= config.attempts) throw new MoveError(`벌써 ${prev.results.length}번 도전했어요. 도전 횟수를 늘리면 이어서 할 수 있어요`);
  const m = newMatch({ ...config, tasks: prev.level }, prev.players, rng);
  m.config = config;
  m.round = prev.results.length + 1;
  m.results = prev.results.map((r) => ({ ...r }));
  return m;
}

/** 협력 게임: 모두 같은 점수 = 성공한 과제 수의 합 */
export function matchTotals(m: Pick<MatchState, 'results' | 'players'>): number[] {
  const s = m.results.reduce((a, r) => a + (r.success ? r.level : 0), 0);
  return Array(m.players).fill(s);
}

export function autoMove(m: MatchState, seat: number): Move {
  if (m.phase === 'draft') return { type: 'take', task: m.tasks.find((t) => t.owner === null)!.card.id };
  const legal = legalCards(m, seat).sort((a, b) => (a.suit === ROCKET ? 10 : 0) + a.rank - ((b.suit === ROCKET ? 10 : 0) + b.rank));
  return { type: 'play', card: legal[0].id };
}
