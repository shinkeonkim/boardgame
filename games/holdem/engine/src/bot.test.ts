import { describe, expect, it } from 'vitest';
import { duel, playOut } from '@bg/core';
import { CLASSIC, PRESETS } from './config';
import { game } from './module';

describe('봇', () => {
  it('모든 프리셋 · 난이도에서 규칙에 맞게 끝까지', () => {
    for (const p of PRESETS) for (const players of [2, 4, 9]) for (const level of ['easy', 'normal', 'hard'] as const) {
      expect(playOut(game, { ...p.config, maxHands: 12 }, Array(players).fill(level), 3).illegal, `${p.label} ${players} ${level}`).toBe(0);
    }
  });
  it('어려움이 쉬움보다 칩을 더 모은다 (둘이서, 15핸드)', () => {
    const rate = duel(game, { ...CLASSIC, maxHands: 15 }, 'hard', 'easy', 20);
    console.log('holdem 어려움 vs 쉬움', rate);
    expect(rate).toBeGreaterThan(0.5);
  });
});
