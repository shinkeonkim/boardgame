import { RuleError } from '@bg/core';
import { GameConfig, validateConfig } from './config';

export class MoveError extends RuleError {}

/** 0 = 흑, 1 = 백 */
export type Stone = 0 | 1;
export type Move = { type: 'place'; x: number; y: number } | { type: 'resign' };

export type LogEntry =
  | { n: number; type: 'place'; seat: number; stone: Stone; x: number; y: number }
  | { n: number; type: 'win'; seat: number; line: [number, number][] | null; resigned: boolean }
  | { n: number; type: 'draw' };

export interface MatchState {
  config: GameConfig;
  players: number;
  round: number;
  status: 'playing' | 'round-over' | 'match-over';
  /** -1 빈칸, 0 흑, 1 백 (y * size + x) */
  board: number[];
  /** 이번 판에 흑을 잡은 좌석 (판마다 바뀜) */
  black: number;
  turn: number;
  moves: number;
  /** 이긴 줄 (보드에 강조) */
  winLine: [number, number][] | null;
  /** 판별 승자 (-1 = 무승부) */
  roundWinners: number[];
  log: LogEntry[];
  seq: number;
}

type DistOmit<T, K extends keyof never> = T extends unknown ? Omit<T, K> : never;
function log(m: MatchState, e: DistOmit<LogEntry, 'n'>) {
  m.log.push({ ...(e as LogEntry), n: ++m.seq });
  if (m.log.length > 80) m.log.shift();
}

export const stoneOf = (m: Pick<MatchState, 'black'>, seat: number): Stone => (seat === m.black ? 0 : 1);

function deal(m: MatchState) {
  const n = m.config.size;
  m.board = Array(n * n).fill(-1);
  m.turn = m.black;
  m.moves = 0;
  m.winLine = null;
  m.status = 'playing';
}

export function newMatch(c: GameConfig, players: number, rng: () => number = Math.random): MatchState {
  const errors = validateConfig(c, players);
  if (errors.length) throw new MoveError(errors[0]);
  const m = { config: c, players, round: 1, roundWinners: [], log: [], seq: 0, black: Math.floor(rng() * 2) } as unknown as MatchState;
  deal(m);
  return m;
}

const DIRS: [number, number][] = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1],
];

/** (x,y)를 지나는 한 방향 줄: 같은 색으로 이어진 칸들 */
export function lineThrough(board: number[], size: number, x: number, y: number, dx: number, dy: number): [number, number][] {
  const c = board[y * size + x];
  const cells: [number, number][] = [[x, y]];
  for (const s of [1, -1]) {
    let cx = x + dx * s;
    let cy = y + dy * s;
    while (cx >= 0 && cy >= 0 && cx < size && cy < size && board[cy * size + cx] === c) {
      if (s === 1) cells.push([cx, cy]);
      else cells.unshift([cx, cy]);
      cx += dx * s;
      cy += dy * s;
    }
  }
  return cells;
}

/** 방금 둔 돌로 이겼으면 그 다섯 줄 */
export function winningLine(board: number[], size: number, x: number, y: number, exactFive: boolean): [number, number][] | null {
  for (const [dx, dy] of DIRS) {
    const line = lineThrough(board, size, x, y, dx, dy);
    if (exactFive ? line.length === 5 : line.length >= 5) return line;
  }
  return null;
}

export function actors(m: MatchState): number[] {
  return m.status === 'playing' ? [m.turn] : [];
}

export function applyMove(m: MatchState, seat: number, move: Move) {
  if (m.status !== 'playing') throw new MoveError('지금은 진행 중인 판이 없어요');
  if (seat !== m.turn && move.type !== 'resign') throw new MoveError('지금은 내 차례가 아니에요');
  if (move.type === 'resign') {
    const other = 1 - seat;
    m.roundWinners.push(other);
    log(m, { type: 'win', seat: other, line: null, resigned: true });
    return finishRound(m);
  }
  const n = m.config.size;
  if (!Number.isInteger(move.x) || !Number.isInteger(move.y) || move.x < 0 || move.y < 0 || move.x >= n || move.y >= n) throw new MoveError('판 밖이에요');
  const i = move.y * n + move.x;
  if (m.board[i] !== -1) throw new MoveError('이미 돌이 있어요');
  const stone = stoneOf(m, seat);
  m.board[i] = stone;
  m.moves++;
  log(m, { type: 'place', seat, stone, x: move.x, y: move.y });
  const line = winningLine(m.board, n, move.x, move.y, m.config.exactFive);
  if (line) {
    m.winLine = line;
    m.roundWinners.push(seat);
    log(m, { type: 'win', seat, line, resigned: false });
    return finishRound(m);
  }
  if (m.moves >= n * n) {
    m.roundWinners.push(-1);
    log(m, { type: 'draw' });
    return finishRound(m);
  }
  m.turn = 1 - seat;
}

function finishRound(m: MatchState) {
  const wins = matchTotals(m);
  const need = Math.floor(m.config.rounds / 2) + 1;
  // 과반을 먼저 이기거나 판을 다 하면 끝
  m.status = m.round >= m.config.rounds || wins.some((w) => w >= need) ? 'match-over' : 'round-over';
}

export function startNextRound(m: MatchState) {
  if (m.status !== 'round-over') throw new MoveError('아직 판이 끝나지 않았어요');
  m.round++;
  m.black = 1 - m.black;
  deal(m);
}

export function continueMatch(prev: MatchState, config: GameConfig, rng: () => number = Math.random): MatchState {
  const done = prev.roundWinners.length;
  if (done >= config.rounds) throw new MoveError(`벌써 ${done}판을 마쳤어요. 판 수를 ${done + 1} 이상으로 늘리면 이어서 할 수 있어요`);
  const m = newMatch(config, prev.players, rng);
  m.round = done + 1;
  m.roundWinners = [...prev.roundWinners];
  m.black = 1 - prev.black;
  return m;
}

/** 좌석별 이긴 판 수 */
export function matchTotals(m: Pick<MatchState, 'roundWinners' | 'players'>): number[] {
  const t = Array(m.players).fill(0);
  for (const w of m.roundWinners) if (w >= 0) t[w]++;
  return t;
}

/** 시간 초과·대신 진행: 가장 좋아 보이는 자리 (봇과 같은 평가, 실수 없이) */
export function autoMove(m: MatchState, seat: number): Move {
  const [x, y] = bestCells(m.board, m.config.size, stoneOf(m, seat), m.config.exactFive)[0] ?? [Math.floor(m.config.size / 2), Math.floor(m.config.size / 2)];
  return { type: 'place', x, y };
}

// ---------- 자리 평가 (봇·자동 수 공용) ----------

/** 한 방향에서 (x,y)에 color 를 두면 생기는 줄의 길이와 막히지 않은 끝 수 */
function shape(board: number[], n: number, x: number, y: number, dx: number, dy: number, color: number): { len: number; open: number } {
  let len = 1;
  let open = 0;
  for (const s of [1, -1]) {
    let cx = x + dx * s;
    let cy = y + dy * s;
    while (cx >= 0 && cy >= 0 && cx < n && cy < n && board[cy * n + cx] === color) {
      len++;
      cx += dx * s;
      cy += dy * s;
    }
    if (cx >= 0 && cy >= 0 && cx < n && cy < n && board[cy * n + cx] === -1) open++;
  }
  return { len, open };
}

const WEIGHT = (len: number, open: number, exactFive: boolean): number => {
  if (len >= 5) return exactFive && len > 5 ? 0 : 1_000_000;
  if (open === 0) return 0;
  if (len === 4) return open === 2 ? 120_000 : 12_000;
  if (len === 3) return open === 2 ? 9_000 : 900;
  if (len === 2) return open === 2 ? 400 : 60;
  return open === 2 ? 20 : 4;
};

/** (x,y) 의 가치: 내가 두면 생기는 공격 + 상대가 두면 생길 위협(막기) */
export function cellScore(board: number[], n: number, x: number, y: number, me: number, exactFive: boolean): number {
  let attack = 0;
  let defend = 0;
  for (const [dx, dy] of DIRS) {
    const a = shape(board, n, x, y, dx, dy, me);
    const d = shape(board, n, x, y, dx, dy, 1 - me);
    attack += WEIGHT(a.len, a.open, exactFive);
    defend += WEIGHT(d.len, d.open, exactFive);
  }
  // 가운데에 가까울수록 조금 더 (첫 수·빈 판)
  const c = (n - 1) / 2;
  const center = 3 - (Math.abs(x - c) + Math.abs(y - c)) / n;
  return attack * 1.1 + defend + center;
}

/** 둘 만한 자리(이미 놓인 돌 둘레 2칸 안)를 좋은 순서로 */
export function bestCells(board: number[], n: number, me: number, exactFive: boolean): [number, number, number][] {
  const out: [number, number, number][] = [];
  const any = board.some((v) => v !== -1);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      if (board[y * n + x] !== -1) continue;
      if (any) {
        let near = false;
        for (let dy = -2; dy <= 2 && !near; dy++)
          for (let dx = -2; dx <= 2 && !near; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && ny >= 0 && nx < n && ny < n && board[ny * n + nx] !== -1) near = true;
          }
        if (!near) continue;
      }
      out.push([x, y, cellScore(board, n, x, y, me, exactFive)]);
    }
  return out.sort((a, b) => b[2] - a[2]);
}
