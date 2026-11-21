/**
 * 깃발 전선 봇 — 빠른 어림: 깃발 한쪽의 카드로 만들 수 있는 가장 좋은 대형을, 필요한 카드가 아직 남아 있는지(보드에 안 나왔는지)로 판정.
 *  - 놓기 점수 = 그 깃발에서 내 쪽 잠재력 − 상대 쪽 잠재력이 얼마나 좋아지는가 + 깃발의 전략 가치(연속 3개 노림).
 *  - 큰 카드는 좋은 대형을 만들 때 쓰고, 버릴 곳(이미 진 깃발)에는 작은 카드.
 *  - 쉬움: 잠재력만 대충, 보통: 상대 비교, 어려움: + 연속 깃발·남은 카드 수까지.
 */
import { BotContext, Bot, Scored, pickByLevel } from '@bg/core';
import { TroopCard, strength } from './formation';
import { Move, Side } from './game';
import { GameView } from './view';

type Avail = (color: number, value: number) => boolean;

/** 부분 대형의 잠재 점수 (대형 × 1000 + 기대 합) */
export function potential(cards: TroopCard[], size: number, maxValue: number, colors: number, avail: Avail): number {
  if (cards.length >= size) return strength(cards);
  if (!cards.length) return 2000 + (maxValue / 2) * size;
  const need = size - cards.length;
  const vs = cards.map((c) => c.value).sort((a, b) => a - b);
  const sum = vs.reduce((a, b) => a + b, 0);
  const sameColor = cards.every((c) => c.color === cards[0].color);
  const sameValue = vs.every((v) => v === vs[0]);
  const distinct = new Set(vs).size === vs.length;
  const span = vs[vs.length - 1] - vs[0];
  let best = 1000 + sum + need * (maxValue * 0.45);
  // 연속(쐐기·산개): 길이 size 창 중 가진 숫자를 모두 포함하는 창
  if (distinct && span <= size - 1) {
    for (let lo = Math.max(1, vs[vs.length - 1] - size + 1); lo <= vs[0] && lo + size - 1 <= maxValue; lo++) {
      const want = Array.from({ length: size }, (_, i) => lo + i).filter((v) => !vs.includes(v));
      const winSum = (size * (2 * lo + size - 1)) / 2;
      if (sameColor && want.every((v) => avail(cards[0].color, v))) best = Math.max(best, 5000 + winSum);
      if (want.every((v) => Array.from({ length: colors }, (_, c) => c).some((c) => avail(c, v)))) best = Math.max(best, 2000 + winSum);
    }
  }
  if (sameValue) {
    const left = Array.from({ length: colors }, (_, c) => c).filter((c) => avail(c, vs[0])).length;
    if (left >= need) best = Math.max(best, 4000 + vs[0] * size);
  }
  if (sameColor) {
    const left = Array.from({ length: maxValue }, (_, i) => i + 1).filter((v) => !vs.includes(v) && avail(cards[0].color, v)).sort((a, b) => b - a);
    if (left.length >= need) best = Math.max(best, 3000 + sum + left.slice(0, need).reduce((a, b) => a + b, 0) * 0.8);
  }
  return best;
}

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

export const lineBot: Bot<GameView, Move> = {
  thinkMs: [800, 1800],
  choose(ctx: BotContext<GameView>): Move {
    const v = ctx.view;
    const side = v.mySide!;
    const opp = (1 - side) as Side;
    const c = v.config;
    if (v.claimable.length) return { type: 'claim', flag: v.claimable[0] };
    const seen = new Set<string>();
    v.flags.forEach((f) => f.cards.forEach((cs) => cs.forEach((x) => seen.add(x.id))));
    const mineIds = new Set(v.hand.map((x) => x.id));
    const availFor = (exclude: string): Avail => (color, value) => {
      const id = `${color}-${value}`;
      return id !== exclude && !seen.has(id) && value >= 1 && value <= c.maxValue && color < c.colors;
    };
    const flagValue = (i: number) => {
      if (ctx.level !== 'hard') return 1;
      // 연속 깃발: 양옆이 내 것이면 더 중요
      const own = (j: number) => v.flags[j]?.owner === side;
      return 1 + (own(i - 1) ? 0.6 : 0) + (own(i + 1) ? 0.6 : 0) + (i > 0 && i < c.flags - 1 ? 0.1 : 0);
    };
    const scored: Scored<Move>[] = [];
    for (const card of v.hand) {
      const avail = availFor(card.id);
      for (let i = 0; i < v.flags.length; i++) {
        const f = v.flags[i];
        if (f.owner !== null || f.cards[side].length >= c.size) continue;
        const before = potential(f.cards[side], c.size, c.maxValue, c.colors, avail);
        const after = potential([...f.cards[side], card], c.size, c.maxValue, c.colors, avail);
        const theirs = potential(f.cards[opp], c.size, c.maxValue, c.colors, (col, val) => avail(col, val) && !mineIds.has(`${col}-${val}`));
        const scale = ctx.level === 'easy' ? 900 : 600;
        const gain = sigmoid((after - theirs) / scale) - sigmoid((before - theirs) / scale);
        // 이미 크게 진 깃발에는 작은 카드 버리기
        const dump = theirs - after > 1500 ? (c.maxValue - card.value) * 0.004 : 0;
        const spend = ctx.level === 'easy' ? 0 : card.value * 0.0015 * (f.cards[side].length === 0 ? 1 : 0);
        scored.push({ move: { type: 'play', cardId: card.id, flag: i }, score: (gain * 10 + dump * 10 - spend) * flagValue(i) });
      }
    }
    if (!scored.length) return { type: 'pass' };
    return pickByLevel(scored, ctx.level, ctx.rng);
  },
};
