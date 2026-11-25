import { RuleError } from '@bg/core';
import { DECK, HCard, piCount, scoreCards } from './cards';
import { GameConfig, goAtFor } from './config';

export class MoveError extends RuleError {}

/** play: 손패 한 장 (같은 달이 바닥에 두 장이면 target 으로 어느 것을 먹을지) · go · stop */
export type Move = { type: 'play'; card: string; target?: string } | { type: 'go' } | { type: 'stop' };

export type Special = '쪽' | '뻑' | '따닥' | '싹쓸이';
export type LogEntry =
  | { n: number; type: 'play'; seat: number; card: HCard; flip: HCard | null; took: HCard[]; special: Special[]; stolen: number }
  | { n: number; type: 'go'; seat: number; count: number; score: number }
  | { n: number; type: 'stop'; seat: number; points: number; detail: string[] }
  | { n: number; type: 'nagari' }
  | { n: number; type: 'deal'; round: number };

export interface MatchState {
  config: GameConfig;
  players: number;
  round: number;
  status: 'playing' | 'round-over' | 'match-over';
  phase: 'play' | 'gostop';
  hands: HCard[][];
  table: HCard[];
  pile: HCard[];
  captured: HCard[][];
  goes: number[];
  /** 마지막으로 고를 부른 점수 (점수가 이보다 올라야 다시 고/스톱) */
  goScore: number[];
  turn: number;
  dealer: number;
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
  if (m.log.length > 100) m.log.shift();
}

/** 카드 가치 (먹을 카드 고르기·봇) */
export const cardValue = (c: HCard) => (c.kind === 'gwang' ? 6 : c.bird ? 4 : c.kind === 'ribbon' ? (c.ribbon === 'plain' ? 2 : 3) : c.kind === 'animal' ? 2 : c.kind === 'double' ? 2.5 : 1);

function deal(m: MatchState) {
  const deck = [...DECK];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(nextRandom(m) * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  const handSize = m.players === 2 ? 10 : 7;
  const tableSize = m.players === 2 ? 8 : 6;
  m.hands = Array.from({ length: m.players }, (_, s) => deck.slice(s * handSize, (s + 1) * handSize));
  m.table = deck.slice(m.players * handSize, m.players * handSize + tableSize);
  m.pile = deck.slice(m.players * handSize + tableSize);
  m.captured = Array.from({ length: m.players }, () => []);
  m.goes = Array(m.players).fill(0);
  m.goScore = Array(m.players).fill(0);
  m.turn = m.dealer;
  m.phase = 'play';
  m.status = 'playing';
  log(m, { type: 'deal', round: m.round });
}

export function newMatch(c: GameConfig, players: number, rng: () => number = Math.random): MatchState {
  const m = { config: c, players, round: 1, roundScores: [], log: [], seq: 0, rng: Math.floor(rng() * 4294967296) >>> 0 } as unknown as MatchState;
  m.dealer = Math.floor(nextRandom(m) * players);
  deal(m);
  return m;
}

export function actors(m: MatchState): number[] {
  return m.status === 'playing' ? [m.turn] : [];
}

export const scoreOf = (m: Pick<MatchState, 'captured'>, seat: number) => scoreCards(m.captured[seat]).total;

/** 상대 한 사람에게서 피 한 장 (쌍피보다 일반 피 먼저) */
function stealPi(m: MatchState, from: number, to: number): boolean {
  const pile = m.captured[from];
  const i = pile.findIndex((c) => c.kind === 'pi');
  const j = i >= 0 ? i : pile.findIndex((c) => c.kind === 'double');
  if (j < 0) return false;
  m.captured[to].push(pile.splice(j, 1)[0]);
  return true;
}

const best = (cards: HCard[]) => [...cards].sort((a, b) => cardValue(b) - cardValue(a))[0];

export function applyMove(m: MatchState, seat: number, move: Move) {
  if (m.status !== 'playing') throw new MoveError('지금은 진행 중인 판이 없어요');
  if (seat !== m.turn) throw new MoveError('지금은 내 차례가 아니에요');
  if (move.type === 'go' || move.type === 'stop') {
    if (m.phase !== 'gostop') throw new MoveError('지금은 고/스톱을 부를 때가 아니에요');
    const noCards = m.hands.every((h) => h.length === 0);
    if (move.type === 'go' && noCards) throw new MoveError('카드가 다 떨어져서 스톱만 할 수 있어요');
    if (move.type === 'go') {
      m.goes[seat]++;
      m.goScore[seat] = scoreOf(m, seat);
      log(m, { type: 'go', seat, count: m.goes[seat], score: m.goScore[seat] });
      m.phase = 'play';
      return nextTurn(m);
    }
    return stop(m, seat);
  }
  if (m.phase !== 'play') throw new MoveError('먼저 고 또는 스톱을 정해요');
  const card = m.hands[seat].find((c) => c.id === move.card);
  if (!card) throw new MoveError('손에 없는 카드예요');
  m.hands[seat] = m.hands[seat].filter((c) => c !== card);
  const take: HCard[] = [];
  const special: Special[] = [];
  const same1 = m.table.filter((c) => c.month === card.month);
  let partner: HCard | null = null;
  if (same1.length === 2) partner = same1.find((c) => c.id === move.target) ?? best(same1);
  else if (same1.length === 1) partner = same1[0];
  // 뒤집기
  const flip = m.pile.shift() ?? null;
  if (flip && flip.month === card.month) {
    if (same1.length === 0) {
      take.push(card, flip);
      special.push('쪽');
    } else if (same1.length === 1) {
      // 뻑: 세 장이 바닥에 그대로
      m.table.push(card, flip);
      special.push('뻑');
    } else if (same1.length === 2) {
      take.push(card, flip, ...same1);
      m.table = m.table.filter((c) => !same1.includes(c));
      special.push('따닥');
    } else {
      take.push(card, ...same1);
      m.table = m.table.filter((c) => !same1.includes(c));
      m.table.push(flip);
    }
  } else {
    // 낸 카드
    if (same1.length === 3) {
      take.push(card, ...same1);
      m.table = m.table.filter((c) => !same1.includes(c));
    } else if (partner) {
      take.push(card, partner);
      m.table = m.table.filter((c) => c !== partner);
    } else m.table.push(card);
    // 뒤집은 카드
    if (flip) {
      const same2 = m.table.filter((c) => c.month === flip.month);
      if (same2.length === 3) {
        take.push(flip, ...same2);
        m.table = m.table.filter((c) => !same2.includes(c));
      } else if (same2.length >= 1) {
        const p2 = same2.length === 2 ? best(same2) : same2[0];
        take.push(flip, p2);
        m.table = m.table.filter((c) => c !== p2);
      } else m.table.push(flip);
    }
  }
  m.captured[seat].push(...take);
  if (take.length && m.table.length === 0 && (m.pile.length || m.hands.some((h) => h.length))) special.push('싹쓸이');
  let stolen = 0;
  if (m.config.steal) {
    const times = special.filter((s) => s !== '뻑').length;
    for (let k = 0; k < times; k++) for (let o = 0; o < m.players; o++) if (o !== seat && stealPi(m, o, seat)) stolen++;
  }
  log(m, { type: 'play', seat, card, flip, took: take, special, stolen });
  // 고/스톱: 점수가 기준 이상이고 지난번 고 때보다 올랐으면
  const score = scoreOf(m, seat);
  if (score >= goAtFor(m.config, m.players) && score > m.goScore[seat]) {
    m.phase = 'gostop';
    return;
  }
  nextTurn(m);
}

function nextTurn(m: MatchState) {
  if (m.hands.every((h) => h.length === 0)) {
    // 아무도 스톱을 못 하고 카드가 떨어짐: 나가리
    m.roundScores.push(Array(m.players).fill(0));
    log(m, { type: 'nagari' });
    return endRound(m);
  }
  do m.turn = (m.turn + 1) % m.players;
  while (m.hands[m.turn].length === 0);
}

/** 스톱: 점수 + 고 보너스, 3고부터 두 배씩, 진 사람마다 피박·광박이면 두 배 */
function stop(m: MatchState, seat: number) {
  const { total, lines } = scoreCards(m.captured[seat]);
  const g = m.goes[seat];
  let base = total + Math.min(g, 2);
  if (g >= 3) base *= 2 ** (g - 2);
  const detail = lines.map((l) => `${l.label} ${l.points}`);
  if (g) detail.push(`${g}고`);
  const scores = Array(m.players).fill(0);
  const winnerPi = piCount(m.captured[seat]);
  const winnerGwang = m.captured[seat].filter((c) => c.kind === 'gwang').length;
  for (let o = 0; o < m.players; o++) {
    if (o === seat) continue;
    let pay = base;
    if (m.config.bak) {
      const pi = piCount(m.captured[o]);
      if (winnerPi >= 10 && pi > 0 && pi < 6) {
        pay *= 2;
        detail.push(`피박(${pi}장)`);
      }
      if (winnerGwang >= 3 && !m.captured[o].some((c) => c.kind === 'gwang')) {
        pay *= 2;
        detail.push('광박');
      }
    }
    scores[o] = -pay;
    scores[seat] += pay;
  }
  m.roundScores.push(scores);
  log(m, { type: 'stop', seat, points: scores[seat], detail: [...new Set(detail)] });
  m.dealer = seat;
  endRound(m);
}

function endRound(m: MatchState) {
  m.status = m.round >= m.config.rounds ? 'match-over' : 'round-over';
}

export function startNextRound(m: MatchState) {
  if (m.status !== 'round-over') throw new MoveError('아직 판이 끝나지 않았어요');
  m.round++;
  deal(m);
}

export function continueMatch(prev: MatchState, config: GameConfig, rng: () => number = Math.random): MatchState {
  const done = prev.roundScores.length;
  if (done >= config.rounds) throw new MoveError(`벌써 ${done}판을 마쳤어요. 판 수를 늘리면 이어서 할 수 있어요`);
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

/** 대신 진행: 스톱 / 가장 값진 걸 먹는 카드 */
export function autoMove(m: MatchState, seat: number): Move {
  if (m.phase === 'gostop') return { type: 'stop' };
  const hand = m.hands[seat];
  let bestCard = hand[0];
  let bestV = -1;
  for (const c of hand) {
    const same = m.table.filter((t) => t.month === c.month);
    const v = same.length ? cardValue(c) + Math.max(...same.map(cardValue)) : 0;
    if (v > bestV) {
      bestV = v;
      bestCard = c;
    }
  }
  return { type: 'play', card: bestCard.id };
}
