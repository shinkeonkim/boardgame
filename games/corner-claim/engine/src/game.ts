import { RuleError } from '@bg/core';
import { GameConfig, colorCount, colorOwner, startCell, validateConfig } from './config';
import { Cell, PIECES, pieceById } from './pieces';

export class MoveError extends RuleError {}

export type Move = { type: 'place'; piece: string; orient: number; x: number; y: number };

export interface Placement {
  piece: string;
  orient: number;
  x: number;
  y: number;
}

export type LogEntry =
  | { n: number; type: 'place'; seat: number; color: number; piece: string; size: number }
  | { n: number; type: 'stuck'; color: number };

export interface MatchState {
  config: GameConfig;
  players: number;
  round: number;
  status: 'playing' | 'round-over' | 'match-over';
  board: number[];
  /** 색마다 남은 조각 */
  remaining: string[][];
  /** 지금 둘 색 */
  color: number;
  stuck: boolean[];
  lastPiece: (string | null)[];
  /** 3명일 때 4번째 색을 누가 둘지 돌리는 순번 */
  sharedTurn: number;
  /** 최근 놓은 칸 (화면 강조) */
  lastCells: number[];
  winners: number[];
  roundTotals: number[][];
  log: LogEntry[];
  seq: number;
  rng: number;
}

const PIECE_SETS: Record<GameConfig['pieceSet'], string[]> = {
  full: PIECES.map((p) => p.id),
  small: PIECES.filter((p) => p.size <= 4).map((p) => p.id),
  medium: [...PIECES.filter((p) => p.size <= 4).map((p) => p.id), 'I5', 'L5', 'P5', 'T5', 'U5', 'X5'],
};

type DistOmit<T, K extends keyof never> = T extends unknown ? Omit<T, K> : never;
function log(m: MatchState, e: DistOmit<LogEntry, 'n'>) {
  m.log.push({ ...(e as LogEntry), n: ++m.seq });
  if (m.log.length > 60) m.log.shift();
}

function deal(m: MatchState) {
  const c = m.config;
  m.board = Array(c.size * c.size).fill(-1);
  m.remaining = Array.from({ length: colorCount(c) }, () => [...PIECE_SETS[c.pieceSet]]);
  m.color = 0;
  m.stuck = Array(colorCount(c)).fill(false);
  m.lastPiece = Array(colorCount(c)).fill(null);
  m.sharedTurn = 0;
  m.lastCells = [];
  m.status = 'playing';
}

export function newMatch(c: GameConfig, players: number, rng: () => number = Math.random): MatchState {
  const errors = validateConfig(c, players);
  if (errors.length) throw new MoveError(errors[0]);
  const m = { config: c, players, round: 1, winners: [], roundTotals: [], log: [], seq: 0, rng: Math.floor(rng() * 4294967296) >>> 0 } as unknown as MatchState;
  deal(m);
  return m;
}

/** 지금 색을 두는 좌석 */
export function ownerOf(m: Pick<MatchState, 'config' | 'players' | 'sharedTurn'>, color: number): number {
  const o = colorOwner(m.config, m.players, color);
  return o >= 0 ? o : m.sharedTurn % m.players;
}

export const cellsOf = (p: Placement): Cell[] => {
  const def = pieceById(p.piece);
  const shape = def?.orients[p.orient];
  if (!shape) return [];
  return shape.map(([dx, dy]) => [p.x + dx, p.y + dy] as Cell);
};

const hasCells = (m: Pick<MatchState, 'board'>, color: number) => m.board.includes(color);

/** 놓을 수 없는 이유 (없으면 null) */
export function placeProblem(m: Pick<MatchState, 'board' | 'config' | 'remaining'>, color: number, p: Placement): string | null {
  const c = m.config;
  const n = c.size;
  if (!m.remaining[color].includes(p.piece)) return '이미 쓴 조각이에요';
  const cells = cellsOf(p);
  if (!cells.length) return '그런 모양은 없어요';
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= n || y >= n ? -2 : m.board[y * n + x]);
  for (const [x, y] of cells) {
    if (x < 0 || y < 0 || x >= n || y >= n) return '판 밖으로 나가요';
    if (at(x, y) !== -1) return '이미 놓인 칸과 겹쳐요';
  }
  for (const [x, y] of cells)
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ])
      if (at(x + dx, y + dy) === color) return '내 색 조각과 변이 닿으면 안 돼요 (모서리만)';
  if (!hasCells(m, color)) {
    const [sx, sy] = startCell(c, color);
    if (!cells.some(([x, y]) => x === sx && y === sy)) return '첫 조각은 시작 칸(★)을 덮어야 해요';
    return null;
  }
  const corner = cells.some(([x, y]) =>
    [
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ].some(([dx, dy]) => at(x + dx, y + dy) === color),
  );
  return corner ? null : '내 색 조각과 모서리가 닿아야 해요';
}

/** 이 색의 모서리 자리 (새 조각이 닿을 수 있는 빈칸) */
export function anchors(m: Pick<MatchState, 'board' | 'config'>, color: number): number[] {
  const n = m.config.size;
  if (!hasCells(m, color)) {
    const [sx, sy] = startCell(m.config, color);
    return m.board[sy * n + sx] === -1 ? [sy * n + sx] : [];
  }
  const out: number[] = [];
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= n || y >= n ? -2 : m.board[y * n + x]);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      if (m.board[y * n + x] !== -1) continue;
      if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => at(x + dx, y + dy) === color)) continue;
      if ([[1, 1], [1, -1], [-1, 1], [-1, -1]].some(([dx, dy]) => at(x + dx, y + dy) === color)) out.push(y * n + x);
    }
  return out;
}

/** 놓을 수 있는 모든 자리 (pieces로 조각을 제한할 수 있음) */
export function legalPlacements(m: Pick<MatchState, 'board' | 'config' | 'remaining'>, color: number, pieces?: string[], limit = Infinity): Placement[] {
  const n = m.config.size;
  const out: Placement[] = [];
  const seen = new Set<string>();
  const anc = anchors(m, color);
  for (const id of pieces ?? m.remaining[color]) {
    const def = pieceById(id)!;
    def.orients.forEach((shape, orient) => {
      for (const a of anc) {
        const ax = a % n;
        const ay = (a - ax) / n;
        for (const [cx, cy] of shape) {
          const p = { piece: id, orient, x: ax - cx, y: ay - cy };
          const k = `${id}|${orient}|${p.x}|${p.y}`;
          if (seen.has(k)) continue;
          seen.add(k);
          if (!placeProblem(m, color, p)) {
            out.push(p);
            if (out.length >= limit) return;
          }
        }
      }
    });
    if (out.length >= limit) break;
  }
  return out;
}

export const canPlay = (m: Pick<MatchState, 'board' | 'config' | 'remaining'>, color: number) => m.remaining[color].length > 0 && legalPlacements(m, color, undefined, 1).length > 0;

export function actors(m: MatchState): number[] {
  return m.status === 'playing' ? [ownerOf(m, m.color)] : [];
}

export function applyMove(m: MatchState, seat: number, move: Move) {
  if (m.status !== 'playing') throw new MoveError('지금은 진행 중인 판이 없어요');
  if (seat !== ownerOf(m, m.color)) throw new MoveError('지금은 내 차례가 아니에요');
  if (move.type !== 'place') throw new MoveError('조각을 놓아 주세요');
  const p = { piece: move.piece, orient: move.orient, x: move.x, y: move.y };
  const problem = placeProblem(m, m.color, p);
  if (problem) throw new MoveError(problem);
  const n = m.config.size;
  const cells = cellsOf(p);
  for (const [x, y] of cells) m.board[y * n + x] = m.color;
  m.remaining[m.color] = m.remaining[m.color].filter((id) => id !== p.piece);
  m.lastPiece[m.color] = p.piece;
  m.lastCells = cells.map(([x, y]) => y * n + x);
  log(m, { type: 'place', seat, color: m.color, piece: p.piece, size: cells.length });
  advance(m);
}

function advance(m: MatchState) {
  const total = colorCount(m.config);
  if (colorOwner(m.config, m.players, m.color) < 0) m.sharedTurn++;
  for (let k = 0; k < total; k++) {
    m.color = (m.color + 1) % total;
    if (m.stuck[m.color]) continue;
    if (canPlay(m, m.color)) return;
    m.stuck[m.color] = true;
    log(m, { type: 'stuck', color: m.color });
  }
  finish(m);
}

/** 색별 점수 */
export function colorScore(m: Pick<MatchState, 'remaining' | 'config' | 'lastPiece'>, color: number): number {
  const left = m.remaining[color].reduce((a, id) => a + pieceById(id)!.size, 0);
  if (m.config.scoring === 'basic') return -left;
  if (left === 0) return 15 + (m.lastPiece[color] === 'I1' ? 5 : 0);
  return -left;
}

/** 좌석별 점수 (공유 색은 빼고) */
export function seatScores(m: Pick<MatchState, 'remaining' | 'config' | 'lastPiece' | 'players'>): number[] {
  const out = Array(m.players).fill(0);
  for (let color = 0; color < colorCount(m.config); color++) {
    const o = colorOwner(m.config, m.players, color);
    if (o >= 0) out[o] += colorScore(m, color);
  }
  return out;
}

function finish(m: MatchState) {
  const s = seatScores(m);
  m.roundTotals.push(s);
  const best = Math.max(...s);
  m.winners.push(s.indexOf(best));
  m.status = m.round >= m.config.rounds ? 'match-over' : 'round-over';
}

export function startNextRound(m: MatchState) {
  if (m.status !== 'round-over') throw new MoveError('아직 판이 끝나지 않았어요');
  m.round++;
  deal(m);
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

export function matchTotals(m: Pick<MatchState, 'roundTotals' | 'players' | 'status' | 'remaining' | 'config' | 'lastPiece'>): number[] {
  const t = Array(m.players).fill(0);
  for (const r of m.roundTotals) r.forEach((v, i) => (t[i] += v));
  if (m.status === 'playing') seatScores(m).forEach((v, i) => (t[i] += v));
  return t;
}

/** 시간 초과·대신 진행: 가장 큰 조각의 첫 자리 */
export function autoMove(m: MatchState, _seat: number): Move {
  const sorted = [...m.remaining[m.color]].sort((a, b) => pieceById(b)!.size - pieceById(a)!.size);
  for (const id of sorted) {
    const p = legalPlacements(m, m.color, [id], 1)[0];
    if (p) return { type: 'place', ...p };
  }
  return { type: 'place', piece: sorted[0], orient: 0, x: 0, y: 0 };
}
