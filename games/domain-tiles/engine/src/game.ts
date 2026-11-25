import { RuleError } from '@bg/core';
import { GameConfig, validateConfig } from './config';
import { DOMINOES, Domino, Half } from './tiles';

export class MoveError extends RuleError {}

/** 왕국: "x,y" → 칸 (성은 0,0) */
export type Cell = Half | { castle: true };
export type Kingdom = Record<string, Cell>;
export interface Placement {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}
export interface Slot {
  domino: Domino;
  /** 고른 사람 (아직이면 null) */
  claim: number | null;
}

export type Move = { type: 'claim'; slot: number } | ({ type: 'place' } & Placement) | { type: 'discard' };

export type LogEntry =
  | { n: number; type: 'claim'; seat: number; domino: Domino }
  | { n: number; type: 'place'; seat: number; domino: Domino; at: Placement }
  | { n: number; type: 'discard'; seat: number; domino: Domino }
  | { n: number; type: 'end'; scores: number[] };

export interface MatchState {
  config: GameConfig;
  players: number;
  round: number;
  status: 'playing' | 'round-over' | 'match-over';
  kingdoms: Kingdom[];
  deck: Domino[];
  /** 지금 줄: 고른 도미노를 위에서부터 차례로 놓음 */
  row: Slot[];
  /** 다음 줄: 놓고 나서 하나씩 고름 */
  next: Slot[];
  /** 'claim-first': 처음 줄 고르기 (무작위 순서) · 'place' · 'claim' */
  step: 'claim-first' | 'place' | 'claim';
  /** 처음 고르기 순서 (좌석, 2명이면 한 사람이 두 번) */
  firstOrder: number[];
  /** 지금 줄에서 몇 번째 도미노 차례 */
  active: number;
  discarded: number[];
  roundScores: number[][];
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

export const rowSize = (players: number) => (players === 3 ? 3 : 4);
const deckSize = (players: number, size: number) => (players === 2 ? (size === 7 ? 48 : 24) : players === 3 ? 36 : 48);
const key = (x: number, y: number) => `${x},${y}`;

function draw(m: MatchState): Slot[] {
  const n = rowSize(m.players);
  if (m.deck.length < n) return [];
  return m.deck
    .splice(0, n)
    .sort((a, b) => a.id - b.id)
    .map((domino) => ({ domino, claim: null }));
}

function deal(m: MatchState) {
  const deck = [...DOMINOES];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(nextRandom(m) * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  m.deck = deck.slice(0, deckSize(m.players, m.config.size));
  m.kingdoms = Array.from({ length: m.players }, () => ({ [key(0, 0)]: { castle: true } }));
  m.discarded = Array(m.players).fill(0);
  m.row = [];
  m.next = draw(m);
  const kings = m.players === 2 ? [0, 0, 1, 1] : Array.from({ length: m.players }, (_, i) => i);
  for (let i = kings.length - 1; i > 0; i--) {
    const j = Math.floor(nextRandom(m) * (i + 1));
    [kings[i], kings[j]] = [kings[j], kings[i]];
  }
  m.firstOrder = kings;
  m.step = 'claim-first';
  m.active = 0;
  m.status = 'playing';
}

export function newMatch(c: GameConfig, players: number, rng: () => number = Math.random): MatchState {
  const errors = validateConfig(c, players);
  if (errors.length) throw new MoveError(errors[0]);
  const m = { config: c, players, round: 1, roundScores: [], log: [], seq: 0, rng: Math.floor(rng() * 4294967296) >>> 0 } as unknown as MatchState;
  deal(m);
  return m;
}

/** 지금 둘 사람 */
export function currentSeat(m: MatchState): number {
  if (m.step === 'claim-first') return m.firstOrder[m.next.filter((s) => s.claim !== null).length];
  return m.row[m.active].claim!;
}
export function actors(m: MatchState): number[] {
  return m.status === 'playing' ? [currentSeat(m)] : [];
}

const isCastle = (c: Cell | undefined): c is { castle: true } => !!c && 'castle' in c;

/** 이 왕국에서 이 도미노를 놓을 수 있는 자리 모두 */
export function legalPlacements(k: Kingdom, d: Domino, size: number): Placement[] {
  const cells = Object.keys(k).map((s) => s.split(',').map(Number) as [number, number]);
  const minX = Math.min(...cells.map((c) => c[0]));
  const maxX = Math.max(...cells.map((c) => c[0]));
  const minY = Math.min(...cells.map((c) => c[1]));
  const maxY = Math.max(...cells.map((c) => c[1]));
  const out: Placement[] = [];
  const touches = (x: number, y: number, half: Half) =>
    [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ].some(([dx, dy]) => {
      const c = k[key(x + dx, y + dy)];
      return c && (isCastle(c) || c.t === half.t);
    });
  for (let x1 = maxX - size; x1 <= minX + size; x1++)
    for (let y1 = maxY - size; y1 <= minY + size; y1++)
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const x2 = x1 + dx;
        const y2 = y1 + dy;
        if (k[key(x1, y1)] || k[key(x2, y2)]) continue;
        const w = Math.max(maxX, x1, x2) - Math.min(minX, x1, x2) + 1;
        const h = Math.max(maxY, y1, y2) - Math.min(minY, y1, y2) + 1;
        if (w > size || h > size) continue;
        if (!touches(x1, y1, d.a) && !touches(x2, y2, d.b)) continue;
        out.push({ x1, y1, x2, y2 });
      }
  return out;
}

/** 점수: 같은 땅으로 이어진 구역마다 칸 수 × 왕관 수 */
export function scoreKingdom(k: Kingdom): { total: number; regions: { t: string; size: number; crowns: number }[] } {
  const seen = new Set<string>();
  const regions: { t: string; size: number; crowns: number }[] = [];
  for (const [p, c] of Object.entries(k)) {
    if (isCastle(c) || seen.has(p)) continue;
    let size = 0;
    let crowns = 0;
    const terrain = c.t;
    const stack = [p];
    seen.add(p);
    while (stack.length) {
      const cur = stack.pop()!;
      const cell = k[cur] as Half;
      size++;
      crowns += cell.crowns;
      const [x, y] = cur.split(',').map(Number);
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const nk = key(x + dx, y + dy);
        const n = k[nk];
        if (n && !isCastle(n) && n.t === cell.t && !seen.has(nk)) {
          seen.add(nk);
          stack.push(nk);
        }
      }
    }
    regions.push({ t: terrain, size, crowns });
  }
  return { total: regions.reduce((a, r) => a + r.size * r.crowns, 0), regions };
}

/** 보너스까지 더한 점수 */
export function finalScore(m: Pick<MatchState, 'config'>, k: Kingdom, discarded: number): number {
  let s = scoreKingdom(k).total;
  const cells = Object.keys(k).map((p) => p.split(',').map(Number));
  const n = m.config.size;
  const half = (n - 1) / 2;
  if (m.config.middle && cells.every(([x, y]) => Math.abs(x) <= half && Math.abs(y) <= half) && cells.length === n * n) s += 10;
  else if (m.config.middle) {
    const xs = cells.map((c) => c[0]);
    const ys = cells.map((c) => c[1]);
    if (Math.min(...xs) === -half && Math.max(...xs) === half && Math.min(...ys) === -half && Math.max(...ys) === half) s += 10;
  }
  if (m.config.harmony && cells.length === n * n && discarded === 0) s += 5;
  return s;
}

function advance(m: MatchState) {
  if (m.step === 'place' && m.next.length) {
    m.step = 'claim';
    return;
  }
  m.active++;
  m.step = 'place';
  if (m.active < m.row.length) return;
  // 줄 끝: 다음 줄이 지금 줄이 됨
  m.row = m.next;
  m.next = draw(m);
  m.active = 0;
  if (!m.row.length) return finish(m);
}

function finish(m: MatchState) {
  const scores = m.kingdoms.map((k, s) => finalScore(m, k, m.discarded[s]));
  m.roundScores.push(scores);
  log(m, { type: 'end', scores });
  m.status = m.round >= m.config.rounds ? 'match-over' : 'round-over';
}

export function applyMove(m: MatchState, seat: number, move: Move) {
  if (m.status !== 'playing') throw new MoveError('지금은 진행 중인 판이 없어요');
  if (seat !== currentSeat(m)) throw new MoveError('지금은 내 차례가 아니에요');
  if (move.type === 'claim') {
    if (m.step !== 'claim' && m.step !== 'claim-first') throw new MoveError('먼저 고른 도미노를 왕국에 놓아요');
    const slot = m.next[move.slot];
    if (!slot || slot.claim !== null) throw new MoveError('이미 누가 고른 도미노예요');
    slot.claim = seat;
    log(m, { type: 'claim', seat, domino: slot.domino });
    if (m.step === 'claim-first') {
      if (m.next.every((s) => s.claim !== null)) {
        m.row = m.next;
        m.next = draw(m);
        m.active = 0;
        m.step = 'place';
      }
      return;
    }
    return advance(m);
  }
  if (m.step !== 'place') throw new MoveError('지금은 다음 줄에서 도미노를 고를 때예요');
  const d = m.row[m.active].domino;
  const k = m.kingdoms[seat];
  const legal = legalPlacements(k, d, m.config.size);
  if (move.type === 'discard') {
    if (legal.length) throw new MoveError('놓을 수 있는 자리가 있으면 버릴 수 없어요');
    m.discarded[seat]++;
    log(m, { type: 'discard', seat, domino: d });
    return advance(m);
  }
  if (move.type !== 'place') throw new MoveError('할 수 없는 동작이에요');
  const ok = legal.some((p) => p.x1 === move.x1 && p.y1 === move.y1 && p.x2 === move.x2 && p.y2 === move.y2);
  if (!ok) throw new MoveError('그 자리에는 놓을 수 없어요. 성이나 같은 땅에 닿게, 왕국 크기 안에 놓아요');
  k[key(move.x1, move.y1)] = d.a;
  k[key(move.x2, move.y2)] = d.b;
  log(m, { type: 'place', seat, domino: d, at: { x1: move.x1, y1: move.y1, x2: move.x2, y2: move.y2 } });
  advance(m);
}

export function startNextRound(m: MatchState) {
  if (m.status !== 'round-over') throw new MoveError('아직 판이 끝나지 않았어요');
  m.round++;
  deal(m);
}

export function continueMatch(prev: MatchState, config: GameConfig, rng: () => number = Math.random): MatchState {
  const done = prev.roundScores.length;
  if (done >= config.rounds) throw new MoveError(`벌써 ${done}판을 마쳤어요. 판 수를 늘리면 이어서 할 수 있어요`);
  const m = newMatch(config, prev.players, rng);
  m.round = done + 1;
  m.roundScores = prev.roundScores.map((r) => [...r]);
  return m;
}

export function matchTotals(m: Pick<MatchState, 'roundScores' | 'players' | 'status' | 'kingdoms' | 'config' | 'discarded'>): number[] {
  const t = Array(m.players).fill(0);
  for (const r of m.roundScores) r.forEach((v, i) => (t[i] += v));
  if (m.status === 'playing') m.kingdoms.forEach((k, s) => (t[s] += scoreKingdom(k).total));
  return t;
}

/** 대신 진행: 가장 점수가 많이 오르는 자리 / 번호가 작은 도미노 */
export function autoMove(m: MatchState, seat: number): Move {
  if (m.step !== 'place') return { type: 'claim', slot: m.next.findIndex((s) => s.claim === null) };
  const d = m.row[m.active].domino;
  const k = m.kingdoms[seat];
  const legal = legalPlacements(k, d, m.config.size);
  if (!legal.length) return { type: 'discard' };
  let best = legal[0];
  let bestScore = -1;
  for (const p of legal) {
    const s = scoreKingdom({ ...k, [key(p.x1, p.y1)]: d.a, [key(p.x2, p.y2)]: d.b }).total;
    if (s > bestScore) {
      bestScore = s;
      best = p;
    }
  }
  return { type: 'place', ...best };
}
