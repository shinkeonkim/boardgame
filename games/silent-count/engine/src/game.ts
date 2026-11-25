import { RuleError } from '@bg/core';
import { GameConfig, levelsFor, livesFor, validateConfig } from './config';

export class MoveError extends RuleError {}

/**
 * 실시간 협력: 누구든 아무 때나 내 가장 낮은 카드를 냄. 모두의 카드가 작은 순서로 나와야 함.
 * 어긋나면(누가 더 작은 카드를 쥔 채로 큰 카드가 나오면) 생명 하나를 잃고, 그보다 작은 카드는 모두 버림.
 * wait: 봇이 「아직은 기다림」을 고를 때 쓰는 빈 수 (상태가 바뀌지 않음)
 */
export type Move = { type: 'play' } | { type: 'star'; on: boolean } | { type: 'wait' };

export type LogEntry =
  | { n: number; type: 'level'; level: number; cards: number }
  | { n: number; type: 'play'; seat: number; card: number }
  | { n: number; type: 'miss'; seat: number; card: number; lost: { seat: number; card: number }[] }
  | { n: number; type: 'star'; discarded: { seat: number; card: number }[] }
  | { n: number; type: 'clear'; level: number; reward: 'life' | 'star' | null }
  | { n: number; type: 'end'; won: boolean; level: number };

export interface MatchState {
  config: GameConfig;
  players: number;
  /** 지금 단계 (1부터) */
  round: number;
  status: 'playing' | 'round-over' | 'match-over';
  hands: number[][];
  /** 이번 단계에 나온 카드 (나온 순서) */
  pile: number[];
  lives: number;
  stars: number;
  /** 수리검을 쓰자는 사람 */
  starVotes: boolean[];
  /** 마지막으로 카드가 나온(또는 단계가 시작된) 시각 — 봇이 「얼마나 기다렸나」를 셈 */
  lastAt: number;
  cleared: number;
  won: boolean;
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

function deal(m: MatchState) {
  const deck = Array.from({ length: 100 }, (_, i) => i + 1);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(nextRandom(m) * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  m.hands = Array.from({ length: m.players }, (_, s) => deck.slice(s * m.round, (s + 1) * m.round).sort((a, b) => a - b));
  m.pile = [];
  m.starVotes = Array(m.players).fill(false);
  m.lastAt = Date.now();
  m.status = 'playing';
  log(m, { type: 'level', level: m.round, cards: m.round });
}

export function newMatch(c: GameConfig, players: number, rng: () => number = Math.random): MatchState {
  const errors = validateConfig(c, players);
  if (errors.length) throw new MoveError(errors[0]);
  const m = { config: c, players, round: 1, lives: livesFor(c, players), stars: c.stars, cleared: 0, won: false, log: [], seq: 0, rng: Math.floor(rng() * 4294967296) >>> 0 } as unknown as MatchState;
  deal(m);
  return m;
}

/** 카드를 쥔 사람 모두가 언제든 둘 수 있음 */
export function actors(m: MatchState): number[] {
  if (m.status !== 'playing') return [];
  return m.hands.flatMap((h, i) => (h.length ? [i] : []));
}

const REWARDS: Record<number, 'life' | 'star'> = { 2: 'star', 3: 'life', 5: 'star', 6: 'life', 8: 'star', 9: 'life' };

function afterChange(m: MatchState) {
  if (m.lives <= 0) {
    m.won = false;
    log(m, { type: 'end', won: false, level: m.round });
    m.status = 'match-over';
    return;
  }
  if (m.hands.every((h) => h.length === 0)) {
    m.cleared = m.round;
    const reward = m.config.rewards ? (REWARDS[m.round] ?? null) : null;
    if (reward === 'life') m.lives = Math.min(5, m.lives + 1);
    if (reward === 'star') m.stars = Math.min(3, m.stars + 1);
    log(m, { type: 'clear', level: m.round, reward });
    if (m.round >= levelsFor(m.config, m.players)) {
      m.won = true;
      log(m, { type: 'end', won: true, level: m.round });
      m.status = 'match-over';
    } else m.status = 'round-over';
  }
}

export function applyMove(m: MatchState, seat: number, move: Move) {
  if (move.type === 'wait') return;
  if (m.status !== 'playing') throw new MoveError('지금은 진행 중인 단계가 없어요');
  if (move.type === 'star') {
    if (m.stars <= 0) throw new MoveError('남은 수리검이 없어요');
    m.starVotes[seat] = !!move.on;
    // 카드를 쥔 사람이 모두 동의하면: 각자 가장 낮은 카드 한 장씩 버림
    const holders = m.hands.flatMap((h, i) => (h.length ? [i] : []));
    if (holders.length && holders.every((s) => m.starVotes[s])) {
      m.stars--;
      const discarded = holders.map((s) => ({ seat: s, card: m.hands[s].shift()! }));
      m.pile.push(...discarded.map((d) => d.card).sort((a, b) => a - b));
      m.starVotes = Array(m.players).fill(false);
      m.lastAt = Date.now();
      log(m, { type: 'star', discarded });
      afterChange(m);
    }
    return;
  }
  if (move.type !== 'play') throw new MoveError('할 수 없는 동작이에요');
  const hand = m.hands[seat];
  if (!hand.length) throw new MoveError('낼 카드가 없어요');
  const card = hand.shift()!;
  m.pile.push(card);
  m.lastAt = Date.now();
  m.starVotes = Array(m.players).fill(false);
  // 더 작은 카드를 쥔 사람이 있으면 실수: 생명 -1, 그 카드들은 모두 버림
  const lost: { seat: number; card: number }[] = [];
  m.hands.forEach((h, s) => {
    while (h.length && h[0] < card) lost.push({ seat: s, card: h.shift()! });
  });
  if (lost.length) {
    m.lives--;
    log(m, { type: 'miss', seat, card, lost });
  } else log(m, { type: 'play', seat, card });
  afterChange(m);
}

export function startNextRound(m: MatchState) {
  if (m.status !== 'round-over') throw new MoveError('아직 단계가 끝나지 않았어요');
  m.round++;
  deal(m);
}

export function continueMatch(prev: MatchState, config: GameConfig, rng: () => number = Math.random): MatchState {
  return newMatch(config, prev.players, rng);
}

/** 협력: 모두 같은 점수 = 깬 단계 */
export function matchTotals(m: Pick<MatchState, 'cleared' | 'players'>): number[] {
  return Array(m.players).fill(m.cleared);
}

/** 대신 진행(끊긴 사람): 그냥 기다림 — 실시간 게임이라 남이 대신 내 주면 오히려 망침 */
export function autoMove(): Move {
  return { type: 'wait' };
}
