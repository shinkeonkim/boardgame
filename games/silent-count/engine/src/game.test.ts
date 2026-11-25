import { describe, expect, it } from 'vitest';
import { CLASSIC, validateConfig } from './config';
import { applyMove, newMatch, startNextRound } from './game';
import { viewFor } from './view';
import { mindBot } from './bot';

describe('침묵의 숫자', () => {
  it('단계만큼 카드를 받고, 작은 순서로 다 내면 단계 통과', () => {
    const m = newMatch(CLASSIC, 2, () => 0.4);
    expect(m.hands.map((h) => h.length)).toEqual([1, 1]);
    const order = [0, 1].sort((a, b) => m.hands[a][0] - m.hands[b][0]);
    order.forEach((s) => applyMove(m, s, { type: 'play' }));
    expect(m.status).toBe('round-over');
    expect(m.cleared).toBe(1);
    startNextRound(m);
    expect(m.hands[0]).toHaveLength(2);
  });
  it('순서가 어긋나면 생명 -1, 더 작은 카드는 모두 버림', () => {
    const m = newMatch(CLASSIC, 2, () => 0.4);
    m.hands = [[10], [50]];
    const lives = m.lives;
    applyMove(m, 1, { type: 'play' });
    expect(m.lives).toBe(lives - 1);
    expect(m.hands[0]).toEqual([]);
    expect(m.log.some((e) => e.type === 'miss')).toBe(true);
  });
  it('수리검: 카드를 쥔 사람이 모두 동의하면 각자 가장 낮은 카드를 버림', () => {
    const m = newMatch(CLASSIC, 3, () => 0.4);
    m.round = 2;
    m.hands = [[5, 60], [20, 70], [30, 80]];
    applyMove(m, 0, { type: 'star', on: true });
    applyMove(m, 1, { type: 'star', on: true });
    expect(m.stars).toBe(1);
    applyMove(m, 2, { type: 'star', on: true });
    expect(m.stars).toBe(0);
    expect(m.hands).toEqual([[60], [70], [80]]);
  });
  it('생명이 0이면 끝, 기다리기는 아무것도 안 바꿈', () => {
    const m = newMatch({ ...CLASSIC, lives: 1 }, 2, () => 0.4);
    m.hands = [[10], [50]];
    applyMove(m, 0, { type: 'wait' });
    expect(m.hands).toEqual([[10], [50]]);
    applyMove(m, 1, { type: 'play' });
    expect(m.status).toBe('match-over');
    expect(viewFor(m, 0).won).toBe(false);
  });
  it('봇: 간격이 작으면 금방, 크면 오래 기다렸다가 냄', () => {
    const m = newMatch(CLASSIC, 2, () => 0.4);
    m.hands = [[12, 90], [40]];
    m.pile = [10];
    m.lastAt = Date.now() - 1500;
    const v = viewFor(m, 0);
    expect(mindBot.choose({ view: v, seat: 0, level: 'hard', rng: () => 0.5 })).toEqual({ type: 'play' });
    m.hands = [[80], [40]];
    expect(mindBot.choose({ view: viewFor(m, 0), seat: 0, level: 'hard', rng: () => 0.5 })).toEqual({ type: 'wait' });
  });
});
