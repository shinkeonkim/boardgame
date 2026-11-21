import { RuleError } from '@bg/core';
import { GameConfig, factoriesFor, validateConfig, wallCol } from './config';

export class MoveError extends RuleError {}

/** -1 = 첫 플레이어 표시 (바닥에만) */
export type Tile = number;
export const FIRST = -1;

export type Move =
  | { type: 'take'; source: number; color: number; line: number }
  | { type: 'wall'; row: number; col: number };

export interface Board {
  /** 줄 i는 i+1칸 */
  lines: { color: number | null; count: number }[];
  /** 벽: 색 또는 null */
  wall: (number | null)[][];
  floor: Tile[];
  score: number;
}

export interface WallLog {
  seat: number;
  row: number;
  col: number;
  color: number;
  points: number;
}

export type LogEntry =
  | { n: number; type: 'take'; seat: number; source: number; color: number; count: number; line: number; first: boolean }
  | { n: number; type: 'tile'; seat: number; placed: WallLog[]; floor: number }
  | { n: number; type: 'bonus'; seat: number; rows: number; cols: number; colors: number; points: number }
  | { n: number; type: 'round'; round: number };

export interface MatchState {
  config: GameConfig;
  players: number;
  round: number;
  /** 몇 번째 판(타일 놓기 횟수) */
  stage: number;
  status: 'playing' | 'round-over' | 'match-over';
  /** draft: 공장에서 가져오기 · wall: 자유 벽에서 줄마다 놓을 칸 고르기 */
  phase: 'draft' | 'wall';
  turn: number;
  bag: number[];
  lid: number[];
  factories: number[][];
  center: Tile[];
  boards: Board[];
  /** 다음 판 시작할 사람 (첫 플레이어 표시를 가져간 사람) */
  nextFirst: number;
  /** 이번 타일 놓기에서 벽에 놓인 것 (판 끝에 기록) */
  placed: WallLog[];
  winners: number[];
  roundTotals: number[][];
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

function drawTile(m: MatchState): number | null {
  if (!m.bag.length) {
    if (!m.lid.length) return null;
    m.bag = m.lid;
    m.lid = [];
  }
  const i = Math.floor(nextRandom(m) * m.bag.length);
  return m.bag.splice(i, 1)[0];
}

function fillFactories(m: MatchState) {
  const n = factoriesFor(m.config, m.players);
  m.factories = Array.from({ length: n }, () => {
    const f: number[] = [];
    for (let k = 0; k < m.config.perFactory; k++) {
      const t = drawTile(m);
      if (t !== null) f.push(t);
    }
    return f.sort((a, b) => a - b);
  });
  m.center = [FIRST];
  m.phase = 'draft';
  m.turn = m.nextFirst;
}

const emptyBoard = (n: number): Board => ({ lines: Array.from({ length: n }, () => ({ color: null, count: 0 })), wall: Array.from({ length: n }, () => Array(n).fill(null)), floor: [], score: 0 });

function startGame(m: MatchState, first: number) {
  const c = m.config;
  m.bag = [];
  for (let col = 0; col < c.colors; col++) for (let k = 0; k < c.tilesPerColor; k++) m.bag.push(col);
  m.lid = [];
  m.boards = Array.from({ length: m.players }, () => emptyBoard(c.colors));
  m.stage = 1;
  m.nextFirst = first;
  m.placed = [];
  m.status = 'playing';
  fillFactories(m);
}

export function newMatch(c: GameConfig, players: number, rng: () => number = Math.random): MatchState {
  const errors = validateConfig(c, players);
  if (errors.length) throw new MoveError(errors[0]);
  const m = { config: c, players, round: 1, winners: [], roundTotals: [], log: [], seq: 0, rng: Math.floor(rng() * 4294967296) >>> 0 } as unknown as MatchState;
  startGame(m, Math.floor(nextRandom(m) * players));
  return m;
}

/** 이 줄에 이 색을 놓을 수 있는지 (바닥 = line −1은 늘 가능) */
export function lineProblem(c: GameConfig, b: Board, line: number, color: number): string | null {
  if (line === -1) return null;
  const l = b.lines[line];
  if (!l) return '그런 줄은 없어요';
  if (l.count >= line + 1) return '이 줄은 이미 꽉 찼어요';
  if (l.color !== null && l.color !== color) return '이 줄에는 이미 다른 색이 있어요';
  if (c.freeWall ? b.wall[line].includes(color) : b.wall[line][wallCol(c.colors, line, color)] !== null) return '벽의 이 줄에 이미 그 색이 있어요';
  return null;
}

export function actors(m: MatchState): number[] {
  if (m.status !== 'playing') return [];
  if (m.phase === 'wall') return m.boards.flatMap((b, i) => (pendingRows(m.config, b).length ? [i] : []));
  return [m.turn];
}

const sourceEmpty = (m: MatchState) => m.factories.every((f) => f.length === 0) && m.center.every((t) => t === FIRST);

export function applyMove(m: MatchState, seat: number, move: Move) {
  if (m.status !== 'playing') throw new MoveError('지금은 진행 중인 판이 없어요');
  if (!actors(m).includes(seat)) throw new MoveError(m.phase === 'wall' ? '이미 벽에 다 놓았어요' : '지금은 내 차례가 아니에요');
  const c = m.config;
  const b = m.boards[seat];
  if (m.phase === 'wall') {
    if (move.type !== 'wall') throw new MoveError('벽에 놓을 칸을 골라 주세요');
    const rows = pendingRows(c, b);
    if (move.row !== rows[0]) throw new MoveError(`${rows[0] + 1}번째 줄부터 놓아요`);
    const color = b.lines[move.row].color!;
    if (b.wall[move.row][move.col] !== null) throw new MoveError('이미 타일이 있는 칸이에요');
    if (b.wall.some((r) => r[move.col] === color)) throw new MoveError('같은 세로줄에 그 색이 이미 있어요');
    placeOnWall(m, seat, move.row, move.col);
    dropImpossible(m, seat);
    if (!actors(m).length) finishStage(m);
    return;
  }
  if (move.type !== 'take') throw new MoveError('타일을 가져와 주세요');
  const fromCenter = move.source === -1;
  const pool = fromCenter ? m.center : m.factories[move.source];
  if (!pool) throw new MoveError('그런 공장은 없어요');
  const n = pool.filter((t) => t === move.color).length;
  if (!n || move.color < 0) throw new MoveError('그 색 타일이 없어요');
  const problem = lineProblem(c, b, move.line, move.color);
  if (problem) throw new MoveError(problem);
  let first = false;
  if (fromCenter) {
    m.center = m.center.filter((t) => t !== move.color);
    if (m.center.includes(FIRST)) {
      m.center = m.center.filter((t) => t !== FIRST);
      b.floor.push(FIRST);
      m.nextFirst = seat;
      first = true;
    }
  } else {
    m.center.push(...pool.filter((t) => t !== move.color));
    m.factories[move.source] = [];
  }
  let left = n;
  if (move.line >= 0) {
    const l = b.lines[move.line];
    const room = move.line + 1 - l.count;
    const put = Math.min(room, left);
    l.color = move.color;
    l.count += put;
    left -= put;
  }
  for (let k = 0; k < left; k++) {
    if (b.floor.length < c.floor.length) b.floor.push(move.color);
    else m.lid.push(move.color);
  }
  log(m, { type: 'take', seat, source: move.source, color: move.color, count: n, line: move.line, first });
  if (sourceEmpty(m)) return endDraft(m);
  m.turn = (m.turn + 1) % m.players;
}

export function pendingRows(c: GameConfig, b: Board): number[] {
  return b.lines.flatMap((l, i) => (l.color !== null && l.count === i + 1 ? [i] : []));
}

/** 벽에 놓고 인접 점수 */
export function adjacency(wall: (number | null)[][], r: number, col: number): number {
  const n = wall.length;
  let h = 1;
  for (let x = col - 1; x >= 0 && wall[r][x] !== null; x--) h++;
  for (let x = col + 1; x < n && wall[r][x] !== null; x++) h++;
  let v = 1;
  for (let y = r - 1; y >= 0 && wall[y][col] !== null; y--) v++;
  for (let y = r + 1; y < n && wall[y][col] !== null; y++) v++;
  if (h === 1 && v === 1) return 1;
  return (h > 1 ? h : 0) + (v > 1 ? v : 0);
}

function placeOnWall(m: MatchState, seat: number, row: number, col: number) {
  const b = m.boards[seat];
  const l = b.lines[row];
  const color = l.color!;
  b.wall[row][col] = color;
  const points = adjacency(b.wall, row, col);
  b.score += points;
  for (let k = 0; k < l.count - 1; k++) m.lid.push(color);
  l.color = null;
  l.count = 0;
  m.placed.push({ seat, row, col, color, points });
}

function endDraft(m: MatchState) {
  const c = m.config;
  m.placed = [];
  if (!c.freeWall) {
    for (let s = 0; s < m.players; s++) for (const row of pendingRows(c, m.boards[s])) placeOnWall(m, s, row, wallCol(c.colors, row, m.boards[s].lines[row].color!));
    return finishStage(m);
  }
  for (let s = 0; s < m.players; s++) dropImpossible(m, s);
  m.phase = 'wall';
  if (!actors(m).length) finishStage(m);
}

/** 자유 벽: 놓을 칸이 없어진 줄(세로줄이 모두 막힘)은 바닥으로 */
function dropImpossible(m: MatchState, s: number) {
  const c = m.config;
  const b = m.boards[s];
  for (const row of pendingRows(c, b)) {
    const color = b.lines[row].color!;
    const ok = b.wall[row].some((cell, col) => cell === null && !b.wall.some((r) => r[col] === color));
    if (!ok) {
      for (let k = 0; k < b.lines[row].count; k++) (b.floor.length < c.floor.length ? b.floor : m.lid).push(color);
      b.lines[row] = { color: null, count: 0 };
    }
  }
}

function finishStage(m: MatchState) {
  const c = m.config;
  for (let s = 0; s < m.players; s++) {
    const b = m.boards[s];
    const pen = b.floor.reduce((a, _t, i) => a + (c.floor[i] ?? 0), 0);
    b.score = Math.max(0, b.score + pen);
    for (const t of b.floor) if (t !== FIRST) m.lid.push(t);
    log(m, { type: 'tile', seat: s, placed: m.placed.filter((p) => p.seat === s), floor: pen });
    b.floor = [];
  }
  m.placed = [];
  const rowDone = m.boards.some((b) => b.wall.some((r) => r.every((x) => x !== null)));
  if (rowDone || (c.maxRounds && m.stage >= c.maxRounds)) return endGame(m);
  m.stage++;
  log(m, { type: 'round', round: m.stage });
  fillFactories(m);
  if (m.factories.every((f) => !f.length)) endGame(m); // 타일이 다 떨어짐
}

export function bonusOf(c: GameConfig, b: Board) {
  const n = c.colors;
  const rows = b.wall.filter((r) => r.every((x) => x !== null)).length;
  let cols = 0;
  for (let x = 0; x < n; x++) if (b.wall.every((r) => r[x] !== null)) cols++;
  let colors = 0;
  for (let col = 0; col < n; col++) if (b.wall.flat().filter((x) => x === col).length === n) colors++;
  return { rows, cols, colors, points: rows * c.rowBonus + cols * c.colBonus + colors * c.colorBonus };
}

function endGame(m: MatchState) {
  for (let s = 0; s < m.players; s++) {
    const bonus = bonusOf(m.config, m.boards[s]);
    m.boards[s].score += bonus.points;
    log(m, { type: 'bonus', seat: s, ...bonus });
  }
  // 동점: 완성한 가로줄 수
  const key = m.boards.map((b) => b.score * 10 + b.wall.filter((r) => r.every((x) => x !== null)).length);
  m.winners.push(key.indexOf(Math.max(...key)));
  m.roundTotals.push(m.boards.map((b) => b.score));
  m.status = m.round >= m.config.rounds ? 'match-over' : 'round-over';
}

export function startNextRound(m: MatchState) {
  if (m.status !== 'round-over') throw new MoveError('아직 판이 끝나지 않았어요');
  m.round++;
  startGame(m, (m.nextFirst + 1) % m.players);
}

export function continueMatch(prev: MatchState, config: GameConfig, rng: () => number = Math.random): MatchState {
  const done = prev.winners.length;
  if (done >= config.rounds) throw new MoveError(`벌써 ${done}판을 마쳤어요. 판 수를 ${done + 1}판 이상으로 늘리면 이어서 할 수 있어요`);
  const m = newMatch(config, prev.players, rng);
  m.round = done + 1;
  m.winners = [...prev.winners];
  m.roundTotals = prev.roundTotals.map((r) => [...r]);
  return m;
}

export function matchTotals(m: Pick<MatchState, 'roundTotals' | 'players' | 'boards' | 'status'>): number[] {
  const t = Array(m.players).fill(0);
  for (const r of m.roundTotals) r.forEach((v, i) => (t[i] += v));
  if (m.status === 'playing') m.boards.forEach((b, i) => (t[i] += b.score));
  return t;
}

/** 시간 초과: 가장 많은 색을 놓을 수 있는 줄에, 없으면 바닥 / 자유 벽은 첫 빈칸 */
export function autoMove(m: MatchState, seat: number): Move {
  const c = m.config;
  const b = m.boards[seat];
  if (m.phase === 'wall') {
    const row = pendingRows(c, b)[0];
    const color = b.lines[row].color!;
    const col = b.wall[row].findIndex((cell, x) => cell === null && !b.wall.some((r) => r[x] === color));
    return { type: 'wall', row, col };
  }
  const sources = [-1, ...m.factories.map((_, i) => i)];
  for (const source of sources) {
    const pool = source === -1 ? m.center : m.factories[source];
    for (const color of [...new Set(pool.filter((t) => t !== FIRST))]) {
      for (let line = c.colors - 1; line >= 0; line--) if (!lineProblem(c, b, line, color)) return { type: 'take', source, color, line };
    }
  }
  for (const source of sources) {
    const pool = source === -1 ? m.center : m.factories[source];
    const color = pool.find((t) => t !== FIRST);
    if (color !== undefined) return { type: 'take', source, color, line: -1 };
  }
  return { type: 'take', source: -1, color: 0, line: -1 };
}
