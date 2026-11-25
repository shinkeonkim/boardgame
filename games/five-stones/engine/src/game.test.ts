import { describe, expect, it } from 'vitest';
import { CLASSIC } from './config';
import { applyMove, matchTotals, newMatch, startNextRound, winningLine } from './game';
import { viewFor } from './view';

const play = (m: ReturnType<typeof newMatch>, cells: [number, number][]) => cells.forEach(([x, y]) => applyMove(m, m.turn, { type: 'place', x, y }));

describe('오목', () => {
  it('흑이 먼저, 다섯을 이으면 이기고 그 줄을 보여 줌', () => {
    const m = newMatch(CLASSIC, 2, () => 0);
    expect(m.turn).toBe(m.black);
    play(m, [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [2, 1], [3, 0], [3, 1], [4, 0]]);
    expect(m.status).toBe('match-over');
    expect(m.winLine).toHaveLength(5);
    expect(matchTotals(m)[m.black]).toBe(1);
  });
  it('딱 다섯 규칙: 여섯은 이기지 않음', () => {
    const b = Array(15 * 15).fill(-1);
    for (const x of [0, 1, 2, 4, 5]) b[x] = 0;
    b[3] = 0;
    expect(winningLine(b, 15, 3, 0, true)).toBeNull();
    expect(winningLine(b, 15, 3, 0, false)).toHaveLength(6);
  });
  it('이미 둔 자리·차례 아님·판 밖은 거절', () => {
    const m = newMatch(CLASSIC, 2, () => 0);
    applyMove(m, m.turn, { type: 'place', x: 7, y: 7 });
    expect(() => applyMove(m, m.turn, { type: 'place', x: 7, y: 7 })).toThrow('이미');
    expect(() => applyMove(m, 1 - m.turn, { type: 'place', x: 1, y: 1 })).toThrow('차례');
    expect(() => applyMove(m, m.turn, { type: 'place', x: 15, y: 0 })).toThrow('판 밖');
  });
  it('여러 판이면 흑백을 바꾸고, 과반을 이기면 끝', () => {
    const m = newMatch({ ...CLASSIC, rounds: 3 }, 2, () => 0);
    const b0 = m.black;
    applyMove(m, 1 - m.turn, { type: 'resign' });
    expect(m.status).toBe('round-over');
    startNextRound(m);
    expect(m.black).toBe(1 - b0);
    applyMove(m, 1 - b0, { type: 'resign' });
    expect(m.status).toBe('match-over');
    expect(viewFor(m, 0).totals).toEqual(matchTotals(m));
  });
});
