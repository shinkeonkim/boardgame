import { describe, expect, it } from 'vitest';
import { CLASSIC } from './config';
import { TroopCard, bestCompletion, formationRank, strength } from './formation';
import { MatchState, applyMove, autoMove, canClaim, newMatch } from './game';

const T = (color: number, value: number): TroopCard => ({ id: `${color}-${value}`, color, value });

describe('대형', () => {
  it('쐐기 > 방진 > 대대 > 산개 > 무리, 같으면 합', () => {
    expect(formationRank([T(0, 3), T(0, 4), T(0, 5)])).toBe(5);
    expect(formationRank([T(0, 7), T(1, 7), T(2, 7)])).toBe(4);
    expect(formationRank([T(0, 1), T(0, 5), T(0, 9)])).toBe(3);
    expect(formationRank([T(0, 4), T(2, 5), T(1, 6)])).toBe(2);
    expect(formationRank([T(0, 1), T(1, 5), T(2, 9)])).toBe(1);
    expect(strength([T(0, 8), T(0, 9), T(0, 10)])).toBeGreaterThan(strength([T(1, 1), T(1, 2), T(1, 3)]));
  });
  it('남은 카드로 만들 수 있는 최고 대형', () => {
    expect(bestCompletion([T(0, 9), T(0, 10)], [T(0, 8), T(1, 2)], 3)).toBe(strength([T(0, 8), T(0, 9), T(0, 10)]));
  });
});

function empty(): MatchState {
  const m = newMatch(CLASSIC, 2, () => 0.5);
  m.flags.forEach((f) => {
    f.cards = [[], []];
    f.owner = null;
    f.doneAt = [null, null];
  });
  return m;
}

describe('깃발 주장', () => {
  it('상대가 더 좋은 대형을 만들 수 없으면 증명되어 가져감', () => {
    const m = empty();
    // 내 쪽 쐐기 8-9-10 (빨강), 상대는 2장만: 남은 카드로 빨강 쐐기 8-9-10을 넘을 수 없음
    m.flags[0].cards[0] = [T(0, 8), T(0, 9), T(0, 10)];
    m.flags[0].doneAt[0] = 1;
    m.flags[0].cards[1] = [T(1, 1), T(2, 5)];
    m.hands = m.hands.map((h) => h.filter((c) => !['0-8', '0-9', '0-10', '1-1', '2-5'].includes(c.id)));
    m.deck = m.deck.filter((c) => !['0-8', '0-9', '0-10', '1-1', '2-5'].includes(c.id));
    expect(canClaim(m, 0, 0)).toBe(true);
    // 약한 대형은 아직 증명 불가
    m.flags[1].cards[0] = [T(3, 1), T(4, 2), T(5, 6)];
    expect(canClaim(m, 1, 0)).toBe(false);
  });
  it('놓기 → 1장 뽑기, 한쪽 3장까지', () => {
    const m = newMatch({ ...CLASSIC, autoClaim: false }, 2, () => 0.2);
    m.turn = 0;
    const card = m.hands[0][0];
    applyMove(m, 0, { type: 'play', cardId: card.id, flag: 4 });
    expect(m.hands[0]).toHaveLength(7);
    expect(m.flags[4].cards[0]).toEqual([card]);
    expect(m.turn).toBe(1);
  });
  it('자동 수로 끝까지 (2명·4명 팀전·4장 대형)', () => {
    for (const [cfg, n] of [[CLASSIC, 2], [CLASSIC, 4], [{ ...CLASSIC, size: 4, maxValue: 12, handSize: 8 }, 2]] as const) {
      const m = newMatch(cfg, n, () => 0.7);
      for (let i = 0; i < 400 && m.status === 'playing'; i++) applyMove(m, m.turn, autoMove(m, m.turn));
      expect(m.status).toBe('match-over');
    }
  });
});
