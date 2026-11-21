/** 타일과 묶음 판정 (줄: 같은 색 연속 3장 이상 · 무리: 같은 숫자 다른 색 3~4장, 조커는 아무거나) */
export interface Tile {
  id: string;
  /** 0이면 조커 */
  n: number;
  color: number;
}

export const isJoker = (t: Tile) => t.n === 0;

export type SetKind = 'run' | 'group';

/** 유효하면 종류와 각 타일이 나타내는 숫자(점수용), 아니면 null */
export function analyze(tiles: Tile[], maxNumber: number, colors: number): { kind: SetKind; values: number[] } | null {
  if (tiles.length < 3) return null;
  const real = tiles.filter((t) => !isJoker(t));
  if (!real.length) return tiles.length <= maxNumber ? { kind: 'run', values: tiles.map((_, i) => i + 1) } : null;
  // 무리: 같은 숫자, 색이 모두 다름, 최대 색 수
  if (tiles.length <= Math.min(4, colors) && real.every((t) => t.n === real[0].n) && new Set(real.map((t) => t.color)).size === real.length) {
    return { kind: 'group', values: tiles.map(() => real[0].n) };
  }
  // 줄: 놓인 순서대로 연속, 같은 색 (조커는 빈자리)
  if (real.every((t) => t.color === real[0].color)) {
    const firstReal = tiles.findIndex((t) => !isJoker(t));
    const start = tiles[firstReal].n - firstReal;
    if (start >= 1 && start + tiles.length - 1 <= maxNumber && tiles.every((t, i) => isJoker(t) || t.n === start + i)) {
      return { kind: 'run', values: tiles.map((_, i) => start + i) };
    }
  }
  return null;
}

export const setValue = (tiles: Tile[], maxNumber: number, colors: number) => analyze(tiles, maxNumber, colors)?.values.reduce((a, b) => a + b, 0) ?? 0;

/** 줄은 화면에서 정렬해 보여 주기 위해: 같은 색이면 숫자순으로 (조커는 빈자리 채우기) — 가능한 정렬을 찾아 돌려줌 */
export function arrange(tiles: Tile[], maxNumber: number, colors: number): Tile[] {
  if (analyze(tiles, maxNumber, colors)) return tiles;
  const real = tiles.filter((t) => !isJoker(t)).sort((a, b) => a.n - b.n);
  const jokers = tiles.filter(isJoker);
  if (!real.length) return tiles;
  // 같은 숫자 무리
  if (real.every((t) => t.n === real[0].n)) return [...real, ...jokers];
  // 줄: 빈 숫자에 조커를 끼워 넣고 남은 조커는 뒤(넘치면 앞)
  const out: Tile[] = [];
  const js = [...jokers];
  for (let i = 0; i < real.length; i++) {
    if (i > 0) for (let k = real[i - 1].n + 1; k < real[i].n && js.length; k++) out.push(js.pop()!);
    out.push(real[i]);
  }
  while (js.length) {
    const last = out.filter((t) => !isJoker(t)).pop()!;
    const endN = last.n + (out.length - out.indexOf(last) - 1);
    if (endN < maxNumber) out.push(js.pop()!);
    else out.unshift(js.pop()!);
  }
  return out;
}
