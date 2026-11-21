import { describe, expect, it } from 'vitest';
import { duel, playOut } from '@bg/core';
import { CLASSIC, PRESETS } from './config';
import { game } from './module';

describe('봇', () => {
  it('모든 프리셋 · 난이도에서 규칙에 맞게 끝까지', () => {
    for (const p of PRESETS) for (const players of [2, 4, 6]) for (const level of ['easy', 'normal', 'hard'] as const) {
      if (players > 4 && p.id !== 'big') continue;
      expect(playOut(game, p.config, Array(players).fill(level), 5).illegal, `${p.label} ${players} ${level}`).toBe(0);
    }
  }, 60000);
  it('어려움이 쉬움을 이긴다', () => {
    const rate = duel(game, CLASSIC, 'hard', 'easy', 30);
    console.log('number-runs 어려움 vs 쉬움', rate);
    expect(rate).toBeGreaterThan(0.65);
  }, 60000);
});
