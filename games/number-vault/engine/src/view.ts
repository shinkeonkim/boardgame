import { GameConfig } from './config';
import { LogEntry, MatchState, Miss, Tile, actors, matchTotals } from './game';

/** 남에게 보이는 타일: 가려졌으면 숫자 null (색은 보임) */
export interface SeenTile {
  id: string;
  n: number | null;
  color: 0 | 1;
  revealed: boolean;
}

export interface GameView {
  config: GameConfig;
  players: number;
  round: number;
  status: MatchState['status'];
  phase: MatchState['phase'];
  turn: number;
  me: number;
  rows: SeenTile[][];
  poolCount: [number, number];
  /** 이번 차례에 뽑은 타일 (내 것이면 숫자까지, 남 것이면 색만) */
  pending: SeenTile | null;
  jokerAt: number | null;
  misses: Miss[];
  outOrder: number[];
  winners: number[];
  totals: number[];
  actors: number[];
  log: LogEntry[];
}

const hide = (t: Tile, show: boolean): SeenTile => ({ id: t.id, n: show || t.revealed ? t.n : null, color: t.color, revealed: t.revealed });

export function viewFor(m: MatchState, me: number): GameView {
  const over = m.status !== 'playing';
  return {
    config: m.config,
    players: m.players,
    round: m.round,
    status: m.status,
    phase: m.phase,
    turn: m.turn,
    me,
    rows: m.rows.map((row, s) => row.map((t) => hide(t, over || s === me))),
    poolCount: [m.pool.filter((t) => t.color === 0).length, m.pool.filter((t) => t.color === 1).length],
    pending: m.pending ? hide(m.pending, over || m.turn === me) : null,
    jokerAt: m.jokerAt,
    misses: m.config.showMisses || over ? m.misses : m.misses.filter((x) => x.target === me),
    outOrder: m.outOrder,
    winners: m.winners,
    totals: matchTotals(m),
    actors: actors(m),
    log: m.log.slice(-40),
  };
}

/**
 * 추리: seat가 볼 때 target 줄의 가려진 타일마다 가능한 숫자.
 *  - 색이 같은 것만, 내가 본 타일(내 타일·공개된 타일)은 제외, 그 타일에 틀렸던 숫자 제외
 *  - 줄은 왼쪽부터 오름차순(같은 숫자면 검정 먼저) — 앞뒤로 범위를 좁힌다 (조커는 건너뜀)
 */
export function candidates(v: Pick<GameView, 'config' | 'rows' | 'misses' | 'pending'>, seat: number, target: number): Map<string, number[]> {
  const c = v.config;
  const seen = new Set<string>();
  v.rows.forEach((row) => row.forEach((t) => t.n !== null && t.n >= 0 && seen.add(`${t.color}-${t.n}`)));
  if (v.pending && v.pending.n !== null && v.pending.n >= 0) seen.add(`${v.pending.color}-${v.pending.n}`);
  const row = v.rows[target];
  const key = (n: number, color: number) => n * 2 + color;
  const sets: number[][] = row.map((t) => {
    if (t.n !== null) return [t.n];
    const bad = new Set(v.misses.filter((x) => x.target === target && x.tileId === t.id).map((x) => x.value));
    const out: number[] = [];
    for (let n = 0; n <= c.maxNumber; n++) if (!seen.has(`${t.color}-${n}`) && !bad.has(n)) out.push(n);
    if (c.jokers > 0 && !bad.has(-1)) out.push(-1);
    return out;
  });
  // 오름차순 제약으로 좁히기 (조커 후보 -1은 제약 없음)
  for (let pass = 0; pass < 3; pass++) {
    let lo = -1;
    for (let i = 0; i < row.length; i++) {
      const nums = sets[i].filter((n) => n >= 0 && key(n, row[i].color) > lo);
      sets[i] = [...nums, ...(sets[i].includes(-1) ? [-1] : [])];
      if (nums.length && !sets[i].includes(-1)) lo = Math.min(...nums.map((n) => key(n, row[i].color)));
    }
    let hi = Infinity;
    for (let i = row.length - 1; i >= 0; i--) {
      const nums = sets[i].filter((n) => n >= 0 && key(n, row[i].color) < hi);
      sets[i] = [...nums, ...(sets[i].includes(-1) ? [-1] : [])];
      if (nums.length && !sets[i].includes(-1)) hi = Math.max(...nums.map((n) => key(n, row[i].color)));
    }
  }
  const out = new Map<string, number[]>();
  row.forEach((t, i) => {
    if (!t.revealed && t.n === null) out.set(t.id, sets[i].length ? sets[i] : [0]);
  });
  void seat;
  return out;
}
