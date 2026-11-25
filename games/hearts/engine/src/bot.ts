/**
 * 하트 봇 (점수를 피하는 게 목표):
 *  - 건네기: 스페이드 Q·K·A(스페이드가 적으면), 높은 하트, 짧은 무늬의 높은 카드를 넘겨 그 무늬를 비움
 *  - 따라 낼 때: 트릭에 점수가 있거나 위험하면 「지금 이기는 카드보다 낮은 것 중 가장 높은 것」, 질 수 없으면 가장 높은 것을 버림
 *  - 무늬가 없을 때: 스페이드 Q → 가장 높은 하트 → 가장 높은 카드를 버림
 *  - 먼저 낼 때: 가장 낮은 카드(하트·스페이드 Q 피함). 어려움은 스페이드 Q 를 끌어내려고 낮은 스페이드를 먼저
 */
import { Bot, BotContext, Scored, aceHigh, pickByLevel } from '@bg/core';
import { Card, HEART, Move, SPADE, isQueenOfSpades, pointsOf } from './game';
import { GameView } from './view';

function passScore(c: Card, hand: Card[]): number {
  const v = aceHigh(c);
  const spades = hand.filter((x) => x.suit === SPADE).length;
  if (isQueenOfSpades(c)) return spades <= 3 ? 100 : 40;
  if (c.suit === SPADE && v >= 13) return spades <= 3 ? 80 : 20;
  if (c.suit === HEART) return 30 + v;
  const sameSuit = hand.filter((x) => x.suit === c.suit).length;
  return v + (sameSuit <= 3 ? 25 : 0);
}

function playScore(c: Card, v: GameView): number {
  const val = aceHigh(c);
  const trick = v.trick;
  const pts = (x: Card) => pointsOf(x, v.config);
  if (!trick.length) {
    // 먼저 낼 때: 낮을수록 좋음, 하트·스페이드 고위는 피함
    let s = 20 - val;
    if (c.suit === HEART) s -= 6;
    if (c.suit === SPADE && val >= 12) s -= 15;
    return s;
  }
  const led = trick[0].card.suit;
  const winning = trick.filter((p) => p.card.suit === led).reduce((a, p) => Math.max(a, aceHigh(p.card)), 0);
  const trickPts = trick.reduce((a, p) => a + pts(p.card), 0);
  const last = trick.length === v.players - 1;
  if (c.suit === led) {
    const wouldWin = val > winning;
    if (!wouldWin) return 30 + val; // 질 수 있으면 지는 것 중 가장 높은 것
    // 이길 수밖에 없으면: 마지막이고 점수가 없으면 가장 높은 걸로 이겨 버림, 아니면 가장 낮게
    if (last && trickPts === 0 && !isQueenOfSpades(c)) return 25 + val;
    return 10 - val - pts(c) * 3;
  }
  // 무늬가 없음: 점수 카드·높은 카드를 버림
  return 40 + pts(c) * 5 + val + (isQueenOfSpades(c) ? 50 : 0);
}

export const heartsBot: Bot<GameView, Move> = {
  thinkMs: [600, 1400],
  choose(ctx: BotContext<GameView>): Move {
    const v = ctx.view;
    if (v.phase === 'pass') {
      const ranked = [...v.hand].sort((a, b) => passScore(b, v.hand) - passScore(a, v.hand));
      // 쉬움은 무작위로 섞어서
      const pick = ctx.level === 'easy' ? [...v.hand].sort(() => ctx.rng() - 0.5) : ranked;
      return { type: 'pass', cards: pick.slice(0, 3).map((c) => c.id) };
    }
    const legal = v.hand.filter((c) => v.legal.includes(c.id));
    const scored: Scored<Move>[] = legal.map((c) => ({ move: { type: 'play', card: c.id }, score: playScore(c, v) }));
    return pickByLevel(scored, ctx.level, ctx.rng);
  },
};
