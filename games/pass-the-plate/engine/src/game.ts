import { RuleError } from '@bg/core';
import { DUMPLING_SCORE, Dish, MAKI_ROLLS, NIGIRI } from './cards';
import { GameConfig, deckCopies, handSizeFor, oneDeck, validateConfig } from './config';

export class MoveError extends RuleError {}

export interface Card {
  id: string;
  dish: Dish;
}

/** 앞에 놓인 카드 (초밥이 겨자 위에 올라갔으면 onWasabi) */
export interface Played extends Card {
  onWasabi?: boolean;
  /** 초밥이 올라가 쓴 겨자 */
  used?: boolean;
}

export type Move = { type: 'pick'; cardId: string; second?: string };

export interface RoundScore {
  maki: number;
  tempura: number;
  sashimi: number;
  dumpling: number;
  nigiri: number;
  total: number;
}

export interface MatchState {
  config: GameConfig;
  players: number;
  round: number;
  status: 'playing' | 'round-over' | 'match-over';
  /** 이번 판 몇 번째 고르기 (1부터) */
  turn: number;
  deck: Card[];
  hands: Card[][];
  tableaus: Played[][];
  /** 판을 넘어 남는 푸딩 */
  puddings: number[];
  picks: ({ cardId: string; second?: string } | null)[];
  /** 지난 공개 (화면 애니메이션) */
  revealed: { seat: number; cards: Dish[] }[];
  roundScores: RoundScore[][];
  puddingScore: number[] | null;
  rng: number;
}

function nextRandom(m: { rng: number }): number {
  let t = (m.rng = (m.rng + 0x6d2b79f5) >>> 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function buildDeck(m: MatchState): Card[] {
  const one = oneDeck(m.config);
  const copies = deckCopies(m.config, m.players);
  const out: Card[] = [];
  for (let k = 0; k < copies; k++) one.forEach((dish, i) => out.push({ id: `${dish}-${k}-${i}`, dish }));
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(nextRandom(m) * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function deal(m: MatchState) {
  const hs = handSizeFor(m.config, m.players);
  m.hands = Array.from({ length: m.players }, () => m.deck.splice(0, hs));
  m.tableaus = Array.from({ length: m.players }, () => []);
  m.picks = Array(m.players).fill(null);
  m.revealed = [];
  m.turn = 1;
  m.status = 'playing';
}

export function newMatch(c: GameConfig, players: number, rng: () => number = Math.random): MatchState {
  const errors = validateConfig(c, players);
  if (errors.length) throw new MoveError(errors[0]);
  const m = { config: c, players, round: 1, puddings: Array(players).fill(0), roundScores: [], puddingScore: null, rng: Math.floor(rng() * 4294967296) >>> 0 } as unknown as MatchState;
  m.deck = buildDeck(m);
  deal(m);
  return m;
}

export const hasChopsticks = (t: Played[]) => t.some((p) => p.dish === 'chopsticks');

export function actors(m: MatchState): number[] {
  if (m.status !== 'playing') return [];
  return m.picks.flatMap((p, i) => (p === null ? [i] : []));
}

export function applyMove(m: MatchState, seat: number, move: Move) {
  if (m.status !== 'playing') throw new MoveError('지금은 진행 중인 판이 없어요');
  if (move.type !== 'pick') throw new MoveError('카드를 골라 주세요');
  if (m.picks[seat] && !m.config.allowChange) throw new MoveError('이미 골랐어요');
  const hand = m.hands[seat];
  if (!hand.some((c) => c.id === move.cardId)) throw new MoveError('손에 없는 카드예요');
  if (move.second !== undefined) {
    if (!hasChopsticks(m.tableaus[seat])) throw new MoveError('젓가락이 있어야 2장을 고를 수 있어요');
    if (move.second === move.cardId || !hand.some((c) => c.id === move.second)) throw new MoveError('다른 카드 1장을 더 골라 주세요');
  }
  m.picks[seat] = { cardId: move.cardId, second: move.second };
  if (m.picks.every((p) => p !== null)) reveal(m);
}

function place(t: Played[], card: Card) {
  if (NIGIRI[card.dish]) {
    const w = t.find((p) => p.dish === 'wasabi' && !p.used);
    if (w) {
      w.used = true;
      t.push({ ...card, onWasabi: true });
      return;
    }
  }
  t.push({ ...card });
}

function reveal(m: MatchState) {
  m.revealed = [];
  for (let s = 0; s < m.players; s++) {
    const p = m.picks[s]!;
    const hand = m.hands[s];
    const ids = [p.cardId, ...(p.second ? [p.second] : [])];
    const cards = ids.map((id) => hand.find((c) => c.id === id)!);
    m.hands[s] = hand.filter((c) => !ids.includes(c.id));
    for (const c of cards) place(m.tableaus[s], c);
    if (p.second) {
      // 젓가락은 손패로 돌아가 다음 사람에게 넘어감
      const ci = m.tableaus[s].findIndex((x) => x.dish === 'chopsticks');
      const [chop] = m.tableaus[s].splice(ci, 1);
      m.hands[s].push({ id: chop.id, dish: chop.dish });
    }
    m.revealed.push({ seat: s, cards: cards.map((c) => c.dish) });
  }
  m.picks = Array(m.players).fill(null);
  if (m.hands.every((h) => h.length === 0)) return endRound(m);
  // 넘기기: 왼쪽(다음 좌석)으로, 판마다 바꾸기 설정이면 짝수 판은 반대로
  const dir = m.config.pass === 'alternate' && m.round % 2 === 0 ? -1 : 1;
  const old = m.hands;
  m.hands = old.map((_, s) => old[(s - dir + m.players) % m.players]);
  m.turn++;
}

/** 한 판 점수 (김밥 순위는 모두를 보고) */
export function scoreRound(tableaus: Played[][]): RoundScore[] {
  const rolls = tableaus.map((t) => t.reduce((a, p) => a + (MAKI_ROLLS[p.dish] ?? 0), 0));
  const first = Math.max(...rolls);
  const firsts = rolls.flatMap((r, i) => (r === first && r > 0 ? [i] : []));
  const rest = rolls.filter((r) => r < first);
  const second = rest.length ? Math.max(...rest) : 0;
  const seconds = firsts.length === 1 ? rolls.flatMap((r, i) => (r === second && r > 0 ? [i] : [])) : [];
  return tableaus.map((t, i) => {
    const n = (d: Dish) => t.filter((p) => p.dish === d).length;
    const maki = firsts.includes(i) ? Math.floor(6 / firsts.length) : seconds.includes(i) ? Math.floor(3 / seconds.length) : 0;
    const tempura = Math.floor(n('tempura') / 2) * 5;
    const sashimi = Math.floor(n('sashimi') / 3) * 10;
    const dumpling = DUMPLING_SCORE[Math.min(5, n('dumpling'))];
    const nigiri = t.reduce((a, p) => a + (NIGIRI[p.dish] ?? 0) * (p.onWasabi ? 3 : 1), 0);
    return { maki, tempura, sashimi, dumpling, nigiri, total: maki + tempura + sashimi + dumpling + nigiri };
  });
}

/** 게임 끝 푸딩: 가장 많으면 +6(나눔), 가장 적으면 −6(나눔, 2명이면 없음) */
export function scorePudding(puddings: number[]): number[] {
  const max = Math.max(...puddings);
  const min = Math.min(...puddings);
  const out = puddings.map(() => 0);
  if (max === min) return out;
  const tops = puddings.flatMap((p, i) => (p === max ? [i] : []));
  tops.forEach((i) => (out[i] += Math.floor(6 / tops.length)));
  if (puddings.length > 2) {
    const lows = puddings.flatMap((p, i) => (p === min ? [i] : []));
    lows.forEach((i) => (out[i] -= Math.floor(6 / lows.length)));
  }
  return out;
}

function endRound(m: MatchState) {
  m.roundScores.push(scoreRound(m.tableaus));
  m.tableaus.forEach((t, i) => (m.puddings[i] += t.filter((p) => p.dish === 'pudding').length));
  if (m.round >= m.config.rounds) {
    m.puddingScore = m.config.menu.pudding ? scorePudding(m.puddings) : m.puddings.map(() => 0);
    m.status = 'match-over';
  } else m.status = 'round-over';
}

export function startNextRound(m: MatchState) {
  if (m.status !== 'round-over') throw new MoveError('아직 판이 끝나지 않았어요');
  m.round++;
  if (m.deck.length < m.players * handSizeFor(m.config, m.players)) m.deck = buildDeck(m);
  deal(m);
}

export function continueMatch(prev: MatchState, config: GameConfig, rng: () => number = Math.random): MatchState {
  const done = prev.roundScores.length;
  if (done >= config.rounds) throw new MoveError(`벌써 ${done}판을 마쳤어요. 판 수를 ${done + 1}판 이상으로 늘리면 이어서 할 수 있어요`);
  const m = newMatch(config, prev.players, rng);
  m.round = done + 1;
  m.roundScores = prev.roundScores.map((r) => r.map((x) => ({ ...x })));
  m.puddings = [...prev.puddings];
  return m;
}

export function matchTotals(m: Pick<MatchState, 'roundScores' | 'players' | 'puddingScore'>): number[] {
  const t = Array(m.players).fill(0);
  for (const r of m.roundScores) r.forEach((x, i) => (t[i] += x.total));
  if (m.puddingScore) m.puddingScore.forEach((x, i) => (t[i] += x));
  return t;
}

/** 시간 초과·대신 진행: 손패 첫 카드 */
export function autoMove(m: MatchState, seat: number): Move {
  return { type: 'pick', cardId: m.hands[seat][0].id };
}
