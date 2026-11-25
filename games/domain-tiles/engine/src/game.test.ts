import { describe, expect, it } from 'vitest';
import { playOut } from '@bg/core';
import { CLASSIC, PRESETS } from './config';
import { applyMove, currentSeat, legalPlacements, newMatch, scoreKingdom } from './game';
import { DOMINOES } from './tiles';
import { game } from './module';

describe('영지 도미노', () => {
  it('도미노 48장, 인원별 덱 크기·줄 크기', () => {
    expect(DOMINOES).toHaveLength(48);
    expect(newMatch(CLASSIC, 2, () => 0.3).deck.length + 4).toBe(24);
    const m3 = newMatch(CLASSIC, 3, () => 0.3);
    expect(m3.next).toHaveLength(3);
  });
  it('처음 줄을 모두 고르면 번호 순서대로 놓기 시작', () => {
    const m = newMatch(CLASSIC, 3, () => 0.3);
    for (let i = 0; i < 3; i++) applyMove(m, currentSeat(m), { type: 'claim', slot: m.next.findIndex((s) => s.claim === null) });
    expect(m.step).toBe('place');
    expect(currentSeat(m)).toBe(m.row[0].claim);
  });
  it('놓기: 성이나 같은 땅에 닿아야 하고, 5×5 를 넘으면 안 됨', () => {
    const k = { '0,0': { castle: true as const } };
    const d = { id: 1, a: { t: 'wheat' as const, crowns: 0 }, b: { t: 'wheat' as const, crowns: 0 } };
    const legal = legalPlacements(k, d, 5);
    expect(legal.length).toBeGreaterThan(0);
    expect(legal.every((p) => Math.abs(p.x1) + Math.abs(p.y1) === 1 || Math.abs(p.x2) + Math.abs(p.y2) === 1)).toBe(true);
    // 성에서 한 줄로 4칸 멀리 → 폭 6 > 5 라 안 됨
    expect(legal.some((p) => p.x2 === 5 || p.x1 === 5)).toBe(false);
  });
  it('점수: 같은 땅 구역의 칸 수 × 왕관 수', () => {
    const k = { '0,0': { castle: true as const }, '1,0': { t: 'water' as const, crowns: 1 }, '2,0': { t: 'water' as const, crowns: 0 }, '2,1': { t: 'water' as const, crowns: 1 }, '0,1': { t: 'wheat' as const, crowns: 0 } };
    expect(scoreKingdom(k).total).toBe(3 * 2);
  });
  it('봇끼리 모든 프리셋을 규칙대로 끝까지', () => {
    for (const p of PRESETS) for (const n of p.config.size === 7 ? [2] : [2, 3, 4]) for (const level of ['easy', 'hard'] as const) {
      expect(playOut(game, p.config, Array(n).fill(level), 2).illegal, `${p.label} ${n} ${level}`).toBe(0);
    }
  });
});
