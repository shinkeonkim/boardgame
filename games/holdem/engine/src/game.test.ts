import { describe, expect, it } from 'vitest';
import { CLASSIC } from './config';
import { Card, MatchState, actors, applyMove, autoMove, newMatch } from './game';
import { HAND_NAMES, best, categoryOf, eval5 } from './hand';

const C = (txt: string): Card => {
  const rank = { A: 1, K: 13, Q: 12, J: 11, T: 10 }[txt[0]] ?? Number(txt[0]);
  const suit = 'shdc'.indexOf(txt[1]);
  return { id: `${suit}-${rank}`, suit, rank };
};
const H = (s: string) => s.split(' ').map(C);
const name = (s: string) => HAND_NAMES[categoryOf(best(H(s)).score)];

describe('족보', () => {
  it('족보 이름', () => {
    expect(name('As Ks Qs Js Ts 2h 3d')).toBe('스트레이트 플러시');
    expect(name('9h 9d 9s 9c 2h 3d 4c')).toBe('포카드');
    expect(name('9h 9d 9s 2c 2h 3d 4c')).toBe('풀 하우스');
    expect(name('2h 5h 9h Jh Kh 3d 4c')).toBe('플러시');
    expect(name('Ah 2d 3s 4c 5h 9d Kc')).toBe('스트레이트');
    expect(name('Qh Qd 2s 2c 9h 3d 4c')).toBe('투 페어');
  });
  it('세기 비교: 키커까지', () => {
    expect(eval5(H('Ah Ad Kc 5s 3h'))).toBeGreaterThan(eval5(H('Ah Ad Qc 5s 3h')));
    expect(eval5(H('6h 5d 4c 3s 2h'))).toBeGreaterThan(eval5(H('5h 4d 3c 2s Ah')));
    expect(eval5(H('Kh Kd 2c 2s 3h'))).toBeLessThan(eval5(H('Ah Ad 2c 2s 3h')));
  });
});

function table(chips: number[]): MatchState {
  const m = newMatch({ ...CLASSIC, blindUp: 0 }, chips.length, () => 0.1);
  return m;
}

describe('베팅', () => {
  it('블라인드: 둘이면 딜러가 스몰 블라인드이고 먼저 행동', () => {
    const m = table([1000, 1000]);
    expect(m.sb).toBe(m.dealer);
    expect(actors(m)).toEqual([m.dealer]);
    expect(m.bets[m.sb]).toBe(10);
    expect(m.bets[m.bb]).toBe(20);
  });
  it('모두 접으면 남은 사람이 팟을 가져감', () => {
    const m = table([1000, 1000, 1000]);
    const total = () => m.chips.reduce((a, b) => a + b, 0) + m.committed.reduce((a, b) => a + b, 0);
    expect(total()).toBe(3000);
    applyMove(m, actors(m)[0], { type: 'fold' });
    applyMove(m, actors(m)[0], { type: 'fold' });
    expect(m.phase).toBe('showdown');
    expect(m.chips.reduce((a, b) => a + b, 0)).toBe(3000);
    expect(m.chips[m.bb]).toBe(1010);
  });
  it('사이드 팟: 짧은 올인은 자기 몫까지만 이길 수 있음', () => {
    const m = table([1000, 1000, 1000]);
    // 판을 직접 꾸밈
    m.hole = [H('As Ad'), H('Ks Kd'), H('2c 7h')];
    m.deck = H('3h 9c 8d 4s Jc Qh 5d 6c Th').reverse();
    m.chips = [80, 980, 980];
    m.bets = [0, 20, 0];
    m.committed = [0, 20, 0];
    m.folded = [false, false, false];
    m.currentBet = 20;
    m.minRaise = 20;
    m.acted = [false, false, false];
    m.toAct = 2;
    applyMove(m, 2, { type: 'raise', to: 300 });
    applyMove(m, 0, { type: 'allin' }); // 80
    applyMove(m, 1, { type: 'call' });
    // 남은 거리 체크
    while (m.phase === 'bet') applyMove(m, m.toAct, { type: 'check' });
    expect(m.results[0].winners).toEqual([0]); // 메인 팟: A 페어
    expect(m.results[0].amount).toBe(240);
    expect(m.results[1].winners).toEqual([1]); // 사이드 팟: K 페어
    expect(m.chips[0]).toBe(240);
  });
  it('최소 레이즈와 자동 진행으로 끝까지 (칩 총량 보존)', () => {
    const m = newMatch({ ...CLASSIC, maxHands: 30 }, 4, () => 0.77);
    expect(() => applyMove(m, actors(m)[0], { type: 'raise', to: 25 })).toThrow('사이로');
    let g = 0;
    while (m.status === 'playing' && g++ < 5000) {
      const s = actors(m)[0];
      applyMove(m, s, autoMove(m, s));
      if (m.phase === 'bet') expect(m.chips.reduce((a, b) => a + b, 0) + m.committed.reduce((a, b) => a + b, 0)).toBe(4000);
    }
    expect(m.status).toBe('match-over');
  });
});
