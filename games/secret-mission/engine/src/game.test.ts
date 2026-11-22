import { describe, expect, it } from 'vitest';
import { CLASSIC, rolesFor, validateConfig } from './config';
import { MatchState, actors, applyMove, autoMove, knowledge, newMatch } from './game';
import { viewFor } from './view';

function fixed(roles: MatchState['roles'], over = {}): MatchState {
  const m = newMatch({ ...CLASSIC, ...over }, roles.length, () => 0.2);
  m.roles = roles;
  m.leader = 0;
  return m;
}
const allVote = (m: MatchState, yes: boolean[]) => yes.forEach((y, i) => applyMove(m, i, { type: 'vote', approve: y }));

describe('역할', () => {
  it('인원별 첩자 수 · 특수 역할', () => {
    expect(rolesFor(CLASSIC, 5).filter((r) => r === 'spy')).toHaveLength(2);
    expect(rolesFor(CLASSIC, 10).filter((r) => r === 'spy')).toHaveLength(4);
    const full = rolesFor({ ...CLASSIC, seer: true, guard: true, falseSeer: true, shadow: true }, 7);
    expect(full).toEqual(expect.arrayContaining(['seer', 'guard', 'hunter', 'falseSeer', 'shadow']));
    expect(validateConfig({ ...CLASSIC, seer: true, falseSeer: true, shadow: true }, 5)[0]).toMatch('2개까지만');
  });
  it('누가 무엇을 아는지', () => {
    const roles: MatchState['roles'] = ['seer', 'guard', 'agent', 'hunter', 'shadow', 'falseSeer', 'loner'];
    expect(knowledge({ roles }, 0)).toEqual([null, null, null, 'spy', null, 'spy', 'spy']); // 예언자: 숨은 우두머리 못 봄
    expect(knowledge({ roles }, 1)).toEqual(['seer', null, null, null, null, 'seer', null]); // 호위무사: 예언자 후보 둘
    expect(knowledge({ roles }, 3)).toEqual([null, null, null, null, 'spy', 'spy', null]); // 첩자: 외톨이 못 봄
    expect(knowledge({ roles }, 6)).toEqual([null, null, null, null, null, null, null]); // 외톨이: 아무도 모름
  });
});

describe('진행', () => {
  it('과반 찬성이면 원정, 아니면 대장이 바뀌고 5번 부결이면 첩자 승', () => {
    const m = fixed(['agent', 'agent', 'agent', 'spy', 'spy']);
    applyMove(m, 0, { type: 'team', seats: [0, 1] });
    expect(actors(m)).toEqual([0, 1, 2, 3, 4]);
    allVote(m, [true, true, false, false, false]);
    expect(m.phase).toBe('team');
    expect(m.leader).toBe(1);
    for (let k = 0; k < 4; k++) {
      applyMove(m, m.leader, autoMove(m, m.leader));
      allVote(m, [false, false, false, false, false]);
    }
    expect(m.status).not.toBe('playing');
    expect(m.winner).toBe('spies');
  });
  it('요원은 실패를 못 내고, 첩자 실패 1장이면 원정 실패 · 투표는 끝나야 공개', () => {
    const m = fixed(['agent', 'agent', 'agent', 'spy', 'spy']);
    applyMove(m, 0, { type: 'team', seats: [0, 3] });
    applyMove(m, 1, { type: 'vote', approve: true });
    expect(viewFor(m, 2).voted[1]).toBe(true);
    expect(viewFor(m, 2).history).toHaveLength(0);
    for (const s of [0, 2, 3, 4]) applyMove(m, s, { type: 'vote', approve: true });
    expect(() => applyMove(m, 0, { type: 'play', success: false })).toThrow('성공 카드만');
    applyMove(m, 0, { type: 'play', success: true });
    applyMove(m, 3, { type: 'play', success: false });
    expect(m.results[0]).toBe(false);
    expect(viewFor(m, 2).history[0].fails).toBe(1);
  });
  it('7명 이상 4번째 원정은 실패 2장이어야 실패', () => {
    const m = fixed(['agent', 'agent', 'agent', 'agent', 'spy', 'spy', 'spy']);
    m.mission = 3;
    applyMove(m, 0, { type: 'team', seats: [0, 1, 2, 4] });
    allVote(m, Array(7).fill(true));
    for (const s of [0, 1, 2]) applyMove(m, s, { type: 'play', success: true });
    applyMove(m, 4, { type: 'play', success: false });
    expect(m.results[3]).toBe(true);
  });
  it('요원이 3번 성공해도 사냥꾼이 예언자를 맞히면 첩자 승', () => {
    const m = fixed(['seer', 'agent', 'agent', 'hunter', 'spy'], { seer: true });
    m.results = [true, true, null, null, null];
    m.mission = 2;
    applyMove(m, 0, { type: 'team', seats: [0, 1] });
    allVote(m, Array(5).fill(true));
    applyMove(m, 0, { type: 'play', success: true });
    applyMove(m, 1, { type: 'play', success: true });
    expect(m.phase).toBe('hunt');
    expect(actors(m)).toEqual([3]);
    applyMove(m, 3, { type: 'hunt', target: 0 });
    expect(m.winner).toBe('spies');
    expect(m.roundScores[0]).toEqual([0, 0, 0, 1, 1]);
  });
});
