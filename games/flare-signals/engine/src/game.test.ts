import { describe, expect, it } from 'vitest';
import { CLASSIC, deckSize, handSizeFor, validateConfig } from './config';
import { HandCard, MatchState, applyMove, autoMove, chopIndex, newMatch } from './game';
import { possibilities, viewFor } from './view';
import { game } from './module';

const hc = (color: number, value: number, k = 0): HandCard => ({
  id: `${color}-${value}-${k}`,
  color,
  value,
  clue: { colors: [], notColors: [], value: null, notValues: [], touched: false, focus: false, focusOnChop: false, at: -1 },
});

function setup(hands: HandCard[][], over: Partial<typeof CLASSIC> = {}): MatchState {
  const m = newMatch({ ...CLASSIC, ...over }, hands.length, () => 0.5);
  m.hands = hands;
  m.turn = 0;
  return m;
}

describe('설정', () => {
  it('원작 구성: 5색 × 10장 = 50장, 손패 2~3명 5장 · 4~5명 4장', () => {
    expect(deckSize(CLASSIC)).toBe(50);
    expect(deckSize({ ...CLASSIC, colors: 6 })).toBe(60);
    expect(deckSize({ ...CLASSIC, colors: 6, sixthCount: 'single' })).toBe(55);
    expect([2, 3, 4, 5, 6].map((n) => handSizeFor(CLASSIC, n))).toEqual([5, 5, 4, 4, 3]);
    expect(validateConfig({ ...CLASSIC, handSize: 6 }, 6)).toEqual([]);
  });
});

describe('규칙', () => {
  it('힌트: 가리킨 카드와 아닌 카드 모두 정보가 남고, 토큰이 줄어든다', () => {
    const m = setup([
      [hc(0, 1), hc(1, 1)],
      [hc(0, 1, 1), hc(2, 3), hc(0, 4)],
    ]);
    applyMove(m, 0, { type: 'hint', to: 1, color: 0 });
    const h = m.hands[1];
    expect(h[0].clue.colors).toEqual([0]);
    expect(h[1].clue.notColors).toEqual([0]);
    expect(h[2].clue.focus).toBe(true); // 새로 가리킨 가장 최근 카드
    expect(h[0].clue.focus).toBe(false);
    expect(m.hints).toBe(7);
    expect(m.turn).toBe(1);
  });

  it('없는 카드 힌트는 기본적으로 안 되고, 설정으로 허용', () => {
    const m = setup([[hc(0, 1)], [hc(1, 2)]]);
    expect(() => applyMove(m, 0, { type: 'hint', to: 1, value: 5 })).toThrow('카드가 없어요');
    const n = setup([[hc(0, 1)], [hc(1, 2)]], { emptyHints: true });
    applyMove(n, 0, { type: 'hint', to: 1, value: 5 });
    expect(n.hands[1][0].clue.notValues).toEqual([5]);
  });

  it('무지개는 모든 색 힌트에 반응', () => {
    const m = setup([[hc(0, 1)], [hc(5, 2), hc(1, 2)]], { colors: 6, sixth: 'rainbow', sixthCount: 'single' });
    applyMove(m, 0, { type: 'hint', to: 1, color: 3 });
    expect(m.hands[1][0].clue.colors).toEqual([3]);
    expect(() => applyMove(m, 1, { type: 'hint', to: 0, color: 5 })).toThrow('그 색으로는');
  });

  it('내기: 맞으면 쌓고 5를 쌓으면 힌트 회복, 틀리면 실수', () => {
    const m = setup([[hc(0, 1), hc(1, 3)], [hc(2, 2)]]);
    m.hints = 5;
    applyMove(m, 0, { type: 'play', cardId: '0-1-0' });
    expect(m.piles[0]).toBe(1);
    applyMove(m, 1, { type: 'play', cardId: '2-2-0' });
    expect(m.fuses).toBe(1);
    expect(m.discard.map((d) => d.id)).toEqual(['2-2-0']);
    m.piles[1] = 4;
    m.hands[0].push(hc(1, 5));
    applyMove(m, 0, { type: 'play', cardId: '1-5-0' });
    expect(m.hints).toBe(6);
  });

  it('힌트가 가득이면 버릴 수 없음, 버리면 회복', () => {
    const m = setup([[hc(0, 1), hc(1, 3)], [hc(2, 2)]]);
    expect(() => applyMove(m, 0, { type: 'discard', cardId: '0-1-0' })).toThrow('가득');
    m.hints = 3;
    applyMove(m, 0, { type: 'discard', cardId: '0-1-0' });
    expect(m.hints).toBe(4);
    expect(m.hands[0]).toHaveLength(2); // 새로 뽑음
  });

  it('실수 3번이면 실패, 원작은 0점', () => {
    const m = setup([[hc(0, 3), hc(0, 4), hc(0, 5)], [hc(1, 1)]]);
    m.piles[2] = 2;
    m.fuses = 2;
    applyMove(m, 0, { type: 'play', cardId: '0-3-0' });
    expect(m.status).toBe('match-over');
    expect(m.endReason).toBe('bomb');
    expect(m.roundScores).toEqual([0]);
    const k = setup([[hc(0, 3)], [hc(1, 1)]], { bombScore: 'keep' });
    k.piles[2] = 2;
    k.fuses = 2;
    applyMove(k, 0, { type: 'play', cardId: '0-3-0' });
    expect(k.roundScores).toEqual([2]);
  });

  it('덱이 바닥나면 모두 한 번씩 더 (마지막 카드를 뽑은 사람 포함)', () => {
    const m = setup([[hc(0, 1), hc(0, 2)], [hc(1, 1)], [hc(2, 1)]]);
    m.deck = [hc(3, 1)];
    m.hints = 3;
    applyMove(m, 0, { type: 'discard', cardId: '0-2-0' });
    expect(m.finalTurns).toBe(3);
    applyMove(m, 1, autoMove(m, 1));
    applyMove(m, 2, autoMove(m, 2));
    expect(m.status).toBe('playing');
    applyMove(m, 0, autoMove(m, 0));
    expect(m.status).toBe('match-over');
    expect(m.endReason).toBe('deck');
  });

  it('내 카드는 가려지고 남의 카드와 힌트는 보인다, 가능한 카드 계산', () => {
    const m = setup([[hc(0, 1), hc(1, 1)], [hc(0, 1, 1), hc(0, 1, 2)]]);
    applyMove(m, 0, { type: 'hint', to: 1, value: 1 });
    const v = viewFor(m, 1);
    expect(v.hands[1][0].color).toBeNull();
    expect(v.hands[0][0].color).toBe(0);
    // 좌석1의 카드: 숫자 1 → 빨강 1은 남이 하나(좌석0) 들고 있으니 남은 1이 2장, 다른 색 1은 3장씩
    const ps = possibilities(v, 1, v.hands[1][0].clue);
    expect(ps.every((p) => p.value === 1)).toBe(true);
    expect(ps.find((p) => p.color === 0)!.count).toBe(2);
    expect(chopIndex(m.hands[0])).toBe(0);
  });

  it('협력 점수: 모두 같은 합계', () => {
    const m = setup([[hc(0, 1)], [hc(1, 1)]]);
    m.roundScores = [17];
    expect(game.totals(m)).toEqual([17, 17]);
  });
});
