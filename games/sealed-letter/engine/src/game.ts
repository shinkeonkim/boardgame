import { RuleError } from '@bg/core';
import { Kind, deckSpec, valueOf } from './cards';
import { GameConfig, tokensFor, validateConfig } from './config';

export class MoveError extends RuleError {}

export interface Card {
  id: string;
  kind: Kind;
  value: number;
}

export type Move = { type: 'play'; cardId: string; target?: number; guess?: Kind } | { type: 'keep'; cardId: string };

export type LogEntry =
  | { n: number; type: 'play'; seat: number; card: Card; target?: number; guess?: Kind; result?: string }
  | { n: number; type: 'out'; seat: number; card: Card | null; why: string }
  | { n: number; type: 'round'; winners: number[]; spy: number | null };

export interface MatchState {
  config: GameConfig;
  players: number;
  round: number;
  status: 'playing' | 'round-over' | 'match-over';
  phase: 'play' | 'scribe';
  turn: number;
  deck: Card[];
  /** 한 장은 몰래 빼 둔다 (사절로 더미가 비었을 때 이 카드를 뽑음) */
  burned: Card | null;
  /** 2명일 때 공개로 빼 둔 카드 */
  burnedOpen: Card[];
  hands: Card[][];
  discards: Card[][];
  alive: boolean[];
  protectedSeats: boolean[];
  tokens: number[];
  /** 아는 카드: known[보는 사람][대상] = 카드 id (대상이 그 카드를 아직 들고 있을 때만 유효) */
  known: (string | null)[][];
  /** 판 결과 */
  roundWinners: number[][];
  lastRound: { winners: number[]; spy: number | null; reveal: (Card | null)[]; reason: 'last' | 'deck' } | null;
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

export function buildDeck(edition: 'classic' | 'extended'): Card[] {
  const out: Card[] = [];
  for (const s of deckSpec(edition)) for (let k = 0; k < s.copies; k++) out.push({ id: `${s.kind}${k}`, kind: s.kind, value: s.value });
  return out;
}

function deal(m: MatchState, first: number) {
  const deck = buildDeck(m.config.edition);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(nextRandom(m) * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  m.burned = deck.pop()!;
  m.burnedOpen = m.players === 2 && m.config.twoPlayerReveal ? deck.splice(-3, 3) : [];
  m.hands = Array.from({ length: m.players }, () => [deck.pop()!]);
  m.deck = deck;
  m.discards = Array.from({ length: m.players }, () => []);
  m.alive = Array(m.players).fill(true);
  m.protectedSeats = Array(m.players).fill(false);
  m.known = Array.from({ length: m.players }, () => Array(m.players).fill(null));
  m.turn = first;
  m.phase = 'play';
  m.status = 'playing';
  m.lastRound = null;
  startTurn(m);
}

export function newMatch(c: GameConfig, players: number, rng: () => number = Math.random): MatchState {
  const errors = validateConfig(c, players);
  if (errors.length) throw new MoveError(errors[0]);
  const m = { config: c, players, round: 1, tokens: Array(players).fill(0), roundWinners: [], log: [], seq: 0, rng: Math.floor(rng() * 4294967296) >>> 0 } as unknown as MatchState;
  deal(m, Math.floor(nextRandom(m) * players));
  return m;
}

function startTurn(m: MatchState) {
  m.protectedSeats[m.turn] = false;
  const c = m.deck.pop();
  if (c) m.hands[m.turn].push(c);
}

const aliveSeats = (m: MatchState) => m.alive.flatMap((a, i) => (a ? [i] : []));

/** 지목할 수 있는 상대 (살아 있고 보호받지 않음) */
export function targetsFor(m: Pick<MatchState, 'alive' | 'protectedSeats' | 'players'>, seat: number, self: boolean): number[] {
  return Array.from({ length: m.players }, (_, i) => i).filter((i) => m.alive[i] && (i === seat ? self : !m.protectedSeats[i]));
}

/** 밀정 규칙: 사절·재상과 함께면 밀정을 내야 함 */
export function mustPlayAgent(hand: Card[]): boolean {
  return hand.some((c) => c.kind === 'agent') && hand.some((c) => c.kind === 'envoy' || c.kind === 'chancellor');
}

function eliminate(m: MatchState, seat: number, why: string) {
  m.alive[seat] = false;
  const hand = m.hands[seat];
  m.discards[seat].push(...hand);
  m.hands[seat] = [];
  log(m, { type: 'out', seat, card: hand[0] ?? null, why });
}

export function actors(m: MatchState): number[] {
  return m.status === 'playing' ? [m.turn] : [];
}

export function applyMove(m: MatchState, seat: number, move: Move) {
  if (m.status !== 'playing') throw new MoveError('지금은 진행 중인 판이 없어요');
  if (seat !== m.turn) throw new MoveError('지금은 내 차례가 아니에요');
  const hand = m.hands[seat];
  if (m.phase === 'scribe') {
    if (move.type !== 'keep') throw new MoveError('남길 카드 1장을 골라 주세요');
    const keep = hand.find((c) => c.id === move.cardId);
    if (!keep) throw new MoveError('손에 없는 카드예요');
    const rest = hand.filter((c) => c !== keep);
    m.hands[seat] = [keep];
    m.deck.unshift(...rest); // 더미 밑으로
    m.phase = 'play';
    return endTurn(m);
  }
  if (move.type !== 'play') throw new MoveError('카드를 내 주세요');
  const card = hand.find((c) => c.id === move.cardId);
  if (!card) throw new MoveError('손에 없는 카드예요');
  if (mustPlayAgent(hand) && card.kind !== 'agent') throw new MoveError('재상이나 사절과 함께 들고 있으면 밀정을 내야 해요');
  const def = card.kind;
  const self = def === 'envoy';
  const needs = ['watch', 'seer', 'duelist', 'envoy', 'chancellor'].includes(def);
  const options = targetsFor(m, seat, self);
  let target = move.target;
  if (needs) {
    if (options.length === 0 || (options.length === 1 && options[0] === seat && def !== 'envoy')) target = undefined; // 지목할 사람이 없으면 효과 없이 냄
    else if (target === undefined || !options.includes(target)) throw new MoveError(options.length ? '지목할 사람을 골라 주세요 (보호 중인 사람은 안 돼요)' : '지목할 수 있는 사람이 없어요');
  }
  if (def === 'watch' && target !== undefined) {
    if (!move.guess) throw new MoveError('어떤 카드인지 골라 주세요');
    if (m.config.guardNoGuard && move.guess === 'watch') throw new MoveError('파수꾼으로 파수꾼을 지목할 수는 없어요');
  }
  // 손에서 내기
  m.hands[seat] = hand.filter((c) => c !== card);
  m.discards[seat].push(card);
  let result: string | undefined;
  const other = target !== undefined ? m.hands[target][0] : undefined;
  switch (def) {
    case 'queen':
      log(m, { type: 'play', seat, card });
      eliminate(m, seat, '여왕을 내놓았어요');
      return endTurn(m);
    case 'watch':
      if (target !== undefined && other) {
        const hit = other.kind === move.guess;
        result = hit ? '맞혔어요!' : '아니었어요';
        log(m, { type: 'play', seat, card, target, guess: move.guess, result });
        if (hit) eliminate(m, target, `파수꾼이 ${move.guess}을(를) 맞혔어요`);
      } else log(m, { type: 'play', seat, card, result: '지목할 사람이 없어요' });
      break;
    case 'seer':
      if (target !== undefined && other) m.known[seat][target] = other.id;
      log(m, { type: 'play', seat, card, target, result: target !== undefined ? '몰래 봤어요' : '지목할 사람이 없어요' });
      break;
    case 'duelist':
      if (target !== undefined && other) {
        const mine = m.hands[seat][0];
        m.known[seat][target] = other.id;
        m.known[target][seat] = mine.id;
        if (mine.value === other.value) result = '비겼어요';
        else {
          const loser = mine.value < other.value ? seat : target;
          result = `${loser === seat ? '낸 사람' : '지목당한 사람'}이 졌어요`;
          log(m, { type: 'play', seat, card, target, result });
          eliminate(m, loser, '결투에서 졌어요');
          return endTurn(m);
        }
      }
      log(m, { type: 'play', seat, card, target, result: result ?? '지목할 사람이 없어요' });
      break;
    case 'shield':
      m.protectedSeats[seat] = true;
      log(m, { type: 'play', seat, card });
      break;
    case 'envoy': {
      const t = target ?? seat;
      const dropped = m.hands[t][0];
      log(m, { type: 'play', seat, card, target: t });
      if (dropped) {
        m.hands[t] = [];
        m.discards[t].push(dropped);
        if (dropped.kind === 'queen') {
          m.alive[t] = false;
          log(m, { type: 'out', seat: t, card: dropped, why: '여왕을 버렸어요' });
          return endTurn(m);
        }
        const fresh = m.deck.pop() ?? m.burned;
        if (fresh === m.burned) m.burned = null;
        if (fresh) m.hands[t] = [fresh];
        for (const row of m.known) row[t] = null;
      }
      break;
    }
    case 'chancellor':
      if (target !== undefined && other) {
        const mine = m.hands[seat][0];
        m.hands[seat] = [other];
        m.hands[target] = [mine];
        for (const row of m.known) {
          row[seat] = null;
          row[target] = null;
        }
        m.known[seat][target] = mine.id;
        m.known[target][seat] = other.id;
        result = '카드를 맞바꿨어요';
      }
      log(m, { type: 'play', seat, card, target, result: result ?? '지목할 사람이 없어요' });
      break;
    case 'scribe': {
      log(m, { type: 'play', seat, card });
      const extra = [m.deck.pop(), m.deck.pop()].filter(Boolean) as Card[];
      if (extra.length) {
        m.hands[seat].push(...extra);
        m.phase = 'scribe';
        return;
      }
      break;
    }
    default:
      log(m, { type: 'play', seat, card });
  }
  endTurn(m);
}

function endTurn(m: MatchState) {
  const left = aliveSeats(m);
  if (left.length <= 1) return endRound(m, left, 'last');
  if (m.deck.length === 0) {
    // 더미가 비면 남은 사람끼리 카드 숫자 비교 (같으면 버린 카드 합)
    const best = Math.max(...left.map((s) => m.hands[s][0]?.value ?? -1));
    let tied = left.filter((s) => (m.hands[s][0]?.value ?? -1) === best);
    if (tied.length > 1) {
      const sum = (s: number) => m.discards[s].reduce((a, c) => a + c.value, 0);
      const top = Math.max(...tied.map(sum));
      tied = tied.filter((s) => sum(s) === top);
    }
    return endRound(m, tied, 'deck');
  }
  do m.turn = (m.turn + 1) % m.players;
  while (!m.alive[m.turn]);
  startTurn(m);
}

function endRound(m: MatchState, winners: number[], reason: 'last' | 'deck') {
  for (const w of winners) m.tokens[w]++;
  // 첩자: 살아남은 사람 중 첩자를 낸 사람이 혼자면 +1
  let spy: number | null = null;
  if (m.config.edition === 'extended') {
    const spies = aliveSeats(m).filter((s) => m.discards[s].some((c) => c.kind === 'spy'));
    if (spies.length === 1) {
      spy = spies[0];
      m.tokens[spy]++;
    }
  }
  m.roundWinners.push(winners);
  m.lastRound = { winners, spy, reveal: m.hands.map((h) => h[0] ?? null), reason };
  log(m, { type: 'round', winners, spy });
  const goal = tokensFor(m.config, m.players);
  m.status = m.tokens.some((t) => t >= goal) ? 'match-over' : 'round-over';
}

export function startNextRound(m: MatchState) {
  if (m.status !== 'round-over') throw new MoveError('아직 판이 끝나지 않았어요');
  m.round++;
  const last = m.roundWinners[m.roundWinners.length - 1] ?? [];
  deal(m, m.config.winnerStarts && last.length ? last[0] : Math.floor(nextRandom(m) * m.players));
}

export function continueMatch(prev: MatchState, config: GameConfig, rng: () => number = Math.random): MatchState {
  const m = newMatch(config, prev.players, rng);
  m.tokens = [...prev.tokens];
  m.round = prev.roundWinners.length + 1;
  m.roundWinners = prev.roundWinners.map((w) => [...w]);
  if (m.tokens.some((t) => t >= tokensFor(config, m.players))) throw new MoveError('이미 우승자가 나왔어요. 목표 인장 수를 늘리면 이어서 할 수 있어요');
  return m;
}

export const matchTotals = (m: Pick<MatchState, 'tokens'>) => [...m.tokens];

/** 시간 초과·대신 진행: 낮은 카드(여왕 제외)를 첫 대상에게, 파수꾼은 결투사로 추측 */
export function autoMove(m: MatchState, seat: number): Move {
  const hand = m.hands[seat];
  if (m.phase === 'scribe') return { type: 'keep', cardId: [...hand].sort((a, b) => b.value - a.value)[0].id };
  const agent = hand.find((c) => c.kind === 'agent');
  const card = mustPlayAgent(hand) ? agent! : [...hand].filter((c) => c.kind !== 'queen').sort((a, b) => a.value - b.value)[0] ?? hand[0];
  const self = card.kind === 'envoy';
  const options = targetsFor(m, seat, self).filter((s) => s !== seat);
  const target = options[0] ?? (self ? seat : undefined);
  return { type: 'play', cardId: card.id, target, guess: card.kind === 'watch' ? 'duelist' : undefined };
}


