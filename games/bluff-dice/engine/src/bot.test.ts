import { describe, expect, it } from 'vitest';
import { duel, playOut } from '@bg/core';
import { CLASSIC, PRESETS } from './config';
import { game } from './module';

describe('봇', () => {
  it('모든 프리셋 · 난이도에서 규칙에 맞게 끝까지', () => {
    for (const p of PRESETS) for (const players of [2, 4, 8]) for (const level of ['easy', 'normal', 'hard'] as const) {
      expect(playOut(game, p.config, Array(players).fill(level), 2).illegal, `${p.label} ${players} ${level}`).toBe(0);
    }
  });
  it('어려움이 쉬움을 이긴다 (2명)', () => {
    const rate = duel(game, CLASSIC, 'hard', 'easy', 60);
    console.log('bluff-dice 어려움 vs 쉬움', rate);
    expect(rate).toBeGreaterThan(0.62);
  });
  it('어려움 1 vs 쉬움 3 (4명) — 무작위 25%보다 잘한다', () => {
    const rate = duel(game, CLASSIC, 'hard', 'easy', 60, { players: 4 });
    console.log('bluff-dice 4명 어려움 1등', rate);
    expect(rate).toBeGreaterThan(0.35);
  });
});
