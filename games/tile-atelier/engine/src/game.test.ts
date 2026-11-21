import { describe, expect, it } from 'vitest';
import { CLASSIC, wallColor, wallCol } from './config';
import { Board, FIRST, MatchState, actors, adjacency, applyMove, autoMove, bonusOf, newMatch } from './game';

function m2(over = {}): MatchState {
  const m = newMatch({ ...CLASSIC, ...over }, 2, () => 0.3);
  m.turn = 0;
  return m;
}

describe('벽', () => {
  it('정해진 무늬: 줄마다 한 칸씩 밀림', () => {
    expect(wallColor(5, 0, 0)).toBe(0);
    expect(wallColor(5, 1, 1)).toBe(0);
    expect(wallCol(5, 2, 3)).toBe(0);
  });
  it('인접 점수: 혼자 1, 가로·세로 이어진 만큼', () => {
    const w: (number | null)[][] = Array.from({ length: 5 }, () => Array(5).fill(null));
    w[0][0] = 0;
    expect(adjacency(w, 0, 0)).toBe(1);
    w[0][1] = 1;
    w[1][1] = 0;
    expect(adjacency(w, 0, 1)).toBe(2 + 2);
  });
});

describe('진행', () => {
  it('공장에서 한 색을 모두 가져오고 나머지는 가운데로, 줄을 넘치면 바닥', () => {
    const m = m2();
    m.factories[0] = [1, 1, 1, 2];
    applyMove(m, 0, { type: 'take', source: 0, color: 1, line: 1 });
    expect(m.boards[0].lines[1]).toEqual({ color: 1, count: 2 });
    expect(m.boards[0].floor).toEqual([1]);
    expect(m.center).toEqual([FIRST, 2]);
  });
  it('가운데에서 처음 가져가면 첫 플레이어 표시가 바닥으로', () => {
    const m = m2();
    m.center = [FIRST, 3, 3];
    applyMove(m, 0, { type: 'take', source: -1, color: 3, line: 2 });
    expect(m.boards[0].floor).toEqual([FIRST]);
    expect(m.nextFirst).toBe(0);
  });
  it('다른 색이 있는 줄·벽에 이미 있는 색은 안 됨', () => {
    const m = m2();
    m.boards[0].lines[2] = { color: 4, count: 1 };
    m.factories[0] = [1, 1, 1, 1];
    expect(() => applyMove(m, 0, { type: 'take', source: 0, color: 1, line: 2 })).toThrow('다른 색');
    m.boards[0].wall[0][wallCol(5, 0, 1)] = 1;
    expect(() => applyMove(m, 0, { type: 'take', source: 0, color: 1, line: 0 })).toThrow('벽');
  });
  it('공장·가운데가 비면 벽에 놓고 점수·바닥 감점, 다음 판', () => {
    const m = m2();
    m.factories = m.factories.map(() => []);
    m.factories[0] = [2];
    m.center = [];
    m.boards[0].floor = [5 as never];
    m.boards[0].floor = [];
    applyMove(m, 0, { type: 'take', source: 0, color: 2, line: 0 });
    expect(m.boards[0].wall[0][wallCol(5, 0, 2)]).toBe(2);
    expect(m.boards[0].score).toBe(1);
    expect(m.stage).toBe(2);
  });
  it('끝 보너스: 가로 2 · 세로 7 · 색 10', () => {
    const b: Board = { lines: [], wall: Array.from({ length: 5 }, (_, r) => Array.from({ length: 5 }, (_, c) => wallColor(5, r, c))), floor: [], score: 0 };
    expect(bonusOf(CLASSIC, b)).toEqual({ rows: 5, cols: 5, colors: 5, points: 10 + 35 + 50 });
  });
  it('자유 벽: 판 끝에 칸을 직접 고름 (동시에)', () => {
    const m = m2({ freeWall: true });
    m.factories = m.factories.map(() => []);
    m.factories[0] = [2];
    m.center = [];
    applyMove(m, 0, { type: 'take', source: 0, color: 2, line: 0 });
    expect(m.phase).toBe('wall');
    expect(actors(m)).toEqual([0]);
    applyMove(m, 0, { type: 'wall', row: 0, col: 3 });
    expect(m.boards[0].wall[0][3]).toBe(2);
    expect(m.phase).toBe('draft');
  });
  it('자동 수로 끝까지 (원작·자유 벽·6색)', () => {
    for (const cfg of [CLASSIC, { ...CLASSIC, freeWall: true }, { ...CLASSIC, colors: 6, tilesPerColor: 22 }]) {
      const m = newMatch(cfg, 4, () => 0.5);
      for (let i = 0; i < 4000 && m.status === 'playing'; i++) {
        const a = actors(m)[0];
        applyMove(m, a, autoMove(m, a));
      }
      expect(m.status).toBe('match-over');
    }
  });
});
