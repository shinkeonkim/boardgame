import { RuleError } from '@bg/core';
import { GameConfig } from './config';

export class MoveError extends RuleError {}

/** 숫자 뒤 조사: 2·4·5(받침 없음)는 가/면, 나머지는 이/이면 */
const vowelEnd = (n: number) => [2, 4, 5, 9].includes(n % 10);
export const ga = (n: number) => `${n}${vowelEnd(n) ? '가' : '이'}`;
export const myeon = (n: number) => `${n}${vowelEnd(n) ? '면' : '이면'}`;

export interface Bid {
  seat: number;
  count: number;
  face: number;
}

export type Move = { type: 'bid'; count: number; face: number } | { type: 'challenge' } | { type: 'exact' } | { type: 'roll' };

export interface Reveal {
  kind: 'challenge' | 'exact';
  caller: number;
  bid: Bid;
  /** 실제 개수 (와일드 포함) */
  actual: number;
  /** 주사위를 잃은 사람과 개수 (딱 맞다 성공이면 caller가 +1) */
  loser: number;
  lost: number;
  gained: boolean;
  /** 공개된 주사위 */
  dice: number[][];
  wild: boolean;
}

export type LogEntry =
  | { n: number; type: 'bid'; seat: number; count: number; face: number }
  | { n: number; type: 'call'; seat: number; kind: 'challenge' | 'exact' }
  | { n: number; type: 'out'; seat: number }
  | { n: number; type: 'win'; seat: number };

export interface MatchState {
  config: GameConfig;
  players: number;
  /** 게임 번호 (1부터) */
  round: number;
  status: 'playing' | 'round-over' | 'match-over';
  /** bid = 거는 중, reveal = 공개 결과를 보고 다음 판 주사위를 굴릴 때 */
  phase: 'bid' | 'reveal';
  /** 좌석별 주사위 개수 */
  counts: number[];
  dice: number[][];
  turn: number;
  bids: Bid[];
  /** 이번 판이 팔리피코(숫자 고정·와일드 없음)인지 */
  palifico: boolean;
  /** 팔리피코를 이미 겪은 좌석 */
  palificoUsed: boolean[];
  reveal: Reveal | null;
  /** 판 번호 (같은 게임 안에서 몇 번째 굴림) */
  hand: number;
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
  if (m.log.length > 60) m.log.shift();
}

function roll(m: MatchState) {
  m.dice = m.counts.map((n) => Array.from({ length: n }, () => 1 + Math.floor(nextRandom(m) * m.config.faces)).sort((a, b) => a - b));
  m.bids = [];
  m.reveal = null;
  m.phase = 'bid';
  m.hand++;
}

function startGame(m: MatchState, first: number) {
  m.counts = Array(m.players).fill(m.config.dice);
  m.palificoUsed = Array(m.players).fill(false);
  m.palifico = false;
  m.turn = first;
  m.hand = 0;
  m.status = 'playing';
  roll(m);
}

export function newMatch(c: GameConfig, players: number, rng: () => number = Math.random): MatchState {
  const m = { config: c, players, round: 1, winners: [], log: [], seq: 0, rng: Math.floor(rng() * 4294967296) >>> 0 } as unknown as MatchState;
  startGame(m, Math.floor(nextRandom(m) * players));
  return m;
}

export const alive = (m: Pick<MatchState, 'counts'>) => m.counts.flatMap((n, i) => (n > 0 ? [i] : []));
export const totalDice = (m: Pick<MatchState, 'counts'>) => m.counts.reduce((a, b) => a + b, 0);
const nextAlive = (m: MatchState, seat: number) => {
  for (let k = 1; k <= m.players; k++) {
    const s = (seat + k) % m.players;
    if (m.counts[s] > 0) return s;
  }
  return seat;
};

/** 이번 판에서 1이 와일드인지 */
export const wildNow = (m: Pick<MatchState, 'config' | 'palifico'>) => m.config.wildOnes && !m.palifico;

/** 그 숫자가 실제로 몇 개인지 */
export function countFace(m: Pick<MatchState, 'config' | 'palifico' | 'dice'>, face: number): number {
  const wild = wildNow(m) && face !== 1;
  return m.dice.flat().filter((d) => d === face || (wild && d === 1)).length;
}

/** 지금 걸 수 있는 가장 낮은 개수 (face 기준). null이면 그 숫자는 못 검 */
export function minCount(m: Pick<MatchState, 'config' | 'palifico' | 'bids' | 'counts'>, face: number): number | null {
  const c = m.config;
  if (face < 1 || face > c.faces) return null;
  const prev = m.bids[m.bids.length - 1];
  const onesAllowed = c.aceBids || !c.wildOnes || m.palifico;
  if (face === 1 && !onesAllowed) return null;
  if (!prev) {
    // 첫 호가: 1부터 (페루 규칙에서도 첫 호가로 1은 팔리피코가 아니면 못 검)
    if (face === 1 && c.aceBids && !m.palifico) return null;
    return 1;
  }
  if (m.palifico && face !== prev.face) return null; // 팔리피코: 숫자 고정
  if (c.aceBids && !m.palifico) {
    if (face === 1 && prev.face !== 1) return Math.ceil(prev.count / 2);
    if (face !== 1 && prev.face === 1) return prev.count * 2 + 1;
    if (face === 1 && prev.face === 1) return prev.count + 1;
  }
  return face > prev.face ? prev.count : prev.count + 1;
}

export function bidProblem(m: MatchState, count: number, face: number): string | null {
  const min = minCount(m, face);
  if (min === null) {
    if (m.palifico && m.bids.length) return `팔리피코 판이라 숫자 ${m.bids[0].face}에만 걸 수 있어요`;
    if (face === 1) return m.config.aceBids ? '첫 호가는 1에 걸 수 없어요' : '1은 와일드라 따로 걸 수 없어요';
    return '그 숫자에는 걸 수 없어요';
  }
  if (!Number.isInteger(count) || count < min) return `${myeon(face)} ${min}개 이상 불러야 해요`;
  if (count > totalDice(m)) return `주사위가 모두 ${totalDice(m)}개뿐이에요`;
  return null;
}

export function actors(m: MatchState): number[] {
  if (m.status !== 'playing') return [];
  return [m.turn];
}

export function applyMove(m: MatchState, seat: number, move: Move) {
  if (m.status !== 'playing') throw new MoveError('지금은 진행 중인 판이 없어요');
  if (seat !== m.turn) throw new MoveError('지금은 내 차례가 아니에요');
  if (m.phase === 'reveal') {
    if (move.type !== 'roll') throw new MoveError('주사위를 다시 굴려 다음 판을 시작해 주세요');
    roll(m);
    return;
  }
  if (move.type === 'bid') {
    const p = bidProblem(m, move.count, move.face);
    if (p) throw new MoveError(p);
    m.bids.push({ seat, count: move.count, face: move.face });
    log(m, { type: 'bid', seat, count: move.count, face: move.face });
    m.turn = nextAlive(m, seat);
    return;
  }
  if (move.type === 'challenge' || move.type === 'exact') {
    const bid = m.bids[m.bids.length - 1];
    if (!bid) throw new MoveError('아직 아무도 걸지 않았어요. 먼저 걸어 주세요');
    if (move.type === 'exact' && !m.config.exactCall) throw new MoveError('「딱 맞다」는 이 방에서 쓰지 않아요');
    log(m, { type: 'call', seat, kind: move.type });
    const actual = countFace(m, bid.face);
    let loser: number;
    let lost = 1;
    let gained = false;
    if (move.type === 'challenge') {
      loser = actual >= bid.count ? seat : bid.seat;
      if (m.config.penalty === 'diff') lost = Math.max(1, Math.abs(actual - bid.count) + (actual >= bid.count ? 0 : 0));
    } else if (actual === bid.count) {
      loser = seat;
      lost = 0;
      gained = true;
    } else {
      loser = seat;
      if (m.config.penalty === 'diff') lost = Math.abs(actual - bid.count);
    }
    m.reveal = { kind: move.type, caller: seat, bid, actual, loser, lost, gained, dice: m.dice.map((d) => [...d]), wild: wildNow(m) && bid.face !== 1 };
    if (gained) m.counts[seat] = Math.min(m.config.maxDice, m.counts[seat] + 1);
    m.counts[loser] = Math.max(0, m.counts[loser] - lost);
    m.phase = 'reveal';
    m.palifico = false;
    if (m.counts[loser] === 0) log(m, { type: 'out', seat: loser });
    const left = alive(m);
    if (left.length === 1) {
      m.winners.push(left[0]);
      log(m, { type: 'win', seat: left[0] });
      m.status = m.round >= m.config.rounds || m.winners.filter((w) => w === left[0]).length > m.config.rounds / 2 ? 'match-over' : 'round-over';
      return;
    }
    // 다음 판은 진 사람(탈락했으면 다음 사람)이 시작
    m.turn = m.counts[loser] > 0 ? loser : nextAlive(m, loser);
    if (m.config.palifico && m.counts[m.turn] === 1 && !m.palificoUsed[m.turn] && left.length > 2) {
      m.palifico = true;
      m.palificoUsed[m.turn] = true;
    }
    return;
  }
  throw new MoveError('할 수 없는 동작이에요');
}

export function startNextRound(m: MatchState) {
  if (m.status !== 'round-over') throw new MoveError('아직 게임이 끝나지 않았어요');
  m.round++;
  // 지난 게임 우승자가 먼저
  startGame(m, m.winners[m.winners.length - 1] ?? 0);
}

export function continueMatch(prev: MatchState, config: GameConfig, rng: () => number = Math.random): MatchState {
  const done = prev.winners.length;
  if (done >= config.rounds) throw new MoveError(`벌써 ${done}게임을 마쳤어요. 판 수를 ${done + 1} 이상으로 늘리면 이어서 할 수 있어요`);
  const m = newMatch(config, prev.players, rng);
  m.round = done + 1;
  m.winners = [...prev.winners];
  return m;
}

/** 좌석별: 이긴 게임 수 (동점 순위는 남은 주사위로 보지 않음) */
export function matchTotals(m: Pick<MatchState, 'winners' | 'players'>): number[] {
  return Array.from({ length: m.players }, (_, s) => m.winners.filter((w) => w === s).length);
}

/** 시간 초과·대신 진행: 공개 후면 굴리기, 아니면 가장 낮은 호가 → 못 하면 거짓말 */
export function autoMove(m: MatchState, _seat: number): Move {
  if (m.phase === 'reveal') return { type: 'roll' };
  const prev = m.bids[m.bids.length - 1];
  const faces = m.palifico && prev ? [prev.face] : Array.from({ length: m.config.faces }, (_, i) => i + 1);
  let best: Move | null = null;
  for (const face of faces) {
    const min = minCount(m, face);
    if (min === null || min > totalDice(m)) continue;
    if (!best || (best.type === 'bid' && min < best.count)) best = { type: 'bid', count: min, face };
  }
  if (prev && (!best || (best.type === 'bid' && best.count > totalDice(m) / 2))) return { type: 'challenge' };
  return best ?? { type: 'challenge' };
}
