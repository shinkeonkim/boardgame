import { describe, expect, it } from 'vitest';
import { CLASSIC, colorOwner } from './config';
import { MatchState, actors, applyMove, autoMove, legalPlacements, newMatch, placeProblem, seatScores } from './game';
import { PIECES, TOTAL_SQUARES, pieceById } from './pieces';

describe('조각', () => {
  it('21개 · 89칸 · 모양 수 (X 1, F 8 …)', () => {
    expect(PIECES).toHaveLength(21);
    expect(TOTAL_SQUARES).toBe(89);
    expect(pieceById('X5')!.orients).toHaveLength(1);
    expect(pieceById('F5')!.orients).toHaveLength(8);
    expect(pieceById('I2')!.orients).toHaveLength(2);
  });
});

describe('규칙', () => {
  const m4 = (): MatchState => newMatch(CLASSIC, 4, () => 0.2);
  it('첫 조각은 시작 칸을 덮어야', () => {
    const m = m4();
    expect(placeProblem(m, 0, { piece: 'I1', orient: 0, x: 5, y: 5 })).toMatch('시작 칸');
    applyMove(m, 0, { type: 'place', piece: 'I1', orient: 0, x: 0, y: 0 });
    expect(m.board[0]).toBe(0);
    expect(m.color).toBe(1);
  });
  it('같은 색은 모서리로만, 변이 닿으면 안 됨', () => {
    const m = m4();
    applyMove(m, 0, { type: 'place', piece: 'I1', orient: 0, x: 0, y: 0 });
    m.color = 0;
    expect(placeProblem(m, 0, { piece: 'I2', orient: 0, x: 1, y: 0 })).toMatch('변이');
    expect(placeProblem(m, 0, { piece: 'I2', orient: 0, x: 1, y: 1 })).toBeNull();
    expect(placeProblem(m, 0, { piece: 'I2', orient: 0, x: 3, y: 3 })).toMatch('모서리');
  });
  it('2명이면 한 사람이 두 색 (0·2 / 1·3), 3명이면 넷째 색을 돌아가며', () => {
    expect([0, 1, 2, 3].map((c) => colorOwner(CLASSIC, 2, c))).toEqual([0, 1, 0, 1]);
    const m = newMatch(CLASSIC, 3, () => 0.2);
    for (let k = 0; k < 3; k++) applyMove(m, actors(m)[0], autoMove(m, actors(m)[0]));
    expect(m.color).toBe(3);
    const first = actors(m)[0];
    applyMove(m, first, autoMove(m, first));
    for (let k = 0; k < 3; k++) applyMove(m, actors(m)[0], autoMove(m, actors(m)[0]));
    expect(actors(m)[0]).not.toBe(first);
  });
  it('점수: 남은 칸 −1, 모두 놓으면 +15 (마지막이 1칸이면 +5)', () => {
    const m = m4();
    m.remaining = [[], ['I1'], ['I5', 'X5'], []];
    m.lastPiece = ['I1', null, null, 'O4'];
    expect(seatScores(m)).toEqual([20, -1, -10, 15]);
  });
  it('둘이서 모드: 14×14 가운데 근처 시작', () => {
    const m = newMatch({ ...CLASSIC, mode: 'duo', size: 14 }, 2, () => 0.3);
    expect(legalPlacements(m, 0).length).toBeGreaterThan(10);
    expect(placeProblem(m, 0, { piece: 'I1', orient: 0, x: 4, y: 4 })).toBeNull();
  });
  it('자동 수로 끝까지 (4명·2명·둘이서·빠른 판)', () => {
    for (const [cfg, n] of [
      [CLASSIC, 4],
      [CLASSIC, 2],
      [{ ...CLASSIC, mode: 'duo', size: 14 }, 2],
      [{ ...CLASSIC, size: 14, pieceSet: 'small' }, 3],
    ] as const) {
      const m = newMatch(cfg, n, () => 0.5);
      for (let i = 0; i < 200 && m.status === 'playing'; i++) applyMove(m, actors(m)[0], autoMove(m, actors(m)[0]));
      expect(m.status).toBe('match-over');
    }
  });
});
