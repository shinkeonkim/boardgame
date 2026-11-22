import { RuleError } from '@bg/core';
import { Cat, GameConfig, UPPER, catsFor, validateConfig } from './config';

export class MoveError extends RuleError {}

/** roll: hold[i]가 true인 주사위는 두고 나머지를 굴림 · score: 이 족보 칸에 지금 주사위로 기록 */
export type Move = { type: 'roll'; hold?: boolean[] } | { type: 'score'; cat: Cat };

export type LogEntry = { n: number; type: 'roll'; seat: number; dice: number[]; left: number } | { n: number; type: 'score'; seat: number; cat: Cat; points: number; yacht: boolean } | { n: number; type: 'end'; winners: number[] };

export type Card = Partial<Record<Cat, number>>;

export interface Seat {
  dice: number[];
  held: boolean[];
  /** 이번 차례에 굴린 횟수 (0이면 아직 안 굴림) */
  rolled: number;
  card: Card;
  /** 확장 족보: 요트를 이미 50점으로 적은 뒤 또 나온 요트 수 */
  yachtBonus: number;
}

export interface MatchState {
  config: GameConfig;
  players: number;
  round: number;
  status: 'playing' | 'round-over' | 'match-over';
  /** 한 명씩: 지금 차례 · 동시에: 대표(가장 앞 좌석) */
  turn: number;
  /** 동시에: 몇 번째 차례인지 (모두가 이 차례를 끝내면 다음) */
  step: number;
  seats: Seat[];
  /** 판별 점수 */
  roundScores: number[][];
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

const fresh = (): Seat => ({ dice: [1, 1, 1, 1, 1], held: [false, false, false, false, false], rolled: 0, card: {}, yachtBonus: 0 });

function deal(m: MatchState, first: number) {
  m.seats = Array.from({ length: m.players }, fresh);
  m.turn = first;
  m.step = 0;
  m.status = 'playing';
}

export function newMatch(c: GameConfig, players: number, rng: () => number = Math.random): MatchState {
  const errors = validateConfig(c, players);
  if (errors.length) throw new MoveError(errors[0]);
  const m = { config: c, players, round: 1, roundScores: [], winners: [], log: [], seq: 0, rng: Math.floor(rng() * 4294967296) >>> 0 } as unknown as MatchState;
  deal(m, Math.floor(nextRandom(m) * players));
  return m;
}

const counts = (dice: number[]) => {
  const k = [0, 0, 0, 0, 0, 0, 0];
  for (const d of dice) k[d]++;
  return k;
};
const sum = (dice: number[]) => dice.reduce((a, b) => a + b, 0);
const run = (dice: number[], len: number) => {
  const has = new Set(dice);
  for (let s = 1; s + len - 1 <= 6; s++) if (Array.from({ length: len }, (_, i) => s + i).every((v) => has.has(v))) return true;
  return false;
};
export const isYacht = (dice: number[]) => dice.every((d) => d === dice[0]);

/** 이 주사위로 이 칸에 적을 점수 */
export function scoreFor(c: Pick<GameConfig, 'scoring'>, cat: Cat, dice: number[]): number {
  const k = counts(dice);
  const ext = c.scoring === 'extended';
  const ui = UPPER.indexOf(cat);
  if (ui >= 0) return k[ui + 1] * (ui + 1);
  switch (cat) {
    case 'choice':
      return sum(dice);
    case 'threeKind':
      return k.some((x) => x >= 3) ? sum(dice) : 0;
    case 'fourKind':
      return k.some((x) => x >= 4) ? (ext ? sum(dice) : sum(dice)) : 0;
    case 'fullHouse': {
      const full = (k.includes(3) && k.includes(2)) || k.includes(5);
      return full ? (ext ? 25 : sum(dice)) : 0;
    }
    case 'smallStraight':
      return run(dice, 4) ? (ext ? 30 : 15) : 0;
    case 'largeStraight':
      return run(dice, 5) ? (ext ? 40 : 30) : 0;
    case 'yacht':
      return isYacht(dice) ? 50 : 0;
  }
  return 0;
}

export function upperSum(card: Card): number {
  return UPPER.reduce((a, c) => a + (card[c] ?? 0), 0);
}

/** 점수표 합계 (보너스 포함) */
export function cardTotal(c: GameConfig, s: Pick<Seat, 'card' | 'yachtBonus'>): number {
  const all = catsFor(c).reduce((a, cat) => a + (s.card[cat] ?? 0), 0);
  return all + (upperSum(s.card) >= c.bonusAt ? c.bonus : 0) + s.yachtBonus * 100;
}

export const cardFull = (c: GameConfig, s: Pick<Seat, 'card'>) => catsFor(c).every((cat) => s.card[cat] !== undefined);

export function actors(m: MatchState): number[] {
  if (m.status !== 'playing') return [];
  if (m.config.mode === 'turns') return [m.turn];
  // 동시에: 이번 차례(step)를 아직 안 끝낸 사람
  return m.seats.flatMap((s, i) => (Object.keys(s.card).length <= m.step && !cardFull(m.config, s) ? [i] : []));
}

export function applyMove(m: MatchState, seat: number, move: Move) {
  if (m.status !== 'playing') throw new MoveError('지금은 진행 중인 게임이 없어요');
  if (!actors(m).includes(seat)) throw new MoveError(m.config.mode === 'turns' ? '지금은 내 차례가 아니에요' : '이번 차례는 이미 적었어요. 다른 사람을 기다려요');
  const s = m.seats[seat];
  if (move.type === 'roll') {
    if (s.rolled >= m.config.rolls) throw new MoveError(`이번 차례에는 ${m.config.rolls}번까지 굴릴 수 있어요`);
    const hold = s.rolled === 0 ? [false, false, false, false, false] : Array.from({ length: 5 }, (_, i) => !!move.hold?.[i]);
    if (s.rolled > 0 && hold.every(Boolean)) throw new MoveError('굴릴 주사위를 하나 이상 남겨 주세요');
    s.dice = s.dice.map((d, i) => (hold[i] ? d : 1 + Math.floor(nextRandom(m) * 6)));
    s.held = hold;
    s.rolled++;
    log(m, { type: 'roll', seat, dice: [...s.dice], left: m.config.rolls - s.rolled });
    return;
  }
  if (move.type !== 'score') throw new MoveError('굴리거나 칸에 적어 주세요');
  if (s.rolled === 0) throw new MoveError('먼저 주사위를 굴려 주세요');
  if (!catsFor(m.config).includes(move.cat)) throw new MoveError('없는 칸이에요');
  if (s.card[move.cat] !== undefined) throw new MoveError('이미 적은 칸이에요');
  const yacht = isYacht(s.dice);
  // 확장 족보: 요트 칸을 50점으로 채운 뒤 또 요트면 +100
  if (m.config.scoring === 'extended' && yacht && s.card.yacht === 50) s.yachtBonus++;
  const points = scoreFor(m.config, move.cat, s.dice);
  s.card[move.cat] = points;
  log(m, { type: 'score', seat, cat: move.cat, points, yacht });
  s.rolled = 0;
  s.held = [false, false, false, false, false];
  advance(m);
}

function advance(m: MatchState) {
  const full = m.seats.every((s) => cardFull(m.config, s));
  if (full) return finish(m);
  if (m.config.mode === 'turns') {
    for (let k = 1; k <= m.players; k++) {
      const t = (m.turn + k) % m.players;
      if (!cardFull(m.config, m.seats[t])) {
        m.turn = t;
        return;
      }
    }
    return;
  }
  if (!actors(m).length) m.step++;
  m.turn = actors(m)[0] ?? 0;
}

function finish(m: MatchState) {
  const scores = m.seats.map((s) => cardTotal(m.config, s));
  m.roundScores.push(scores);
  const best = Math.max(...scores);
  const winners = scores.flatMap((x, i) => (x === best ? [i] : []));
  m.winners.push(winners[0]);
  log(m, { type: 'end', winners });
  m.status = m.round >= m.config.rounds ? 'match-over' : 'round-over';
}

export function startNextRound(m: MatchState) {
  if (m.status !== 'round-over') throw new MoveError('아직 게임이 끝나지 않았어요');
  m.round++;
  deal(m, (m.turn + 1) % m.players);
}

export function continueMatch(prev: MatchState, config: GameConfig, rng: () => number = Math.random): MatchState {
  const done = prev.roundScores.length;
  if (done >= config.rounds) throw new MoveError(`벌써 ${done}게임을 마쳤어요. 게임 수를 ${done + 1} 이상으로 늘리면 이어서 할 수 있어요`);
  const m = newMatch(config, prev.players, rng);
  m.round = done + 1;
  m.roundScores = prev.roundScores.map((r) => [...r]);
  m.winners = [...prev.winners];
  return m;
}

export function matchTotals(m: Pick<MatchState, 'roundScores' | 'players' | 'status' | 'seats' | 'config'>): number[] {
  const t = Array(m.players).fill(0);
  for (const r of m.roundScores) r.forEach((v, i) => (t[i] += v));
  if (m.status === 'playing') m.seats.forEach((s, i) => (t[i] += cardTotal(m.config, s)));
  return t;
}

/** 시간 초과·대신 진행: 안 굴렸으면 굴리고, 굴렸으면 지금 가장 점수가 높은 빈 칸 */
export function autoMove(m: MatchState, seat: number): Move {
  const s = m.seats[seat];
  if (s.rolled === 0) return { type: 'roll' };
  const open = catsFor(m.config).filter((c) => s.card[c] === undefined);
  const best = open.reduce((a, b) => (scoreFor(m.config, b, s.dice) > scoreFor(m.config, a, s.dice) ? b : a), open[0]);
  return { type: 'score', cat: best };
}
