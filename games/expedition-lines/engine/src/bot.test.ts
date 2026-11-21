import { describe, expect, it } from 'vitest';
import { duel, playOut } from '@bg/core';
import { CLASSIC, PRESETS } from './config';
import { expeditionLines } from './module';

describe('봇', () => {
  it('모든 프리셋 · 모든 난이도에서 규칙에 맞게 끝까지 둔다', () => {
    for (const p of PRESETS) {
      for (const level of ['easy', 'normal', 'hard'] as const) {
        const players = /four|teams|4/.test(p.id + p.label) ? 4 : /three|3/.test(p.id + p.label) ? 3 : 2;
        const r = playOut(expeditionLines, { ...CLASSIC, ...p.config }, Array(players).fill(level), 7);
        expect(r.illegal, `${p.label} ${level}`).toBe(0);
      }
    }
  });

  it('어려움이 쉬움을 이긴다 (2명, 좌석 번갈아)', () => {
    const rate = duel(expeditionLines, CLASSIC, 'hard', 'easy', 24);
    console.log('expedition-lines 어려움 vs 쉬움 승률', rate);
    expect(rate).toBeGreaterThanOrEqual(0.65);
  });

  it('보통이 쉬움보다 낫다', () => {
    expect(duel(expeditionLines, CLASSIC, 'normal', 'easy', 24)).toBeGreaterThanOrEqual(0.55);
  });
});
