import { describe, expect, it } from 'vitest';
import { CLASSIC } from './config';
import { Card, MatchState, actors, applyMove, autoMove, newMatch } from './game';
import { viewFor } from './view';

const C = (id: string, n: number): Card => ({ id, n });
function setup(hands: Card[][], middle: Card[]): MatchState {
  const m = newMatch(CLASSIC, hands.length, () => 0.2);
  m.hands = hands;
  m.middle = middle;
  m.turn = 0;
  return m;
}

describe('셋 찾기', () => {
  it('같은 숫자 3장을 이어 뒤집으면 세트, 다른 숫자가 나오면 차례 끝', () => {
    const m = setup([[C('a', 3), C('b', 3), C('c', 9)], [C('d', 3), C('e', 11)], [C('f', 5)]], [C('g', 2)]);
    applyMove(m, 0, { type: 'reveal', seat: 0, end: 'low' });
    applyMove(m, 0, { type: 'reveal', seat: 0, end: 'low' }); // 다음 작은 카드
    applyMove(m, 0, { type: 'reveal', seat: 1, end: 'low' });
    expect(m.trios[0]).toEqual([3]);
    expect(m.hands[0].map((c) => c.id)).toEqual(['c']);
    expect(m.turn).toBe(1);
    applyMove(m, 1, { type: 'reveal', seat: 1, end: 'low' });
    applyMove(m, 1, { type: 'reveal', seat: -1, idx: 0 });
    expect(m.turn).toBe(2);
    expect(m.lastMiss.map((f) => f.n)).toEqual([11, 2]);
  });
  it('7 세 장이면 바로 승리', () => {
    const m = setup([[C('a', 7), C('b', 7)], [C('c', 7)], [C('d', 1)]], []);
    applyMove(m, 0, { type: 'reveal', seat: 0, end: 'low' });
    applyMove(m, 0, { type: 'reveal', seat: 0, end: 'high' });
    applyMove(m, 0, { type: 'reveal', seat: 1, end: 'low' });
    expect(m.status).toBe('match-over');
    expect(m.winners).toEqual([0]);
  });
  it('카드 id는 숫자를 드러내지 않고, 남의 손패 숫자는 안 보임', () => {
    const m = newMatch(CLASSIC, 4, () => 0.5);
    const v = viewFor(m, 0);
    expect(v.hand).toHaveLength(7);
    expect(v.middle).toHaveLength(8);
    expect(JSON.stringify(v.hands)).not.toMatch(/"n"/);
    expect(m.hands[1][0].id).not.toMatch(/^\d+-/);
  });
  it('자동 진행 수는 언제나 둘 수 있는 수', () => {
    const m = newMatch({ ...CLASSIC, goal: 2 }, 4, () => 0.31);
    for (let g = 0; g < 500 && m.status === 'playing'; g++) {
      const s = actors(m)[0];
      expect(() => applyMove(m, s, autoMove(m, s))).not.toThrow();
    }
  });
});
