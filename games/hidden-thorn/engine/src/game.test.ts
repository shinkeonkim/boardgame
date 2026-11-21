import { describe, expect, it } from 'vitest';
import { CLASSIC } from './config';
import { MatchState, actors, applyMove, autoMove, newMatch } from './game';
import { viewFor } from './view';

function opened(players = 3): MatchState {
  const m = newMatch(CLASSIC, players, () => 0.1);
  m.turn = 0;
  for (const s of actors(m)) applyMove(m, s, { type: 'place', disc: 'rose' });
  return m;
}

describe('진행', () => {
  it('처음에는 모두 동시에 한 장, 그다음 차례대로', () => {
    const m = newMatch(CLASSIC, 3, () => 0.1);
    expect(actors(m)).toEqual([0, 1, 2]);
    applyMove(m, 1, { type: 'place', disc: 'thorn' });
    expect(() => applyMove(m, 1, { type: 'place', disc: 'rose' })).toThrow('이미');
    applyMove(m, 0, { type: 'place', disc: 'rose' });
    applyMove(m, 2, { type: 'place', disc: 'rose' });
    expect(m.phase).toBe('turn');
    expect(viewFor(m, 0).matCounts).toEqual([1, 1, 1]);
    expect(JSON.stringify(viewFor(m, 0).flippedDiscs)).toBe('[[],[],[]]');
  });
  it('부르기 → 차례대로 올리거나 포기 → 남은 한 명이 뒤집기', () => {
    const m = opened();
    m.turn = 0;
    applyMove(m, 0, { type: 'bid', count: 1 });
    expect(m.phase).toBe('bidding');
    expect(() => applyMove(m, 1, { type: 'bid', count: 1 })).toThrow('2개 이상');
    applyMove(m, 1, { type: 'bid', count: 2 });
    applyMove(m, 2, { type: 'pass' });
    applyMove(m, 0, { type: 'pass' });
    expect(m.phase).toBe('flip');
    expect(m.turn).toBe(1);
    expect(m.roses).toBe(1); // 자기 것부터 자동
    applyMove(m, 1, { type: 'flip', seat: 2 });
    expect(m.points[1]).toBe(1);
    expect(m.phase).toBe('open');
  });
  it('남의 가시를 뒤집으면 무작위로 하나 잃음', () => {
    const m = newMatch(CLASSIC, 2, () => 0.1);
    applyMove(m, 0, { type: 'place', disc: 'rose' });
    applyMove(m, 1, { type: 'place', disc: 'thorn' });
    m.turn = 0;
    applyMove(m, 0, { type: 'bid', count: 2 });
    expect(m.phase).toBe('flip');
    applyMove(m, 0, { type: 'flip', seat: 1 });
    expect(m.owned[0]).toHaveLength(3);
    expect(m.turn).toBe(0); // 도전자가 다음 판 시작
  });
  it('자기 가시면 잃을 원판을 고름', () => {
    const m = newMatch(CLASSIC, 2, () => 0.1);
    applyMove(m, 0, { type: 'place', disc: 'thorn' });
    applyMove(m, 1, { type: 'place', disc: 'rose' });
    m.turn = 0;
    applyMove(m, 0, { type: 'bid', count: 1 });
    applyMove(m, 1, { type: 'pass' });
    expect(m.phase).toBe('lose');
    applyMove(m, 0, { type: 'lose', disc: 'rose' });
    expect(m.owned[0].filter((d) => d === 'rose')).toHaveLength(2);
  });
  it('두 번 성공하면 우승', () => {
    const m = opened(2);
    m.points[0] = 1;
    m.turn = 0;
    applyMove(m, 0, { type: 'bid', count: 2 });
    applyMove(m, 0, { type: 'flip', seat: 1 });
    expect(m.status).toBe('match-over');
    expect(m.winners).toEqual([0]);
  });
  it('자동 수로 끝까지', () => {
    const m = newMatch({ ...CLASSIC, thorns: 2 }, 6, () => 0.3);
    for (let i = 0; i < 5000 && m.status === 'playing'; i++) {
      const a = actors(m)[0];
      applyMove(m, a, autoMove(m, a));
    }
    expect(m.status).toBe('match-over');
  });
});
