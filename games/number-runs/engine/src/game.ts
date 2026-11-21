import { RuleError } from '@bg/core';
import { GameConfig, validateConfig } from './config';
import { Tile, analyze, arrange, isJoker, setValue } from './sets';

export class MoveError extends RuleError {}

/** play: 새 테이블 전체(묶음마다 타일 id)를 낸다 · draw: 1장 가져오고 차례 끝 */
export type Move = { type: 'play'; table: string[][] } | { type: 'draw' };

export type LogEntry =
  | { n: number; type: 'play'; seat: number; count: number; first: boolean; sets: number }
  | { n: number; type: 'draw'; seat: number; empty: boolean }
  | { n: number; type: 'win'; seat: number; reason: 'out' | 'blocked' };

export interface MatchState {
  config: GameConfig;
  players: number;
  round: number;
  status: 'playing' | 'round-over' | 'match-over';
  turn: number;
  pool: Tile[];
  hands: Tile[][];
  table: Tile[][];
  /** 처음 등록을 마쳤는지 */
  opened: boolean[];
  /** 아무도 못 내고 더미가 빈 채로 연속 넘긴 수 (모두 넘기면 끝) */
  passes: number;
  /** 판별 점수 */
  roundScores: number[][];
  lastPlayed: string[];
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

export const sortHand = (h: Tile[]) => h.sort((a, b) => (isJoker(a) ? 1 : 0) - (isJoker(b) ? 1 : 0) || a.color - b.color || a.n - b.n);

function deal(m: MatchState, first: number) {
  const c = m.config;
  const tiles: Tile[] = [];
  for (let k = 0; k < c.copies; k++) for (let col = 0; col < c.colors; col++) for (let n = 1; n <= c.maxNumber; n++) tiles.push({ id: `${col}-${n}-${k}`, n, color: col });
  for (let j = 0; j < c.jokers; j++) tiles.push({ id: `J${j}`, n: 0, color: -1 });
  for (let i = tiles.length - 1; i > 0; i--) {
    const k = Math.floor(nextRandom(m) * (i + 1));
    [tiles[i], tiles[k]] = [tiles[k], tiles[i]];
  }
  m.hands = Array.from({ length: m.players }, () => sortHand(tiles.splice(0, c.handSize)));
  m.pool = tiles;
  m.table = [];
  m.opened = Array(m.players).fill(c.initialMeld === 0);
  m.passes = 0;
  m.lastPlayed = [];
  m.turn = first;
  m.status = 'playing';
}

export function newMatch(c: GameConfig, players: number, rng: () => number = Math.random): MatchState {
  const errors = validateConfig(c, players);
  if (errors.length) throw new MoveError(errors[0]);
  const m = { config: c, players, round: 1, roundScores: [], winners: [], log: [], seq: 0, rng: Math.floor(rng() * 4294967296) >>> 0 } as unknown as MatchState;
  deal(m, Math.floor(nextRandom(m) * players));
  return m;
}

export function actors(m: MatchState): number[] {
  return m.status === 'playing' ? [m.turn] : [];
}

const key = (set: Tile[]) =>
  set
    .map((t) => t.id)
    .sort()
    .join(',');

/** 새 테이블이 왜 안 되는지 (되면 null) — 화면도 미리 써요 */
export function tableProblem(m: Pick<MatchState, 'table' | 'hands' | 'opened' | 'config'>, seat: number, next: Tile[][]): string | null {
  const c = m.config;
  const oldIds = new Set(m.table.flat().map((t) => t.id));
  const handIds = new Set(m.hands[seat].map((t) => t.id));
  const used = new Set<string>();
  for (const set of next)
    for (const t of set) {
      if (used.has(t.id)) return '같은 타일을 두 번 쓸 수 없어요';
      used.add(t.id);
      if (!oldIds.has(t.id) && !handIds.has(t.id)) return '없는 타일이에요';
    }
  for (const id of oldIds) if (!used.has(id)) return '테이블에 있던 타일은 모두 테이블에 남아야 해요';
  const fromHand = [...used].filter((id) => handIds.has(id));
  if (!fromHand.length) return '손에서 타일을 1장 이상 내야 해요 (못 내면 「1장 가져오기」)';
  for (const set of next) if (!analyze(set, c.maxNumber, c.colors)) return '묶음이 맞지 않아요: 같은 색 연속 3장 이상, 또는 같은 숫자 다른 색 3~4장';
  if (!m.opened[seat]) {
    // 처음 등록: 테이블 묶음은 그대로 두고, 손 타일로만 만든 새 묶음 합이 기준 이상
    const oldKeys = new Set(m.table.map(key));
    const nextKeys = new Set(next.map(key));
    for (const k of oldKeys) if (!nextKeys.has(k)) return `처음 등록 전에는 테이블의 묶음을 바꿀 수 없어요`;
    const fresh = next.filter((s) => !oldKeys.has(key(s)));
    if (fresh.some((s) => s.some((t) => oldIds.has(t.id)))) return '처음 등록은 내 손의 타일로만 해요';
    const sum = fresh.reduce((a, s) => a + setValue(s, c.maxNumber, c.colors), 0);
    if (sum < c.initialMeld) return `처음 등록은 합이 ${c.initialMeld} 이상이어야 해요 (지금 ${sum})`;
  }
  return null;
}

export function applyMove(m: MatchState, seat: number, move: Move) {
  if (m.status !== 'playing') throw new MoveError('지금은 진행 중인 판이 없어요');
  if (seat !== m.turn) throw new MoveError('지금은 내 차례가 아니에요');
  if (move.type === 'draw') {
    const t = m.pool.pop();
    if (t) {
      m.hands[seat].push(t);
      sortHand(m.hands[seat]);
      m.passes = 0;
    } else m.passes++;
    log(m, { type: 'draw', seat, empty: !t });
    if (!t && m.passes >= m.players) return blocked(m);
    return nextTurn(m);
  }
  if (move.type !== 'play' || !Array.isArray(move.table)) throw new MoveError('테이블을 정리해 내 주세요');
  const byId = new Map([...m.table.flat(), ...m.hands[seat]].map((t) => [t.id, t]));
  const next: Tile[][] = move.table.map((set) => (Array.isArray(set) ? set.map((id) => byId.get(String(id))) : [])).filter((s) => s.length) as Tile[][];
  if (next.some((s) => s.some((t) => !t))) throw new MoveError('없는 타일이에요');
  const arranged = next.map((s) => arrange(s, m.config.maxNumber, m.config.colors));
  const problem = tableProblem(m, seat, arranged);
  if (problem) throw new MoveError(problem);
  const handIds = new Set(m.hands[seat].map((t) => t.id));
  const played = arranged.flat().filter((t) => handIds.has(t.id)).map((t) => t.id);
  const first = !m.opened[seat];
  m.table = arranged;
  m.hands[seat] = m.hands[seat].filter((t) => !played.includes(t.id));
  m.opened[seat] = true;
  m.passes = 0;
  m.lastPlayed = played;
  log(m, { type: 'play', seat, count: played.length, first, sets: arranged.length });
  if (!m.hands[seat].length) return win(m, seat, 'out');
  nextTurn(m);
}

function nextTurn(m: MatchState) {
  m.turn = (m.turn + 1) % m.players;
}

export const tilePoints = (t: Tile) => (isJoker(t) ? 30 : t.n);
export const handPoints = (h: Tile[]) => h.reduce((a, t) => a + tilePoints(t), 0);

function win(m: MatchState, seat: number, reason: 'out' | 'blocked') {
  // 진 사람: 남은 타일 합만큼 −, 이긴 사람: 다른 사람들 남은 합 − 내 남은 합 (다 냈으면 0)
  const pts = m.hands.map(handPoints);
  const scores = pts.map((p, i) => (i === seat ? pts.reduce((a, q, j) => (j === seat ? a : a + q), 0) - p : -p));
  m.roundScores.push(scores);
  m.winners.push(seat);
  log(m, { type: 'win', seat, reason });
  m.status = m.round >= m.config.rounds ? 'match-over' : 'round-over';
}

/** 더미가 비고 아무도 못 내면: 남은 타일 합이 가장 적은 사람 승 */
function blocked(m: MatchState) {
  const pts = m.hands.map(handPoints);
  const best = Math.min(...pts);
  win(m, pts.indexOf(best), 'blocked');
}

export function startNextRound(m: MatchState) {
  if (m.status !== 'round-over') throw new MoveError('아직 판이 끝나지 않았어요');
  m.round++;
  deal(m, m.winners[m.winners.length - 1] ?? 0);
}

export function continueMatch(prev: MatchState, config: GameConfig, rng: () => number = Math.random): MatchState {
  const done = prev.roundScores.length;
  if (done >= config.rounds) throw new MoveError(`벌써 ${done}판을 마쳤어요. 판 수를 ${done + 1}판 이상으로 늘리면 이어서 할 수 있어요`);
  const m = newMatch(config, prev.players, rng);
  m.round = done + 1;
  m.roundScores = prev.roundScores.map((r) => [...r]);
  m.winners = [...prev.winners];
  return m;
}

export function matchTotals(m: Pick<MatchState, 'roundScores' | 'players'>): number[] {
  const t = Array(m.players).fill(0);
  for (const r of m.roundScores) r.forEach((v, i) => (t[i] += v));
  return t;
}

/** 시간 초과·대신 진행: 1장 가져오기 */
export function autoMove(_m: MatchState, _seat: number): Move {
  return { type: 'draw' };
}
