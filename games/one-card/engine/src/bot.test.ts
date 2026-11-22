import { describe, expect, it } from 'vitest';
import { duel, playOut } from '@bg/core';
import { CLASSIC, PRESETS } from './config';
import { game } from './module';

describe('봇', () => {
  it('모든 프리셋 · 난이도에서 규칙에 맞게 끝까지', () => {
    for (const p of PRESETS) for (const players of [2, 4, 8]) for (const level of ['easy', 'normal', 'hard'] as const) {
      if (game.validateConfig(p.config, players).length) continue;
      expect(playOut(game, p.config, Array(players).fill(level), 3).illegal, `${p.label} ${players} ${level}`).toBe(0);
    }
  });
  it('어려움이 쉬움보다 자주 이긴다 (2명)', () => {
    const rate = duel(game, { ...CLASSIC, rounds: 1 }, 'hard', 'easy', 80);
    console.log('one-card 어려움 vs 쉬움', rate);
    expect(rate).toBeGreaterThan(0.55);
  });
});
