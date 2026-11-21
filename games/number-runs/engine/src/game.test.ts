import { describe, expect, it } from 'vitest';
import { CLASSIC, tileTotal } from './config';
import { MatchState, applyMove, autoMove, newMatch } from './game';
import { Tile, analyze, arrange, setValue } from './sets';

const T = (color: number, n: number, k = 0): Tile => ({ id: `${color}-${n}-${k}`, n, color });
const J = (k = 0): Tile => ({ id: `J${k}`, n: 0, color: -1 });

describe('묶음', () => {
  it('원작 106장', () => expect(tileTotal(CLASSIC)).toBe(106));
  it('줄·무리·조커', () => {
    expect(analyze([T(0, 3), T(0, 4), T(0, 5)], 13, 4)?.kind).toBe('run');
    expect(analyze([T(0, 7), T(1, 7), T(2, 7), T(3, 7)], 13, 4)?.kind).toBe('group');
    expect(analyze([T(0, 7), T(0, 7, 1), T(2, 7)], 13, 4)).toBeNull();
    expect(analyze([T(0, 3), J(), T(0, 5)], 13, 4)?.values).toEqual([3, 4, 5]);
    expect(analyze([T(0, 12), T(0, 13), J()], 13, 4)).toBeNull();
    expect(arrange([T(0, 5), J(), T(0, 3)], 13, 4).map((t) => t.n)).toEqual([3, 0, 5]);
    expect(setValue([T(1, 10), T(2, 10), J()], 13, 4)).toBe(30);
  });
});

function setup(hands: Tile[][], over = {}): MatchState {
  const m = newMatch({ ...CLASSIC, ...over }, hands.length, () => 0.2);
  m.hands = hands;
  m.turn = 0;
  return m;
}

describe('진행', () => {
  it('처음 등록은 30점 이상, 손 타일로만', () => {
    const m = setup([[T(0, 1), T(0, 2), T(0, 3), T(1, 10), T(2, 10), T(3, 10), T(1, 1)], [T(0, 9)]]);
    expect(() => applyMove(m, 0, { type: 'play', table: [['0-1-0', '0-2-0', '0-3-0']] })).toThrow('30 이상');
    applyMove(m, 0, { type: 'play', table: [['0-1-0', '0-2-0', '0-3-0'], ['1-10-0', '2-10-0', '3-10-0']] });
    expect(m.opened[0]).toBe(true);
    expect(m.hands[0].map((t) => t.id)).toEqual(['1-1-0']);
  });
  it('등록 뒤에는 테이블을 다시 짜도 되지만, 테이블 타일은 모두 남아야', () => {
    const m = setup([[T(0, 4), T(1, 2)], [T(0, 9)]], { initialMeld: 0 });
    m.table = [[T(0, 1), T(0, 2), T(0, 3)], [T(2, 2), T(3, 2), T(1, 2, 1)]];
    expect(() => applyMove(m, 0, { type: 'play', table: [['0-1-0', '0-2-0', '0-3-0', '0-4-0']] })).toThrow('남아야');
    applyMove(m, 0, { type: 'play', table: [['0-1-0', '0-2-0', '0-3-0', '0-4-0'], ['2-2-0', '3-2-0', '1-2-1']] });
    expect(m.hands[0]).toHaveLength(1);
  });
  it('내 타일을 하나도 안 내면 안 됨, 가져오기로 넘김', () => {
    const m = setup([[T(0, 4)], [T(0, 9)]], { initialMeld: 0 });
    m.table = [[T(0, 1), T(0, 2), T(0, 3)]];
    expect(() => applyMove(m, 0, { type: 'play', table: [['0-1-0', '0-2-0', '0-3-0']] })).toThrow('1장 이상');
    const before = m.pool.length;
    applyMove(m, 0, { type: 'draw' });
    expect(m.hands[0]).toHaveLength(2);
    expect(m.pool.length).toBe(before - 1);
  });
  it('손을 다 비우면 승리, 남은 타일 점수 (조커 30)', () => {
    const m = setup([[T(0, 4)], [T(1, 9), J()]], { initialMeld: 0 });
    m.table = [[T(0, 1), T(0, 2), T(0, 3)]];
    applyMove(m, 0, { type: 'play', table: [['0-1-0', '0-2-0', '0-3-0', '0-4-0']] });
    expect(m.status).toBe('match-over');
    expect(m.roundScores[0]).toEqual([39, -39]);
  });
  it('자동 수(가져오기)로 더미가 비면 막혀서 끝', () => {
    const m = newMatch(CLASSIC, 4, () => 0.5);
    for (let i = 0; i < 1000 && m.status === 'playing'; i++) applyMove(m, m.turn, autoMove(m, m.turn));
    expect(m.status).toBe('match-over');
  });
});
