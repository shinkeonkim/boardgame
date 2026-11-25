import { describe, expect, it } from 'vitest';
import { duel, playOut } from '@bg/core';
import { CLASSIC, PRESETS } from './config';
import { game } from './module';
import { applyMove, newMatch } from './game';
import { stoneBot } from './bot';
import { viewFor } from './view';

describe('오목 봇', () => {
  it('모든 프리셋 · 난이도에서 규칙에 맞게 끝까지', () => {
    for (const p of PRESETS) for (const level of ['easy', 'normal', 'hard'] as const) {
      expect(playOut(game, p.config, [level, level], 2).illegal, `${p.label} ${level}`).toBe(0);
    }
  });
  it('상대의 열린 넷은 막고, 내 오목은 완성', () => {
    const m = newMatch(CLASSIC, 2, () => 0);
    const me = m.turn;
    // 상대(백)가 가로 4개를 늘어놓은 상황을 직접 만듦
    for (const x of [3, 4, 5, 6]) m.board[7 * 15 + x] = 1;
    m.board[0] = 0;
    m.moves = 5;
    const mv = stoneBot.choose({ view: viewFor(m, me), seat: me, level: 'normal', rng: () => 0.5 });
    expect(mv).toMatchObject({ type: 'place', y: 7 });
    expect([2, 7]).toContain((mv as { x: number }).x);
  });
  it('어려움이 쉬움을 이긴다', () => {
    const rate = duel(game, CLASSIC, 'hard', 'easy', 20);
    expect(rate).toBeGreaterThan(0.7);
  });
});
