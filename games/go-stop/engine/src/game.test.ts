import { describe, expect, it } from 'vitest';
import { playOut } from '@bg/core';
import { DECK, HCard, piCount, scoreCards } from './cards';
import { CLASSIC, PRESETS } from './config';
import { applyMove, newMatch } from './game';
import { game } from './module';

const card = (id: string) => DECK.find((c) => c.id === id)!;

describe('고스톱', () => {
  it('48장 · 광5 열끗9 띠10 피(쌍피 포함)24', () => {
    expect(DECK).toHaveLength(48);
    expect(DECK.filter((c) => c.kind === 'gwang')).toHaveLength(5);
    expect(DECK.filter((c) => c.kind === 'animal')).toHaveLength(9);
    expect(DECK.filter((c) => c.kind === 'ribbon')).toHaveLength(10);
    expect(piCount(DECK)).toBe(26);
  });
  it('점수: 삼광·비삼광·고도리·홍단·피 10장', () => {
    expect(scoreCards(['1-0', '3-0', '8-0'].map(card)).total).toBe(3);
    expect(scoreCards(['1-0', '3-0', '12-0'].map(card)).total).toBe(2);
    expect(scoreCards(['2-0', '4-0', '8-1'].map(card)).lines.map((l) => l.label)).toContain('고도리');
    expect(scoreCards(['1-1', '2-1', '3-1'].map(card)).total).toBe(3);
    const pis: HCard[] = DECK.filter((c) => c.kind === 'pi').slice(0, 10);
    expect(scoreCards(pis).total).toBe(1);
  });
  it('같은 달이 하나면 먹고, 없으면 바닥에 놓음 · 쪽', () => {
    const m = newMatch(CLASSIC, 2, () => 0.2);
    m.turn = 0;
    m.hands[0] = [card('1-0'), card('5-2')];
    m.table = [card('1-2'), card('6-2')];
    m.pile = [card('9-2'), card('5-3')];
    applyMove(m, 0, { type: 'play', card: '1-0' });
    expect(m.captured[0].map((c) => c.id).sort()).toEqual(['1-0', '1-2']);
    expect(m.table.map((c) => c.id).sort()).toEqual(['6-2', '9-2']);
    // 다음 차례 상대 → 다시 0번: 5월을 내고 5월을 뒤집으면 쪽
    m.turn = 0;
    applyMove(m, 0, { type: 'play', card: '5-2' });
    const last = m.log[m.log.length - 1];
    expect(last.type === 'play' && last.special).toContain('쪽');
  });
  it('뻑: 하나 먹으려다 같은 달을 뒤집으면 세 장이 바닥에', () => {
    const m = newMatch(CLASSIC, 2, () => 0.2);
    m.turn = 0;
    m.hands[0] = [card('7-0')];
    m.table = [card('7-1')];
    m.pile = [card('7-2')];
    applyMove(m, 0, { type: 'play', card: '7-0' });
    expect(m.table).toHaveLength(3);
    expect(m.captured[0]).toHaveLength(0);
  });
  it('봇끼리 2·3명 · 모든 프리셋을 규칙대로 끝까지', () => {
    for (const p of PRESETS) for (const n of [2, 3]) for (const level of ['easy', 'hard'] as const) {
      expect(playOut(game, p.config, Array(n).fill(level), 4).illegal, `${p.label} ${n} ${level}`).toBe(0);
    }
  });
});
