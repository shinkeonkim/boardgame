import { describe, expect, it } from 'vitest';
import { CLASSIC } from './config';
import { MatchState, applyMove, autoMove, bidProblem, countFace, minCount, newMatch } from './game';
import { viewFor } from './view';

function setup(dice: number[][], over: Partial<typeof CLASSIC> = {}): MatchState {
  const m = newMatch({ ...CLASSIC, ...over }, dice.length, () => 0.1);
  m.dice = dice;
  m.counts = dice.map((d) => d.length);
  m.turn = 0;
  return m;
}

describe('호가 규칙', () => {
  it('올리기: 개수를 늘리거나, 같은 개수면 더 큰 숫자', () => {
    const m = setup([[2, 3], [4, 5]], { aceBids: false });
    applyMove(m, 0, { type: 'bid', count: 2, face: 3 });
    expect(bidProblem(m, 2, 2)).toMatch('3개 이상');
    expect(bidProblem(m, 2, 4)).toBeNull();
    expect(bidProblem(m, 3, 2)).toBeNull();
    expect(bidProblem(m, 5, 6)).toMatch('모두 4개');
  });
  it('페루 규칙: 1로 바꾸면 절반(올림), 1에서 돌아오면 두 배+1, 첫 호가는 1 금지', () => {
    const m = setup([[2, 3, 4], [4, 5, 6], [1, 1, 2]]);
    expect(minCount(m, 1)).toBeNull();
    applyMove(m, 0, { type: 'bid', count: 5, face: 4 });
    expect(minCount(m, 1)).toBe(3);
    applyMove(m, 1, { type: 'bid', count: 3, face: 1 });
    expect(minCount(m, 6)).toBe(7);
    expect(minCount(m, 1)).toBe(4);
  });
  it('1은 와일드 (1에 건 호가는 1만)', () => {
    const m = setup([[1, 3, 3], [1, 5], [3]]);
    expect(countFace(m, 3)).toBe(5);
    expect(countFace(m, 1)).toBe(2);
    const k = setup([[1, 3, 3], [1, 5], [3]], { wildOnes: false, aceBids: false });
    expect(countFace(k, 3)).toBe(3);
  });
});

describe('거짓말·딱 맞다', () => {
  it('호가가 참이면 부른 사람이 하나 잃고, 그 사람이 다음 판을 시작', () => {
    const m = setup([[3, 3], [3, 1], [6]]);
    applyMove(m, 0, { type: 'bid', count: 3, face: 3 });
    applyMove(m, 1, { type: 'challenge' });
    expect(m.reveal).toMatchObject({ actual: 4, loser: 1, lost: 1 });
    expect(m.counts).toEqual([2, 1, 1]);
    expect(m.phase).toBe('reveal');
    expect(m.turn).toBe(1);
    expect(() => applyMove(m, 1, { type: 'bid', count: 1, face: 2 })).toThrow('굴려');
    applyMove(m, 1, { type: 'roll' });
    expect(m.phase).toBe('bid');
    expect(m.dice.map((d) => d.length)).toEqual([2, 1, 1]);
  });
  it('거짓이면 건 사람이 잃음, 딱 맞으면 하나 되찾음', () => {
    const m = setup([[2, 2], [5, 5], [6]]);
    applyMove(m, 0, { type: 'bid', count: 3, face: 2 });
    applyMove(m, 1, { type: 'challenge' });
    expect(m.reveal!.loser).toBe(0);
    const k = setup([[2, 2], [5, 4], [6]]);
    k.counts = [2, 2, 1];
    applyMove(k, 0, { type: 'bid', count: 2, face: 2 });
    applyMove(k, 1, { type: 'exact' });
    expect(k.reveal!.gained).toBe(true);
    expect(k.counts[1]).toBe(3);
  });
  it('주사위를 다 잃으면 탈락, 마지막 한 명이 우승', () => {
    const m = setup([[2], [5]]);
    applyMove(m, 0, { type: 'bid', count: 2, face: 2 });
    applyMove(m, 1, { type: 'challenge' });
    expect(m.counts).toEqual([0, 1]);
    expect(m.status).toBe('match-over');
    expect(m.winners).toEqual([1]);
  });
  it('남의 주사위는 공개 전엔 안 보임', () => {
    const m = setup([[2, 4], [5, 5]]);
    const v = viewFor(m, 0);
    expect(v.myDice).toEqual([2, 4]);
    expect(JSON.stringify(v)).not.toContain('[5,5]');
  });
  it('팔리피코: 1개가 된 사람 판은 숫자 고정·와일드 없음', () => {
    const m = setup([[2, 2], [5], [6, 6]], { palifico: true });
    m.counts = [2, 2, 2];
    m.dice = [[2, 2], [5, 4], [6, 6]];
    applyMove(m, 0, { type: 'bid', count: 5, face: 2 });
    applyMove(m, 1, { type: 'challenge' }); // 거짓 → 0번 하나 잃어 1개
    expect(m.counts[0]).toBe(1);
    expect(m.palifico).toBe(true);
    applyMove(m, 0, { type: 'roll' });
    applyMove(m, 0, { type: 'bid', count: 1, face: 4 });
    expect(bidProblem(m, 2, 5)).toMatch('팔리피코');
  });
  it('자동 수는 늘 합법', () => {
    const m = newMatch(CLASSIC, 5, () => 0.3);
    for (let i = 0; i < 2000 && m.status === 'playing'; i++) applyMove(m, m.turn, autoMove(m, m.turn));
    expect(m.status).toBe('match-over');
  });
});
