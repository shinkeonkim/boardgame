import { describe, expect, it } from 'vitest';
import { duel, playOut } from '@bg/core';
import { CLASSIC, PRESETS } from './config';
import { game } from './module';

describe('봇', () => {
  it('모든 프리셋 · 난이도 · 인원에서 규칙에 맞게 끝까지', () => {
    for (const p of PRESETS) for (const players of [4, 5, 8]) for (const level of ['easy', 'normal', 'hard'] as const) {
      expect(playOut(game, p.config, Array(players).fill(level), 6).illegal, `${p.label} ${players} ${level}`).toBe(0);
    }
  });
  it('어려움 팀이 쉬움 팀을 이긴다 (4명: 0·2 vs 1·3)', () => {
    let wins = 0;
    const n = 40;
    for (let i = 0; i < n; i++) {
      const hardTeam = i % 2;
      const levels = [0, 1, 2, 3].map((s) => (s % 2 === hardTeam ? 'hard' : 'easy')) as ('hard' | 'easy')[];
      const r = playOut(game, CLASSIC, levels, 700 + i);
      if (r.totals[hardTeam] > r.totals[1 - hardTeam]) wins++;
    }
    console.log('cipher-ops 어려움 팀 승률', wins / n);
    expect(wins / n).toBeGreaterThan(0.65);
  });
  it('duel 헬퍼와도 맞음', () => expect(typeof duel).toBe('function'));
});
