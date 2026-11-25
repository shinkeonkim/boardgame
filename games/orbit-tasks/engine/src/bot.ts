/**
 * 궤도 임무 봇 (협력): 과제 카드를 맡은 사람이 그 트릭을 가져가게 돕는다.
 *  - 고르기: 그 색의 높은 카드를 가졌거나 과제 카드를 직접 쥐고 있으면 그 과제를 맡음
 *  - 내기: 트릭에 과제 카드가 있으면 → 맡은 사람이 나면 이기는 카드, 남이면 그 사람을 앞지르지 않는 카드
 *          맡은 사람이 아직 안 냈으면 낮은 카드로 길을 비켜 줌. 과제가 없으면 낮은 카드, 로켓은 아낌
 *  - 내가 맡은 과제 카드를 내가 쥐고 있고 그 색에서 가장 높은 카드도 쥐었으면 먼저 내서 이김
 */
import { Bot, BotContext, Scored, pickByLevel } from '@bg/core';
import { Card, Move, ROCKET } from './game';
import { GameView } from './view';

const power = (c: Card) => (c.suit === ROCKET ? 100 + c.rank : c.rank);

function wins(card: Card, trick: { seat: number; card: Card }[]): boolean {
  if (!trick.length) return true;
  const led = trick[0].card.suit;
  const best = trick.reduce((b, p) => {
    const x = p.card;
    const y = b;
    if (x.suit === ROCKET && y.suit !== ROCKET) return x;
    if (x.suit === y.suit && x.rank > y.rank) return x;
    return y;
  }, trick[0].card);
  if (card.suit === ROCKET) return best.suit !== ROCKET || card.rank > best.rank;
  if (best.suit === ROCKET) return false;
  return card.suit === led && card.rank > best.rank;
}

function playScore(c: Card, v: GameView): number {
  const me = v.me;
  const open = v.tasks.filter((t) => !t.done);
  const trick = v.trick;
  const taskIn = open.find((t) => trick.some((p) => p.card.id === t.card.id) || t.card.id === c.id);
  const iWin = wins(c, trick);
  const played = new Set(trick.map((p) => p.seat));
  if (taskIn) {
    const owner = taskIn.owner!;
    if (owner === me) return iWin ? 50 + (c.suit === ROCKET ? -5 : 0) : -20 + power(c) / 20;
    // 남이 맡은 과제: 그 사람이 이미 이기고 있으면 앞지르지 말 것, 아직 안 냈으면 낮게 깔아 줌
    const ownerWinning = played.has(owner) && trick.length > 0 && (() => {
      const others = trick.filter((p) => p.seat !== owner);
      const ownerCard = trick.find((p) => p.seat === owner)!.card;
      return wins(ownerCard, others.length ? others : []) || others.every((p) => !wins(p.card, [{ seat: owner, card: ownerCard }]));
    })();
    if (c.id === taskIn.card.id && !(ownerWinning && !iWin)) return -60; // 과제 카드를 엉뚱하게 내지 않음
    if (iWin && !played.has(owner)) return -10 - power(c) / 10;
    if (iWin && played.has(owner)) return -50;
    return 30 - power(c) / 10;
  }
  // 과제와 무관한 트릭: 남의 과제 카드를 함부로 내지 않고, 내 과제 카드를 이길 준비가 되면 냄
  const mine = open.find((t) => t.card.id === c.id && t.owner === me);
  if (mine) return iWin && !trick.length ? 40 : -40;
  if (open.some((t) => t.card.id === c.id)) return -50;
  return 10 - power(c) / 10;
}

export const orbitBot: Bot<GameView, Move> = {
  thinkMs: [600, 1400],
  choose(ctx: BotContext<GameView>): Move {
    const v = ctx.view;
    if (v.phase === 'draft') {
      const free = v.tasks.filter((t) => t.owner === null);
      const scored: Scored<Move>[] = free.map((t) => {
        const own = v.hand.some((c) => c.id === t.card.id);
        const higher = v.hand.filter((c) => c.suit === t.card.suit && c.rank > t.card.rank).length;
        const rockets = v.hand.filter((c) => c.suit === ROCKET).length;
        return { move: { type: 'take', task: t.card.id }, score: (own ? 3 : 0) + higher * 2 + rockets + (t.card.rank <= 3 ? 1 : 0) };
      });
      return pickByLevel(scored, ctx.level, ctx.rng);
    }
    const legal = v.hand.filter((c) => v.legal.includes(c.id));
    return pickByLevel(
      legal.map((c) => ({ move: { type: 'play', card: c.id } as Move, score: playScore(c, v) })),
      ctx.level,
      ctx.rng,
    );
  },
};
