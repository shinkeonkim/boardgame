import { RuleError } from '@bg/core';
import { GameConfig } from './config';

export class MoveError extends RuleError {}

export type Disc = 'rose' | 'thorn';

export type Move =
  | { type: 'place'; disc: Disc }
  | { type: 'bid'; count: number }
  | { type: 'pass' }
  | { type: 'flip'; seat: number }
  | { type: 'lose'; disc: Disc };

export type LogEntry =
  | { n: number; type: 'bid'; seat: number; count: number }
  | { n: number; type: 'pass'; seat: number }
  | { n: number; type: 'flip'; seat: number; from: number; disc: Disc }
  | { n: number; type: 'success'; seat: number; points: number }
  | { n: number; type: 'fail'; seat: number; owner: number; lost: Disc | null }
  | { n: number; type: 'out'; seat: number }
  | { n: number; type: 'win'; seat: number; why: 'points' | 'last' };

export interface MatchState {
  config: GameConfig;
  players: number;
  round: number;
  status: 'playing' | 'round-over' | 'match-over';
  /**
   * open: 모두 동시에 첫 원판을 놓음
   * turn: 차례인 사람이 원판을 더 놓거나 도전(입찰) 시작
   * bidding: 차례대로 더 높게 부르거나 포기
   * flip: 도전자가 뒤집기 (자기 것부터 자동, 그다음 남의 맨 위를 하나씩 고름)
   * lose: 자기 가시에 걸린 도전자가 잃을 원판을 고름
   */
  phase: 'open' | 'turn' | 'bidding' | 'flip' | 'lose';
  turn: number;
  /** 손에 남은 원판 (아직 놓지 않은 것) */
  hands: Disc[][];
  /** 내 앞에 쌓은 원판 (아래 → 위) */
  mats: Disc[][];
  /** 뒤집어 공개된 개수 (위에서부터) */
  flipped: number[];
  /** 가진 원판 전체 (잃으면 줄어듦) */
  owned: Disc[][];
  points: number[];
  bid: { seat: number; count: number } | null;
  passed: number[];
  /** 이번 도전에서 뒤집은 장미 수 */
  roses: number;
  winners: number[];
  outOrder: number[];
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

const full = (c: GameConfig): Disc[] => [...Array(c.roses).fill('rose'), ...Array(c.thorns).fill('thorn')];

export const isOut = (m: Pick<MatchState, 'owned'>, s: number) => m.owned[s].length === 0;
export const alive = (m: Pick<MatchState, 'owned' | 'players'>) => Array.from({ length: m.players }, (_, i) => i).filter((s) => !isOut(m, s));
export const totalOnMats = (m: Pick<MatchState, 'mats'>) => m.mats.reduce((a, x) => a + x.length, 0);

function newRound(m: MatchState, starter: number) {
  m.hands = m.owned.map((o) => [...o]);
  m.mats = m.owned.map(() => []);
  m.flipped = m.owned.map(() => 0);
  m.bid = null;
  m.passed = [];
  m.roses = 0;
  m.turn = starter;
  m.phase = 'open';
}

function startGame(m: MatchState, first: number) {
  m.owned = Array.from({ length: m.players }, () => full(m.config));
  m.points = Array(m.players).fill(0);
  m.outOrder = [];
  m.status = 'playing';
  newRound(m, first);
}

export function newMatch(c: GameConfig, players: number, rng: () => number = Math.random): MatchState {
  const m = { config: c, players, round: 1, winners: [], log: [], seq: 0, rng: Math.floor(rng() * 4294967296) >>> 0 } as unknown as MatchState;
  startGame(m, Math.floor(nextRandom(m) * players));
  return m;
}

const nextAlive = (m: MatchState, s: number) => {
  for (let k = 1; k <= m.players; k++) {
    const x = (s + k) % m.players;
    if (!isOut(m, x)) return x;
  }
  return s;
};

export function actors(m: MatchState): number[] {
  if (m.status !== 'playing') return [];
  if (m.phase === 'open') return alive(m).filter((s) => m.mats[s].length === 0);
  return [m.turn];
}

const remove = (arr: Disc[], d: Disc) => {
  const i = arr.indexOf(d);
  if (i >= 0) arr.splice(i, 1);
};

export function applyMove(m: MatchState, seat: number, move: Move) {
  if (m.status !== 'playing') throw new MoveError('지금은 진행 중인 판이 없어요');
  if (!actors(m).includes(seat)) throw new MoveError(m.phase === 'open' ? '이미 첫 원판을 놓았어요' : '지금은 내 차례가 아니에요');
  switch (m.phase) {
    case 'open':
    case 'turn': {
      if (move.type === 'place') {
        if (!m.hands[seat].includes(move.disc)) throw new MoveError(move.disc === 'thorn' ? '놓을 가시가 없어요' : '놓을 장미가 없어요');
        remove(m.hands[seat], move.disc);
        m.mats[seat].push(move.disc);
        if (m.phase === 'open') {
          if (actors(m).length === 0) m.phase = 'turn';
          return;
        }
        m.turn = nextAlive(m, seat);
        return;
      }
      if (move.type === 'bid') {
        if (m.phase === 'open') throw new MoveError('먼저 모두 첫 원판을 놓아야 해요');
        return startBid(m, seat, move.count);
      }
      throw new MoveError('원판을 놓거나 도전을 시작해 주세요');
    }
    case 'bidding': {
      if (move.type === 'pass') {
        m.passed.push(seat);
        log(m, { type: 'pass', seat });
      } else if (move.type === 'bid') {
        const total = totalOnMats(m);
        if (!Number.isInteger(move.count) || move.count <= m.bid!.count) throw new MoveError(`${m.bid!.count + 1}개 이상 불러야 해요`);
        if (move.count > total) throw new MoveError(`원판이 모두 ${total}개예요`);
        m.bid = { seat, count: move.count };
        log(m, { type: 'bid', seat, count: move.count });
        if (move.count === total) return beginFlip(m);
      } else throw new MoveError('더 높게 부르거나 포기해 주세요');
      const left = alive(m).filter((s) => !m.passed.includes(s));
      if (left.length === 1) return beginFlip(m);
      let n = nextAlive(m, seat);
      while (m.passed.includes(n)) n = nextAlive(m, n);
      m.turn = n;
      return;
    }
    case 'flip': {
      if (move.type !== 'flip') throw new MoveError('뒤집을 사람의 원판을 골라 주세요');
      const t = move.seat;
      if (t === seat) throw new MoveError('내 원판은 이미 모두 뒤집었어요');
      if (!Number.isInteger(t) || t < 0 || t >= m.players || m.flipped[t] >= m.mats[t].length) throw new MoveError('뒤집을 원판이 없는 자리예요');
      return flipOne(m, seat, t);
    }
    case 'lose': {
      if (move.type !== 'lose') throw new MoveError('잃을 원판을 골라 주세요');
      if (!m.owned[seat].includes(move.disc)) throw new MoveError('그 원판은 없어요');
      return applyLoss(m, seat, seat, move.disc);
    }
  }
}

function startBid(m: MatchState, seat: number, count: number) {
  const total = totalOnMats(m);
  if (!Number.isInteger(count) || count < 1) throw new MoveError('1개 이상 불러야 해요');
  if (count > total) throw new MoveError(`원판이 모두 ${total}개예요`);
  m.bid = { seat, count };
  m.passed = [];
  log(m, { type: 'bid', seat, count });
  if (count === total || alive(m).length === 1) return beginFlip(m);
  m.phase = 'bidding';
  m.turn = nextAlive(m, seat);
}

function beginFlip(m: MatchState) {
  const s = m.bid!.seat;
  m.turn = s;
  m.phase = 'flip';
  m.roses = 0;
  // 자기 원판부터 위에서 아래로 모두
  const mine = m.mats[s];
  for (let i = mine.length - 1; i >= 0; i--) {
    m.flipped[s]++;
    const d = mine[i];
    log(m, { type: 'flip', seat: s, from: s, disc: d });
    if (d === 'thorn') return fail(m, s, s);
    m.roses++;
    if (m.roses >= m.bid!.count) return succeed(m, s);
  }
}

function flipOne(m: MatchState, s: number, t: number) {
  const mat = m.mats[t];
  const d = mat[mat.length - 1 - m.flipped[t]];
  m.flipped[t]++;
  log(m, { type: 'flip', seat: s, from: t, disc: d });
  if (d === 'thorn') return fail(m, s, t);
  m.roses++;
  if (m.roses >= m.bid!.count) succeed(m, s);
}

function succeed(m: MatchState, s: number) {
  m.points[s]++;
  log(m, { type: 'success', seat: s, points: m.points[s] });
  if (m.points[s] >= m.config.winPoints) return win(m, s, 'points');
  newRound(m, s);
}

function fail(m: MatchState, s: number, owner: number) {
  if (owner === s && m.config.chooseOwnLoss && new Set(m.owned[s]).size > 1) {
    m.phase = 'lose';
    m.turn = s;
    return;
  }
  // 무작위로 하나 (설정에 따라 자기 가시면 무작위, 남의 가시면 원작대로 무작위)
  const pick = m.owned[s][Math.floor(nextRandom(m) * m.owned[s].length)];
  applyLoss(m, s, owner, pick);
}

function applyLoss(m: MatchState, s: number, owner: number, disc: Disc) {
  remove(m.owned[s], disc);
  log(m, { type: 'fail', seat: s, owner, lost: disc });
  if (isOut(m, s)) {
    m.outOrder.push(s);
    log(m, { type: 'out', seat: s });
  }
  const left = alive(m);
  if (left.length === 1) return win(m, left[0], 'last');
  // 다음 판: 도전자가 시작 (탈락했으면 가시 주인, 그도 아니면 다음 사람)
  const starter = !isOut(m, s) ? s : !isOut(m, owner) ? owner : nextAlive(m, s);
  newRound(m, starter);
}

function win(m: MatchState, s: number, why: 'points' | 'last') {
  m.winners.push(s);
  log(m, { type: 'win', seat: s, why });
  m.status = m.round >= m.config.rounds || m.winners.filter((w) => w === s).length > m.config.rounds / 2 ? 'match-over' : 'round-over';
}

export function startNextRound(m: MatchState) {
  if (m.status !== 'round-over') throw new MoveError('아직 게임이 끝나지 않았어요');
  m.round++;
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

export function matchTotals(m: Pick<MatchState, 'winners' | 'players'>): number[] {
  return Array.from({ length: m.players }, (_, s) => m.winners.filter((w) => w === s).length);
}

/** 시간 초과·대신 진행 */
export function autoMove(m: MatchState, seat: number): Move {
  switch (m.phase) {
    case 'open':
    case 'turn':
      if (m.hands[seat].includes('rose')) return { type: 'place', disc: 'rose' };
      if (m.hands[seat].length) return { type: 'place', disc: m.hands[seat][0] };
      return { type: 'bid', count: 1 };
    case 'bidding':
      return { type: 'pass' };
    case 'flip': {
      const t = Array.from({ length: m.players }, (_, i) => i).find((i) => i !== seat && m.flipped[i] < m.mats[i].length)!;
      return { type: 'flip', seat: t };
    }
    case 'lose':
      return { type: 'lose', disc: m.owned[seat].includes('rose') ? 'rose' : 'thorn' };
  }
}
