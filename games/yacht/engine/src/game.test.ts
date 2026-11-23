import { describe, expect, it } from 'vitest';
import { CLASSIC, catsFor } from './config';
import { MatchState, actors, applyMove, autoMove, cardTotal, newMatch, scoreFor } from './game';
import { viewFor } from './view';

const X = { scoring: 'extended' as const };

describe('족보 점수', () => {
  it('기본 요트', () => {
    expect(scoreFor(CLASSIC, 'threes', [3, 3, 1, 3, 5])).toBe(9);
    expect(scoreFor(CLASSIC, 'choice', [6, 6, 5, 4, 1])).toBe(22);
    expect(scoreFor(CLASSIC, 'fourKind', [2, 2, 2, 2, 6])).toBe(14);
    expect(scoreFor(CLASSIC, 'fourKind', [2, 2, 2, 6, 6])).toBe(0);
    expect(scoreFor(CLASSIC, 'fullHouse', [2, 2, 5, 5, 5])).toBe(19);
    expect(scoreFor(CLASSIC, 'smallStraight', [1, 3, 2, 4, 6])).toBe(15);
    expect(scoreFor(CLASSIC, 'smallStraight', [1, 3, 2, 5, 6])).toBe(0);
    expect(scoreFor(CLASSIC, 'largeStraight', [2, 3, 4, 5, 6])).toBe(30);
    expect(scoreFor(CLASSIC, 'yacht', [4, 4, 4, 4, 4])).toBe(50);
  });
  it('확장 족보: 풀하우스 25, 스트레이트 30/40, 트리플', () => {
    expect(scoreFor(X, 'fullHouse', [2, 2, 5, 5, 5])).toBe(25);
    expect(scoreFor(X, 'smallStraight', [3, 4, 5, 6, 6])).toBe(30);
    expect(scoreFor(X, 'largeStraight', [1, 2, 3, 4, 5])).toBe(40);
    expect(scoreFor(X, 'threeKind', [4, 4, 4, 1, 2])).toBe(15);
    expect(catsFor(X)).toContain('threeKind');
    expect(catsFor(CLASSIC)).not.toContain('threeKind');
  });
  it('위쪽 보너스: 63점 이상이면 +35', () => {
    const card = { ones: 3, twos: 6, threes: 9, fours: 12, fives: 15, sixes: 18 };
    expect(cardTotal(CLASSIC, { card, yachtBonus: 0 })).toBe(63 + 35);
    expect(cardTotal(CLASSIC, { card: { ...card, sixes: 12 }, yachtBonus: 0 })).toBe(57);
  });
});

describe('진행', () => {
  it('먼저 굴려야 적을 수 있고, 굴리기 횟수 제한', () => {
    const m = newMatch(CLASSIC, 2, () => 0.3);
    const t = m.turn;
    expect(() => applyMove(m, t, { type: 'score', cat: 'choice' })).toThrow('먼저');
    applyMove(m, t, { type: 'roll' });
    applyMove(m, t, { type: 'roll', hold: [true, false, false, false, false] });
    applyMove(m, t, { type: 'roll', hold: [true, true, false, false, false] });
    expect(() => applyMove(m, t, { type: 'roll' })).toThrow('3번');
    const kept = m.seats[t].dice[0];
    expect(m.log.filter((e) => e.type === 'roll').every((e) => e.type === 'roll' && e.dice[0] === kept)).toBe(true);
    applyMove(m, t, { type: 'score', cat: 'choice' });
    expect(m.turn).toBe(1 - t);
    expect(() => applyMove(m, t, { type: 'roll' })).toThrow('차례');
  });
  it('모두 동시에: 이번 차례를 다 적어야 다음 차례', () => {
    const m = newMatch({ ...CLASSIC, mode: 'together' }, 3, () => 0.5);
    expect(actors(m)).toEqual([0, 1, 2]);
    applyMove(m, 1, { type: 'roll' });
    applyMove(m, 1, { type: 'score', cat: 'choice' });
    expect(actors(m)).toEqual([0, 2]);
    expect(() => applyMove(m, 1, { type: 'roll' })).toThrow('기다려');
    for (const s of [0, 2]) {
      applyMove(m, s, { type: 'roll' });
      applyMove(m, s, { type: 'score', cat: 'choice' });
    }
    expect(actors(m)).toEqual([0, 1, 2]);
    expect(m.step).toBe(1);
  });
  it('자동 진행만으로 끝까지 → 점수표가 다 차고 끝남', () => {
    for (const mode of ['turns', 'together'] as const) {
      const m: MatchState = newMatch({ ...CLASSIC, mode, scoring: 'extended' }, 3, () => 0.7);
      let guard = 0;
      while (m.status === 'playing' && guard++ < 1000) {
        const s = actors(m)[0];
        applyMove(m, s, autoMove(m, s));
      }
      expect(m.status).toBe('match-over');
      expect(m.seats.every((s) => Object.keys(s.card).length === 13)).toBe(true);
      expect(viewFor(m, 0).totals.length).toBe(3);
    }
  });
});

describe('남길 주사위 고르기 (hold)', () => {
  it('굴린 뒤 고르면 모두에게 보이고, 그대로 굴림', () => {
    const m = newMatch(CLASSIC, 2, () => 0);
    const p = m.turn;
    expect(() => applyMove(m, p, { type: 'hold', hold: [true, false, false, false, false] })).toThrow();
    applyMove(m, p, { type: 'roll' });
    const first = [...m.seats[p].dice];
    applyMove(m, p, { type: 'hold', hold: [true, true, false, false, false] });
    const v = viewFor(m, 1 - p);
    expect(v.seats[p].held).toEqual([true, true, false, false, false]);
    expect(v.seats[p].picked).toBe(true);
    applyMove(m, p, { type: 'roll', hold: m.seats[p].held });
    expect(m.seats[p].dice.slice(0, 2)).toEqual(first.slice(0, 2));
    expect(m.seats[p].picked).toBe(false);
    expect(m.seats[p].rolled).toBe(2);
  });
});
