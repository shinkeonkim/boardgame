/**
 * 조각 21개 (1칸 1 · 2칸 1 · 3칸 2 · 4칸 5 · 5칸 12 = 89칸). 모양은 수학의 폴리오미노 그대로 (원작 그림 아님).
 * 각 조각의 모든 회전·뒤집기 모양을 미리 만들어 둔다.
 */
export type Cell = [number, number];

const RAW: Record<string, string[]> = {
  I1: ['#'],
  I2: ['##'],
  I3: ['###'],
  V3: ['#.', '##'],
  I4: ['####'],
  L4: ['#..', '###'],
  T4: ['.#.', '###'],
  O4: ['##', '##'],
  S4: ['.##', '##.'],
  I5: ['#####'],
  L5: ['#...', '####'],
  Y5: ['.#..', '####'],
  N5: ['..##', '###.'],
  P5: ['##', '##', '#.'],
  U5: ['#.#', '###'],
  V5: ['#..', '#..', '###'],
  W5: ['#..', '##.', '.##'],
  Z5: ['##.', '.#.', '.##'],
  T5: ['###', '.#.', '.#.'],
  F5: ['.##', '##.', '.#.'],
  X5: ['.#.', '###', '.#.'],
};

export interface PieceDef {
  id: string;
  size: number;
  /** 서로 다른 모양들 (회전·뒤집기), 각 모양은 (0,0) 기준으로 정규화 */
  orients: Cell[][];
}

function parse(rows: string[]): Cell[] {
  const out: Cell[] = [];
  rows.forEach((r, y) => [...r].forEach((ch, x) => ch === '#' && out.push([x, y])));
  return out;
}
function norm(cells: Cell[]): Cell[] {
  const mx = Math.min(...cells.map((c) => c[0]));
  const my = Math.min(...cells.map((c) => c[1]));
  return cells.map(([x, y]) => [x - mx, y - my] as Cell).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
}
const key = (cells: Cell[]) => cells.map((c) => c.join(',')).join(';');

export function orientations(base: Cell[]): Cell[][] {
  const seen = new Map<string, Cell[]>();
  let cur = base;
  for (let f = 0; f < 2; f++) {
    for (let r = 0; r < 4; r++) {
      const n = norm(cur);
      seen.set(key(n), n);
      cur = cur.map(([x, y]) => [-y, x] as Cell); // 90도 회전
    }
    cur = cur.map(([x, y]) => [-x, y] as Cell); // 뒤집기
  }
  return [...seen.values()];
}

export const PIECES: PieceDef[] = Object.entries(RAW).map(([id, rows]) => {
  const cells = parse(rows);
  return { id, size: cells.length, orients: orientations(cells) };
});

export const pieceById = (id: string) => PIECES.find((p) => p.id === id);
export const TOTAL_SQUARES = PIECES.reduce((a, p) => a + p.size, 0);
