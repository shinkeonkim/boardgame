import { RuleError, TrickPlay, aceHigh, followSuit, nextSeat, trickWinner } from '@bg/core';
import { GameConfig, validateConfig } from './config';

export class MoveError extends RuleError {}

/** 트럼프 카드: suit 0 ♠ · 1 ♥ · 2 ♦ · 3 ♣, rank 1(A)~13(K) — A가 가장 높음 */
export interface Card {
  id: string;
  suit: number;
  rank: number;
}
export const HEART = 1;
export const SPADE = 0;
export const CLUB = 3;
export const DIAMOND = 2;
export const isQueenOfSpades = (c: Card) => c.suit === SPADE && c.rank === 12;
export const isJackOfDiamonds = (c: Card) => c.suit === DIAMOND && c.rank === 11;
export const pointsOf = (c: Card, cfg: Pick<GameConfig, 'jackBonus'>) => (c.suit === HEART ? 1 : isQueenOfSpades(c) ? 13 : cfg.jackBonus && isJackOfDiamonds(c) ? -10 : 0);

export type Move = { type: 'pass'; cards: string[] } | { type: 'play'; card: string };
export type PassDir = 'left' | 'right' | 'across' | 'hold';

export type LogEntry =
  | { n: number; type: 'pass'; dir: PassDir }
  | { n: number; type: 'play'; seat: number; card: Card }
  | { n: number; type: 'trick'; seat: number; cards: Card[]; points: number }
  | { n: number; type: 'broken'; seat: number }
  | { n: number; type: 'hand'; points: number[]; moon: number | null }
  | { n: number; type: 'end'; winners: number[] };

export interface MatchState {
  config: GameConfig;
  players: number;
  /** 판 번호 (1부터) */
  round: number;
  status: 'playing' | 'round-over' | 'match-over';
  phase: 'pass' | 'play';
  hands: Card[][];
  /** 건네기: 좌석별로 고른 카드 id (아직이면 null) */
  passPicks: (string[] | null)[];
  passDir: PassDir;
  /** 건네받은 카드 id (화면에서 잠깐 표시) */
  received: string[][];
  trick: TrickPlay<Card>[];
  /** 방금 끝난 트릭 (다음 카드가 나올 때까지 가운데에 보여 줌) */
  lastTrick: { plays: TrickPlay<Card>[]; winner: number } | null;
  leader: number;
  turn: number;
  trickNo: number;
  heartsBroken: boolean;
  /** 이번 판에 먹은 점수 카드 */
  taken: Card[][];
  /** 판별 점수 (확정) */
  handScores: number[][];
  /** 맨 처음 판 때 뺀 카드 (인원에 맞추기) */
  removed: Card[];
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

/** 인원에 맞춰 낮은 다이아·클로버부터 뺀 덱 (3명: ♦2 · 5명: ♦2 ♣2 · 6명: ♦2 ♣2 ♦3 ♣3) */
export function deckFor(players: number): { deck: Card[]; removed: Card[] } {
  const deck: Card[] = [];
  for (let s = 0; s < 4; s++) for (let r = 1; r <= 13; r++) deck.push({ id: `${s}-${r}`, suit: s, rank: r });
  const order: [number, number][] = [
    [DIAMOND, 2],
    [CLUB, 2],
    [DIAMOND, 3],
    [CLUB, 3],
  ];
  const removed: Card[] = [];
  let k = 0;
  while ((deck.length - removed.length) % players !== 0) {
    const [s, r] = order[k++];
    removed.push(deck.find((c) => c.suit === s && c.rank === r)!);
  }
  return { deck: deck.filter((c) => !removed.includes(c)), removed };
}

const dirFor = (round: number, players: number, passing: boolean): PassDir => {
  if (!passing) return 'hold';
  const cycle: PassDir[] = players % 2 === 0 ? ['left', 'right', 'across', 'hold'] : ['left', 'right', 'hold'];
  return cycle[(round - 1) % cycle.length];
};
export const passTarget = (seat: number, players: number, dir: PassDir) => (dir === 'left' ? nextSeat(seat, players, 1) : dir === 'right' ? nextSeat(seat, players, -1) : dir === 'across' ? nextSeat(seat, players, players / 2) : seat);

function deal(m: MatchState) {
  const { deck, removed } = deckFor(m.players);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(nextRandom(m) * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  const each = deck.length / m.players;
  m.hands = Array.from({ length: m.players }, (_, s) => deck.slice(s * each, (s + 1) * each));
  m.removed = removed;
  m.taken = Array.from({ length: m.players }, () => []);
  m.received = Array.from({ length: m.players }, () => []);
  m.trick = [];
  m.lastTrick = null;
  m.trickNo = 0;
  m.heartsBroken = false;
  m.passDir = dirFor(m.round, m.players, m.config.passing);
  m.passPicks = Array(m.players).fill(null);
  m.status = 'playing';
  if (m.passDir === 'hold') startPlay(m);
  else m.phase = 'pass';
}

/** 가장 낮은 클로버를 가진 사람이 그 카드로 첫 트릭을 엶 (A 는 가장 높음) */
function startPlay(m: MatchState) {
  m.phase = 'play';
  let low: { seat: number; rank: number } | null = null;
  m.hands.forEach((h, s) =>
    h.forEach((c) => {
      if (c.suit === CLUB && (!low || aceHigh(c) < low.rank)) low = { seat: s, rank: aceHigh(c) };
    }),
  );
  m.leader = m.turn = low ? (low as { seat: number }).seat : 0;
}

export function newMatch(c: GameConfig, players: number, rng: () => number = Math.random): MatchState {
  const errors = validateConfig(c, players);
  if (errors.length) throw new MoveError(errors[0]);
  const m = { config: c, players, round: 1, handScores: [], log: [], seq: 0, rng: Math.floor(rng() * 4294967296) >>> 0 } as unknown as MatchState;
  deal(m);
  return m;
}

export function actors(m: MatchState): number[] {
  if (m.status !== 'playing') return [];
  if (m.phase === 'pass') return m.passPicks.flatMap((p, i) => (p === null ? [i] : []));
  return [m.turn];
}

/** 지금 낼 수 있는 카드 */
export function legalCards(m: MatchState, seat: number): Card[] {
  const hand = m.hands[seat];
  if (m.phase !== 'play' || seat !== m.turn) return [];
  const led = m.trick.length ? m.trick[0].card.suit : null;
  // 첫 트릭 첫 카드: 가장 낮은 클로버
  if (m.trickNo === 0 && !m.trick.length) {
    const clubs = hand.filter((c) => c.suit === CLUB).sort((a, b) => aceHigh(a) - aceHigh(b));
    if (clubs.length) return [clubs[0]];
  }
  let ok = followSuit(hand, led);
  if (led === null) {
    // 하트가 깨지기 전에는 하트로 시작할 수 없음 (하트밖에 없으면 예외)
    if (!m.heartsBroken) {
      const nonHearts = ok.filter((c) => c.suit !== HEART);
      if (nonHearts.length) ok = nonHearts;
    }
  } else if (m.trickNo === 0 && !hand.some((c) => c.suit === led)) {
    // 첫 트릭에는 점수 카드를 버릴 수 없음 (그것밖에 없으면 예외)
    const safe = ok.filter((c) => c.suit !== HEART && !isQueenOfSpades(c));
    if (safe.length) ok = safe;
  }
  return ok;
}

export function applyMove(m: MatchState, seat: number, move: Move) {
  if (m.status !== 'playing') throw new MoveError('지금은 진행 중인 판이 없어요');
  if (move.type === 'pass') {
    if (m.phase !== 'pass') throw new MoveError('지금은 건넬 때가 아니에요');
    if (m.passPicks[seat] !== null) throw new MoveError('이미 건넬 카드를 골랐어요');
    const ids = [...new Set(move.cards)];
    if (ids.length !== 3 || !ids.every((id) => m.hands[seat].some((c) => c.id === id))) throw new MoveError('내 카드 중 3장을 골라 주세요');
    m.passPicks[seat] = ids;
    if (m.passPicks.every((p) => p !== null)) {
      const out = m.passPicks.map((ids2, s) => m.hands[s].filter((c) => ids2!.includes(c.id)));
      m.hands = m.hands.map((h, s) => h.filter((c) => !m.passPicks[s]!.includes(c.id)));
      out.forEach((cards, s) => {
        const to = passTarget(s, m.players, m.passDir);
        m.hands[to].push(...cards);
        m.received[to] = cards.map((c) => c.id);
      });
      log(m, { type: 'pass', dir: m.passDir });
      startPlay(m);
    }
    return;
  }
  if (move.type !== 'play') throw new MoveError('할 수 없는 동작이에요');
  if (m.phase !== 'play') throw new MoveError('카드를 건네는 중이에요');
  if (seat !== m.turn) throw new MoveError('지금은 내 차례가 아니에요');
  const card = m.hands[seat].find((c) => c.id === move.card);
  if (!card) throw new MoveError('손에 없는 카드예요');
  const legal = legalCards(m, seat);
  if (!legal.includes(card)) {
    const led = m.trick[0]?.card.suit;
    if (m.trickNo === 0 && !m.trick.length) throw new MoveError('첫 트릭은 가장 낮은 클로버로 시작해요');
    if (led !== undefined && m.hands[seat].some((c) => c.suit === led)) throw new MoveError('처음 낸 무늬와 같은 무늬가 있으면 그걸 내야 해요');
    if (led === undefined) throw new MoveError('하트가 아직 안 나왔어요. 다른 무늬로 시작해요');
    throw new MoveError('첫 트릭에는 하트·스페이드 Q 를 버릴 수 없어요');
  }
  m.hands[seat] = m.hands[seat].filter((c) => c !== card);
  m.received[seat] = [];
  m.lastTrick = null;
  m.trick.push({ seat, card });
  log(m, { type: 'play', seat, card });
  if (!m.heartsBroken && (card.suit === HEART || isQueenOfSpades(card))) {
    m.heartsBroken = true;
    log(m, { type: 'broken', seat });
  }
  if (m.trick.length < m.players) {
    m.turn = nextSeat(seat, m.players);
    return;
  }
  // 트릭 끝: 가장 높은 카드를 낸 사람이 모두 가져가고 다음 트릭을 엶
  const winner = trickWinner(m.trick, null, aceHigh);
  const cards = m.trick.map((p) => p.card);
  const pts = cards.reduce((a, c) => a + pointsOf(c, m.config), 0);
  m.taken[winner].push(...cards.filter((c) => pointsOf(c, m.config) !== 0));
  log(m, { type: 'trick', seat: winner, cards, points: pts });
  m.lastTrick = { plays: m.trick, winner };
  m.trick = [];
  m.trickNo++;
  m.leader = m.turn = winner;
  if (m.hands.every((h) => h.length === 0)) endHand(m);
}

function endHand(m: MatchState) {
  const pts = m.taken.map((t) => t.reduce((a, c) => a + pointsOf(c, m.config), 0));
  // 문 쏘기: 하트 전부(13) + 스페이드 Q 를 혼자 → 나머지 +26, 나는 0 (다이아 J 는 그대로)
  let moon: number | null = null;
  if (m.config.shootMoon) {
    m.taken.forEach((t, s) => {
      if (t.filter((c) => c.suit === HEART).length === 13 && t.some(isQueenOfSpades)) moon = s;
    });
  }
  const final =
    moon === null
      ? pts
      : pts.map((p, s) => {
          const j = m.config.jackBonus && m.taken[s].some(isJackOfDiamonds) ? -10 : 0;
          return s === moon ? j : 26 + j;
        });
  m.handScores.push(final);
  log(m, { type: 'hand', points: final, moon });
  const totals = matchTotals(m);
  if (totals.some((t) => t >= m.config.target)) {
    const low = Math.min(...totals);
    const winners = totals.flatMap((t, s) => (t === low ? [s] : []));
    log(m, { type: 'end', winners });
    m.status = 'match-over';
  } else m.status = 'round-over';
}

export function startNextRound(m: MatchState) {
  if (m.status !== 'round-over') throw new MoveError('아직 판이 끝나지 않았어요');
  m.round++;
  deal(m);
}

export function continueMatch(prev: MatchState, config: GameConfig, rng: () => number = Math.random): MatchState {
  if (matchTotals(prev).some((t) => t >= config.target)) throw new MoveError(`벌써 ${config.target}점에 닿은 사람이 있어요. 목표 점수를 올리면 이어서 할 수 있어요`);
  const m = newMatch(config, prev.players, rng);
  m.round = prev.handScores.length + 1;
  m.handScores = prev.handScores.map((r) => [...r]);
  return m;
}

/** 누적 점수 (낮을수록 좋음) */
export function matchTotals(m: Pick<MatchState, 'handScores' | 'players'>): number[] {
  const t = Array(m.players).fill(0);
  for (const r of m.handScores) r.forEach((v, i) => (t[i] += v));
  return t;
}

/** 시간 초과·대신 진행: 건네기는 높은 카드 3장, 내기는 낼 수 있는 가장 낮은 카드 */
export function autoMove(m: MatchState, seat: number): Move {
  if (m.phase === 'pass') {
    const hi = [...m.hands[seat]].sort((a, b) => pointsOf(b, m.config) - pointsOf(a, m.config) || aceHigh(b) - aceHigh(a));
    return { type: 'pass', cards: hi.slice(0, 3).map((c) => c.id) };
  }
  const legal = legalCards(m, seat).sort((a, b) => aceHigh(a) - aceHigh(b));
  return { type: 'play', card: legal[0].id };
}
