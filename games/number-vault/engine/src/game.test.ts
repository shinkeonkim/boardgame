import { describe, expect, it } from 'vitest';
import { CLASSIC, tileCount, validateConfig } from './config';
import { MatchState, Tile, applyMove, autoMove, insertSorted, keyOf, newMatch } from './game';
import { candidates, viewFor } from './view';

const T = (n: number, color: 0 | 1, revealed = false): Tile => ({ id: `${color ? 'w' : 'b'}${n}`, n, color, revealed });

function setup(rows: Tile[][], pool: Tile[] = [T(9, 0)], over = {}): MatchState {
  const m = newMatch({ ...CLASSIC, ...over }, rows.length, () => 0.3);
  m.rows = rows;
  m.pool = pool;
  m.turn = 0;
  m.phase = pool.length ? 'draw' : 'guess';
  return m;
}

describe('타일', () => {
  it('원작 24장, 정렬은 숫자 → 같으면 검정 먼저', () => {
    expect(tileCount(CLASSIC)).toBe(24);
    expect(keyOf(T(3, 0))).toBeLessThan(keyOf(T(3, 1)));
    const row = [T(1, 0), T(3, 1), T(7, 0)];
    expect(insertSorted(row, T(3, 0))).toBe(1);
    expect(insertSorted(row, T(8, 1))).toBe(3);
  });
  it('처음 나눈 줄은 오름차순', () => {
    const m = newMatch(CLASSIC, 3, () => 0.7);
    for (const row of m.rows) for (let i = 1; i < row.length; i++) expect(keyOf(row[i])).toBeGreaterThan(keyOf(row[i - 1]));
    expect(validateConfig({ ...CLASSIC, maxNumber: 5, startTiles: 6 }, 4)[0]).toMatch('모자라요');
  });
});

describe('진행', () => {
  it('가져오기 → 맞히면 공개되고 계속/멈추기, 멈추면 뽑은 타일은 가려진 채 줄에', () => {
    const m = setup([[T(2, 0), T(6, 1)], [T(4, 0), T(8, 1)]]);
    expect(() => applyMove(m, 0, { type: 'guess', target: 1, tileId: 'b4', value: 4 })).toThrow('먼저 타일');
    applyMove(m, 0, { type: 'draw', color: 0 });
    expect(m.pending?.id).toBe('b9');
    applyMove(m, 0, { type: 'guess', target: 1, tileId: 'b4', value: 4 });
    expect(m.rows[1][0].revealed).toBe(true);
    expect(m.phase).toBe('continue');
    applyMove(m, 0, { type: 'stop' });
    expect(m.rows[0].map((t) => t.id)).toEqual(['b2', 'w6', 'b9']);
    expect(m.rows[0][2].revealed).toBe(false);
    expect(m.turn).toBe(1);
  });
  it('틀리면 뽑은 타일이 공개된 채 줄에 들어가고 차례 끝', () => {
    const m = setup([[T(2, 0), T(6, 1)], [T(4, 0), T(8, 1)]]);
    applyMove(m, 0, { type: 'draw' });
    applyMove(m, 0, { type: 'guess', target: 1, tileId: 'w8', value: 7 });
    expect(m.rows[0].find((t) => t.id === 'b9')!.revealed).toBe(true);
    expect(m.misses).toEqual([{ target: 1, tileId: 'w8', value: 7 }]);
    expect(m.turn).toBe(1);
  });
  it('더미가 비었으면 바로 맞히고, 틀리면 내 타일을 골라 공개', () => {
    const m = setup([[T(2, 0), T(6, 1)], [T(4, 0), T(8, 1)]], []);
    applyMove(m, 0, { type: 'guess', target: 1, tileId: 'w8', value: 7 });
    expect(m.phase).toBe('reveal');
    applyMove(m, 0, { type: 'reveal', tileId: 'w6' });
    expect(m.rows[0][1].revealed).toBe(true);
  });
  it('모두 공개되면 탈락, 마지막 한 명 승리', () => {
    const m = setup([[T(2, 0)], [T(4, 0, true), T(8, 1)]]);
    applyMove(m, 0, { type: 'draw' });
    applyMove(m, 0, { type: 'guess', target: 1, tileId: 'w8', value: 8 });
    expect(m.status).toBe('match-over');
    expect(m.winners).toEqual([0]);
  });
  it('남의 가려진 타일은 숫자가 안 보이고 색만', () => {
    const m = setup([[T(2, 0)], [T(4, 0), T(8, 1)]]);
    const v = viewFor(m, 0);
    expect(v.rows[1].map((t) => t.n)).toEqual([null, null]);
    expect(v.rows[1].map((t) => t.color)).toEqual([0, 1]);
    expect(v.rows[0][0].n).toBe(2);
  });
  it('추리: 색·순서·본 타일·틀린 기록으로 후보가 좁혀진다', () => {
    const m = setup([[T(5, 0), T(7, 1)], [T(4, 0, true), T(6, 0), T(9, 1, true)]]);
    m.misses.push({ target: 1, tileId: 'b6', value: 8 });
    const cand = candidates(viewFor(m, 0), 0, 1).get('b6')!;
    // 검정, 4 < x < 9(하양이므로 9 검정까지), 5는 내가 가짐, 8은 틀렸음 → 6, 7, 9
    expect(cand).toEqual([6, 7, 9]);
  });
  it('조커: 뽑으면 자리를 고른다', () => {
    const m = setup([[T(2, 0), T(6, 1)], [T(4, 0), T(10, 1)]], [{ id: 'j0', n: -1, color: 0, revealed: false }], { jokers: 1 });
    applyMove(m, 0, { type: 'draw' });
    expect(m.phase).toBe('place');
    applyMove(m, 0, { type: 'place', index: 1 });
    applyMove(m, 0, { type: 'guess', target: 1, tileId: 'b4', value: 4 });
    applyMove(m, 0, { type: 'stop' });
    expect(m.rows[0].map((t) => t.id)).toEqual(['b2', 'j0', 'w6']);
  });
  it('자동 수로 끝까지', () => {
    const m = newMatch({ ...CLASSIC, jokers: 2 }, 4, () => 0.2);
    for (let i = 0; i < 3000 && m.status === 'playing'; i++) applyMove(m, m.turn, autoMove(m, m.turn));
    expect(m.status).toBe('match-over');
  });
});
