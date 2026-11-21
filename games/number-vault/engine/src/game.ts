import { RuleError } from '@bg/core';
import { GameConfig, startTilesFor, validateConfig } from './config';

export class MoveError extends RuleError {}

/** n = -1이면 조커 */
export interface Tile {
  id: string;
  n: number;
  /** 0 = 검정, 1 = 하양 */
  color: 0 | 1;
  revealed: boolean;
}

export type Move =
  | { type: 'draw'; color?: 0 | 1 }
  | { type: 'guess'; target: number; tileId: string; value: number }
  | { type: 'stop' }
  | { type: 'reveal'; tileId: string }
  | { type: 'place'; index: number };

export interface Miss {
  target: number;
  tileId: string;
  value: number;
}

export type LogEntry =
  | { n: number; type: 'draw'; seat: number; color: 0 | 1 }
  | { n: number; type: 'guess'; seat: number; target: number; tileId: string; pos: number; value: number; ok: boolean }
  | { n: number; type: 'stop'; seat: number }
  | { n: number; type: 'expose'; seat: number; tileId: string; value: number }
  | { n: number; type: 'out'; seat: number }
  | { n: number; type: 'win'; seat: number };

export interface MatchState {
  config: GameConfig;
  players: number;
  round: number;
  status: 'playing' | 'round-over' | 'match-over';
  /** draw → (place: 조커를 뽑았을 때 자리 고르기) → guess → continue(맞힘: 더/멈춤) | reveal(틀렸는데 뽑은 타일이 없을 때 내 타일 공개) */
  phase: 'draw' | 'place' | 'guess' | 'continue' | 'reveal';
  turn: number;
  rows: Tile[][];
  pool: Tile[];
  /** 이번 차례에 뽑아 아직 줄에 넣지 않은 타일 */
  pending: Tile | null;
  /** 조커를 넣을 자리 (place 단계에서 고름; null이면 차례 끝에 정렬 위치) */
  jokerAt: number | null;
  misses: Miss[];
  /** 탈락 순서 (먼저 탈락한 사람부터) */
  outOrder: number[];
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
  if (m.log.length > 80) m.log.shift();
}

/** 정렬 기준: 숫자 오름차순, 같으면 검정이 왼쪽 */
export const keyOf = (t: Pick<Tile, 'n' | 'color'>) => t.n * 2 + t.color;

/** 타일을 줄에 넣을 자리: 조커가 아니면 정렬 위치 (조커는 그 자리 그대로 둠) */
export function insertSorted(row: Tile[], tile: Tile): number {
  if (tile.n < 0) return row.length;
  let i = 0;
  // 조커는 건너뛰며 앞의 숫자 타일보다 큰 첫 자리
  while (i < row.length && (row[i].n < 0 || keyOf(row[i]) < keyOf(tile))) {
    if (row[i].n < 0) {
      // 조커 뒤 다음 숫자 타일이 더 크면 조커 앞에 멈출 이유는 없음 — 조커는 그대로 지나감
    }
    i++;
  }
  // 직전이 조커이고 그 앞 숫자보다 크면 조커 뒤가 맞음 — 위 루프가 처리
  return i;
}

function shuffle<T>(arr: T[], m: { rng: number }): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(nextRandom(m) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function deal(m: MatchState) {
  const c = m.config;
  const tiles: Tile[] = [];
  for (let n = 0; n <= c.maxNumber; n++) for (const color of [0, 1] as const) tiles.push({ id: `${color ? 'w' : 'b'}${n}`, n, color, revealed: false });
  for (let k = 0; k < c.jokers; k++) tiles.push({ id: `j${k}`, n: -1, color: (k % 2) as 0 | 1, revealed: false });
  shuffle(tiles, m);
  // 처음 나눠 줄 때는 조커가 정렬 위치를 갖지 않으므로 무작위 자리
  m.rows = Array.from({ length: m.players }, () => {
    const row: Tile[] = [];
    for (let k = 0; k < startTilesFor(c, m.players); k++) {
      const t = tiles.pop()!;
      const at = t.n < 0 ? Math.floor(nextRandom(m) * (row.length + 1)) : insertSorted(row, t);
      row.splice(at, 0, t);
    }
    return row;
  });
  m.pool = tiles;
  m.pending = null;
  m.jokerAt = null;
  m.misses = [];
  m.outOrder = [];
  m.phase = m.pool.length ? 'draw' : 'guess';
  m.status = 'playing';
}

export function newMatch(c: GameConfig, players: number, rng: () => number = Math.random): MatchState {
  const errors = validateConfig(c, players);
  if (errors.length) throw new MoveError(errors[0]);
  const m = { config: c, players, round: 1, winners: [], log: [], seq: 0, rng: Math.floor(rng() * 4294967296) >>> 0 } as unknown as MatchState;
  deal(m);
  m.turn = Math.floor(nextRandom(m) * players);
  return m;
}

export const isOut = (m: Pick<MatchState, 'rows'>, seat: number) => m.rows[seat].every((t) => t.revealed);
export const alive = (m: Pick<MatchState, 'rows' | 'players'>) => Array.from({ length: m.players }, (_, i) => i).filter((s) => !isOut(m, s));

function nextAlive(m: MatchState, seat: number) {
  for (let k = 1; k <= m.players; k++) {
    const s = (seat + k) % m.players;
    if (!isOut(m, s)) return s;
  }
  return seat;
}

export function actors(m: MatchState): number[] {
  return m.status === 'playing' ? [m.turn] : [];
}

/** 뽑은 타일을 줄에 넣는다 (조커는 고른 자리) */
function placePending(m: MatchState, seat: number, revealed: boolean) {
  const t = m.pending;
  if (!t) return;
  t.revealed = revealed;
  const row = m.rows[seat];
  const at = t.n < 0 ? Math.min(row.length, Math.max(0, m.jokerAt ?? row.length)) : insertSorted(row, t);
  row.splice(at, 0, t);
  m.pending = null;
  m.jokerAt = null;
}

function endTurn(m: MatchState) {
  const left = alive(m);
  if (left.length <= 1) {
    const w = left[0] ?? m.turn;
    m.winners.push(w);
    log(m, { type: 'win', seat: w });
    m.status = m.round >= m.config.rounds || m.winners.filter((x) => x === w).length > m.config.rounds / 2 ? 'match-over' : 'round-over';
    return;
  }
  m.turn = nextAlive(m, m.turn);
  m.phase = m.pool.length ? 'draw' : 'guess';
}

function checkOut(m: MatchState, seat: number) {
  if (isOut(m, seat) && !m.outOrder.includes(seat)) {
    m.outOrder.push(seat);
    log(m, { type: 'out', seat });
  }
}

export function applyMove(m: MatchState, seat: number, move: Move) {
  if (m.status !== 'playing') throw new MoveError('지금은 진행 중인 판이 없어요');
  if (seat !== m.turn) throw new MoveError('지금은 내 차례가 아니에요');
  const c = m.config;
  switch (move.type) {
    case 'draw': {
      if (m.phase !== 'draw') throw new MoveError('이번 차례에는 이미 타일을 가져왔어요');
      let idx = m.pool.length - 1;
      if (c.chooseColor && (move.color === 0 || move.color === 1)) {
        idx = m.pool.findIndex((t) => t.color === move.color);
        if (idx < 0) throw new MoveError(`${move.color ? '하얀' : '검은'} 타일이 더 없어요`);
      }
      const [t] = m.pool.splice(idx, 1);
      m.pending = t;
      log(m, { type: 'draw', seat, color: t.color });
      m.phase = t.n < 0 ? 'place' : 'guess';
      return;
    }
    case 'place': {
      if (m.phase !== 'place') throw new MoveError('지금은 조커 자리를 고를 때가 아니에요');
      if (!Number.isInteger(move.index) || move.index < 0 || move.index > m.rows[seat].length) throw new MoveError('그 자리에는 놓을 수 없어요');
      m.jokerAt = move.index;
      m.phase = 'guess';
      return;
    }
    case 'guess': {
      if (m.phase !== 'guess' && m.phase !== 'continue') throw new MoveError(m.phase === 'draw' ? '먼저 타일을 1장 가져와 주세요' : '지금은 맞힐 때가 아니에요');
      if (move.target === seat || !Number.isInteger(move.target) || move.target < 0 || move.target >= m.players) throw new MoveError('다른 사람의 타일을 골라 주세요');
      const row = m.rows[move.target];
      const pos = row.findIndex((t) => t.id === move.tileId);
      if (pos < 0) throw new MoveError('그 타일이 없어요');
      const tile = row[pos];
      if (tile.revealed) throw new MoveError('이미 공개된 타일이에요');
      const value = Math.round(move.value);
      if (!(value === -1 && c.jokers > 0) && !(value >= 0 && value <= c.maxNumber)) throw new MoveError(`0~${c.maxNumber}${c.jokers ? ' 또는 조커' : ''} 중에서 골라 주세요`);
      const ok = tile.n === value;
      log(m, { type: 'guess', seat, target: move.target, tileId: tile.id, pos, value, ok });
      if (ok) {
        tile.revealed = true;
        checkOut(m, move.target);
        if (alive(m).length <= 1) {
          placePending(m, seat, false);
          return endTurn(m);
        }
        if (!c.chain) {
          placePending(m, seat, false);
          return endTurn(m);
        }
        m.phase = 'continue';
        return;
      }
      m.misses.push({ target: move.target, tileId: tile.id, value });
      if (m.pending) {
        const t = m.pending;
        placePending(m, seat, true);
        log(m, { type: 'expose', seat, tileId: t.id, value: t.n });
        checkOut(m, seat);
        return endTurn(m);
      }
      // 가져온 타일이 없으면 내 타일 하나를 골라 공개
      if (m.rows[seat].some((t) => !t.revealed)) {
        m.phase = 'reveal';
        return;
      }
      return endTurn(m);
    }
    case 'stop': {
      if (m.phase !== 'continue') throw new MoveError('먼저 한 번은 맞혀야 멈출 수 있어요');
      log(m, { type: 'stop', seat });
      placePending(m, seat, false);
      return endTurn(m);
    }
    case 'reveal': {
      if (m.phase !== 'reveal') throw new MoveError('지금은 내 타일을 공개할 때가 아니에요');
      const t = m.rows[seat].find((x) => x.id === move.tileId);
      if (!t || t.revealed) throw new MoveError('공개할 수 없는 타일이에요');
      t.revealed = true;
      log(m, { type: 'expose', seat, tileId: t.id, value: t.n });
      checkOut(m, seat);
      return endTurn(m);
    }
  }
  throw new MoveError('할 수 없는 동작이에요');
}

export function startNextRound(m: MatchState) {
  if (m.status !== 'round-over') throw new MoveError('아직 판이 끝나지 않았어요');
  m.round++;
  deal(m);
  m.turn = m.winners[m.winners.length - 1] ?? 0;
}

export function continueMatch(prev: MatchState, config: GameConfig, rng: () => number = Math.random): MatchState {
  const done = prev.winners.length;
  if (done >= config.rounds) throw new MoveError(`벌써 ${done}판을 마쳤어요. 판 수를 ${done + 1}판 이상으로 늘리면 이어서 할 수 있어요`);
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
  if (m.phase === 'draw') return { type: 'draw' };
  if (m.phase === 'place') return { type: 'place', index: m.rows[seat].length };
  if (m.phase === 'continue') return { type: 'stop' };
  if (m.phase === 'reveal') return { type: 'reveal', tileId: m.rows[seat].find((t) => !t.revealed)!.id };
  // 맞히기: 다음 사람의 가려진 첫 타일에 그럴듯한 숫자
  for (let k = 1; k < m.players; k++) {
    const target = (seat + k) % m.players;
    const tile = m.rows[target].find((t) => !t.revealed);
    if (tile) return { type: 'guess', target, tileId: tile.id, value: Math.max(0, Math.min(m.config.maxNumber, 0)) };
  }
  return { type: 'stop' };
}
