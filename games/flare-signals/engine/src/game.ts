import { RuleError } from '@bg/core';
import { GameConfig, copiesOf, handSizeFor, maxScore, validateConfig } from './config';

export class MoveError extends RuleError {}

export interface Card {
  id: string;
  color: number;
  value: number;
}

/** 카드에 대해 공개적으로 알려진 것 (힌트로 생긴 정보) */
export interface Clue {
  /** 이 카드를 가리킨 색 힌트들 (무지개면 여러 색일 수 있음) */
  colors: number[];
  /** 가리키지 않은(= 아님) 색 힌트들 */
  notColors: number[];
  value: number | null;
  notValues: number[];
  /** 힌트를 받은 적이 있는지 */
  touched: boolean;
  /** 힌트를 받을 때 이 카드가 "새로 가리켜진 가장 최근 카드(초점)"였는지 */
  focus: boolean;
  /** 그때 이 카드가 버릴 차례 카드(가장 오래된 힌트 없는 카드)였는지 — 보존 힌트 해석용 */
  focusOnChop: boolean;
  /** 받은 차례 번호 */
  at: number;
}

export interface HandCard extends Card {
  clue: Clue;
}

export type Move =
  | { type: 'hint'; to: number; color: number }
  | { type: 'hint'; to: number; value: number }
  | { type: 'play'; cardId: string }
  | { type: 'discard'; cardId: string };

export type LogEntry =
  | { n: number; seat: number; type: 'hint'; to: number; color?: number; value?: number; touched: string[] }
  | { n: number; seat: number; type: 'play'; card: Card; ok: boolean; bonus: boolean }
  | { n: number; seat: number; type: 'discard'; card: Card }
  | { n: number; seat: number; type: 'draw'; last: boolean };

export interface MatchState {
  config: GameConfig;
  players: number;
  round: number;
  status: 'playing' | 'round-over' | 'match-over';
  turn: number;
  /** 지금까지 둔 차례 수 */
  turnCount: number;
  deck: Card[];
  hands: HandCard[][];
  /** 색별로 쌓은 가장 큰 숫자 (0 = 아직 없음) */
  piles: number[];
  discard: Card[];
  hints: number;
  fuses: number;
  /** 덱이 바닥난 뒤 남은 차례 수 (null = 아직 덱 있음) */
  finalTurns: number | null;
  endReason: 'perfect' | 'bomb' | 'deck' | null;
  roundScores: number[];
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

export function buildDeck(c: GameConfig): Card[] {
  const out: Card[] = [];
  for (let color = 0; color < c.colors; color++) for (let v = 1; v <= 5; v++) for (let k = 0; k < copiesOf(c, color, v); k++) out.push({ id: `${color}-${v}-${k}`, color, value: v });
  return out;
}

const emptyClue = (): Clue => ({ colors: [], notColors: [], value: null, notValues: [], touched: false, focus: false, focusOnChop: false, at: -1 });

type DistOmit<T, K extends keyof never> = T extends unknown ? Omit<T, K> : never;
function log(m: MatchState, e: DistOmit<LogEntry, 'n'>) {
  m.log.push({ ...(e as LogEntry), n: ++m.seq });
  if (m.log.length > 60) m.log.shift();
}

function deal(m: MatchState) {
  const deck = buildDeck(m.config);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(nextRandom(m) * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  const hs = handSizeFor(m.config, m.players);
  m.hands = Array.from({ length: m.players }, () => deck.splice(0, hs).map((c) => ({ ...c, clue: emptyClue() })));
  m.deck = deck;
  m.piles = Array(m.config.colors).fill(0);
  m.discard = [];
  m.hints = m.config.hints;
  m.fuses = 0;
  m.finalTurns = null;
  m.endReason = null;
  m.turn = (m.round - 1) % m.players;
  m.turnCount = 0;
  m.status = 'playing';
}

export function newMatch(c: GameConfig, players: number, rng: () => number = Math.random): MatchState {
  const errors = validateConfig(c, players);
  if (errors.length) throw new MoveError(errors[0]);
  const m = {
    config: c,
    players,
    round: 1,
    roundScores: [],
    log: [],
    seq: 0,
    rng: Math.floor(rng() * 4294967296) >>> 0,
  } as unknown as MatchState;
  deal(m);
  return m;
}

/** 이 색 힌트가 이 카드를 가리키는지 (무지개는 모든 색에 반응) */
export const touchesColor = (c: GameConfig, card: Card, color: number) => card.color === color || (c.colors === 6 && c.sixth === 'rainbow' && card.color === 5);

/** 힌트로 줄 수 있는 색 (무지개 모드에선 무지개 자체를 힌트로 줄 수 없다) */
export const hintColors = (c: GameConfig) => Array.from({ length: c.colors === 6 && c.sixth === 'rainbow' ? 5 : c.colors }, (_, i) => i);

/** 버릴 차례 카드 = 힌트를 받지 않은 가장 오래된 카드 (손패 앞쪽이 오래된 것) */
export function chopIndex(hand: HandCard[]): number {
  return hand.findIndex((h) => !h.clue.touched);
}

export const isPlayable = (m: Pick<MatchState, 'piles'>, card: Card) => m.piles[card.color] === card.value - 1;

export const score = (m: Pick<MatchState, 'piles'>) => m.piles.reduce((a, b) => a + b, 0);

export function applyMove(m: MatchState, seat: number, move: Move) {
  if (m.status !== 'playing') throw new MoveError('지금은 진행 중인 판이 없어요');
  if (seat !== m.turn) throw new MoveError('지금은 내 차례가 아니에요');
  const c = m.config;
  if (move.type === 'hint') {
    if (m.hints <= 0) throw new MoveError('힌트 토큰이 없어요. 카드를 버리면 하나 돌아와요');
    if (!Number.isInteger(move.to) || move.to < 0 || move.to >= m.players || move.to === seat) throw new MoveError('다른 사람에게만 힌트를 줄 수 있어요');
    const hand = m.hands[move.to];
    const byColor = 'color' in move;
    if (byColor && !hintColors(c).includes(move.color)) throw new MoveError('그 색으로는 힌트를 줄 수 없어요');
    if (!byColor && !(move.value >= 1 && move.value <= 5)) throw new MoveError('1~5 숫자로만 힌트를 줄 수 있어요');
    const hit = hand.filter((h) => (byColor ? touchesColor(c, h, move.color) : h.value === move.value));
    if (!hit.length && !c.emptyHints) throw new MoveError(`${byColor ? '그 색' : `${move.value}`} 카드가 없어요. 손에 있는 카드를 가리키는 힌트만 줄 수 있어요`);
    const chop = chopIndex(hand);
    // 초점: 새로 가리켜진 카드 중 가장 최근 카드(손패 뒤쪽), 없으면 가리켜진 카드 중 가장 최근
    const fresh = hit.filter((h) => !h.clue.touched);
    const focusCard = (fresh.length ? fresh : hit)[(fresh.length ? fresh : hit).length - 1];
    for (const h of hand) {
      const on = hit.includes(h);
      if (byColor) {
        if (on) {
          if (!h.clue.colors.includes(move.color)) h.clue.colors.push(move.color);
        } else if (!h.clue.notColors.includes(move.color)) h.clue.notColors.push(move.color);
      } else if (on) h.clue.value = move.value;
      else if (!h.clue.notValues.includes(move.value)) h.clue.notValues.push(move.value);
      if (on) {
        h.clue.touched = true;
        h.clue.at = m.turnCount;
      }
      if (h === focusCard) {
        h.clue.focus = true;
        h.clue.focusOnChop = hand.indexOf(h) === chop;
      }
    }
    m.hints--;
    log(m, { seat, type: 'hint', to: move.to, ...(byColor ? { color: move.color } : { value: move.value }), touched: hit.map((h) => h.id) });
    return endTurn(m);
  }
  const hand = m.hands[seat];
  const idx = hand.findIndex((h) => h.id === move.cardId);
  if (idx < 0) throw new MoveError('손에 없는 카드예요');
  if (move.type === 'discard') {
    if (m.hints >= c.hints) throw new MoveError('힌트 토큰이 가득 차 있어서 버릴 수 없어요. 힌트를 주거나 카드를 내 주세요');
    const [card] = hand.splice(idx, 1);
    m.discard.push(strip(card));
    m.hints++;
    log(m, { seat, type: 'discard', card: strip(card) });
    draw(m, seat);
    return endTurn(m);
  }
  if (move.type === 'play') {
    const [card] = hand.splice(idx, 1);
    const ok = isPlayable(m, card);
    let bonus = false;
    if (ok) {
      m.piles[card.color] = card.value;
      if (card.value === 5 && m.hints < c.hints) {
        m.hints++;
        bonus = true;
      }
    } else {
      m.fuses++;
      m.discard.push(strip(card));
    }
    log(m, { seat, type: 'play', card: strip(card), ok, bonus });
    if (m.fuses >= c.fuses) return endRound(m, 'bomb');
    if (score(m) >= maxScore(c)) return endRound(m, 'perfect');
    draw(m, seat);
    return endTurn(m);
  }
  throw new MoveError('할 수 없는 동작이에요');
}

const strip = (h: HandCard | Card): Card => ({ id: h.id, color: h.color, value: h.value });

function draw(m: MatchState, seat: number) {
  const card = m.deck.pop();
  if (!card) return;
  m.hands[seat].push({ ...card, clue: emptyClue() });
  if (m.deck.length === 0) {
    m.finalTurns = m.config.lastRound ? m.players + 1 : 1; // endTurn에서 이번 차례를 하나 빼므로 +1
    log(m, { seat, type: 'draw', last: true });
  }
}

function endTurn(m: MatchState) {
  m.turnCount++;
  if (m.finalTurns !== null) {
    m.finalTurns--;
    if (m.finalTurns <= 0) return endRound(m, 'deck');
  }
  m.turn = (m.turn + 1) % m.players;
}

function endRound(m: MatchState, reason: 'perfect' | 'bomb' | 'deck') {
  m.endReason = reason;
  m.roundScores.push(reason === 'bomb' && m.config.bombScore === 'zero' ? 0 : score(m));
  m.status = m.round >= m.config.rounds ? 'match-over' : 'round-over';
}

export function startNextRound(m: MatchState) {
  if (m.status !== 'round-over') throw new MoveError('아직 판이 끝나지 않았어요');
  m.round++;
  deal(m);
}

export function continueMatch(prev: MatchState, config: GameConfig, rng: () => number = Math.random): MatchState {
  const done = prev.roundScores.length;
  if (done >= config.rounds) throw new MoveError(`벌써 ${done}판을 마쳤어요. 판 수를 ${done + 1}판 이상으로 늘리면 이어서 할 수 있어요`);
  const m = newMatch(config, prev.players, rng);
  m.round = done + 1;
  m.roundScores = [...prev.roundScores];
  deal(m);
  return m;
}

/** 협력 게임: 모두 같은 점수 (판 점수 합) */
export function matchTotals(m: Pick<MatchState, 'roundScores' | 'players'>): number[] {
  const t = m.roundScores.reduce((a, b) => a + b, 0);
  return Array(m.players).fill(t);
}

/** 남은 카드 중 이 카드가 마지막 한 장인지 (버리면 그 색은 더 못 쌓음) */
export function isCritical(m: Pick<MatchState, 'config' | 'discard' | 'piles'>, card: Card): boolean {
  if (m.piles[card.color] >= card.value) return false;
  const gone = m.discard.filter((d) => d.color === card.color && d.value === card.value).length;
  return copiesOf(m.config, card.color, card.value) - gone === 1;
}

/** 자동 진행: 버릴 수 있으면 버릴 차례 카드, 아니면 다음 사람에게 아무 힌트 */
export function autoMove(m: MatchState, seat: number): Move {
  const hand = m.hands[seat];
  if (m.hints < m.config.hints && hand.length) {
    const chop = chopIndex(hand);
    return { type: 'discard', cardId: hand[chop >= 0 ? chop : 0].id };
  }
  if (m.hints > 0) {
    for (let k = 1; k < m.players; k++) {
      const to = (seat + k) % m.players;
      const target = m.hands[to][0];
      if (target) return { type: 'hint', to, value: target.value };
    }
  }
  return { type: 'play', cardId: hand[0].id };
}
