/**
 * 고스톱 봇: 낼 카드마다 「먹을 수 있는 카드의 가치 + 점수가 새로 생기는 만큼」을 셈 (광·고도리 새·단 띠·쌍피를 아낌).
 * 바닥에 같은 달이 없으면 내 카드를 내주는 셈이라 값이 낮은 카드부터.
 * 고/스톱: 손패가 넉넉하고 상대 점수가 낮으면 고 (쉬움은 바로 스톱, 어려움은 고를 2번까지).
 */
import { Bot, BotContext, Scored, pickByLevel } from '@bg/core';
import { HCard, scoreCards } from './cards';
import { Move, cardValue } from './game';
import { GameView } from './view';

export const goStopBot: Bot<GameView, Move> = {
  thinkMs: [700, 1500],
  choose(ctx: BotContext<GameView>): Move {
    const v = ctx.view;
    const me = v.me;
    if (v.phase === 'gostop') {
      const left = v.hand.length;
      const oppMax = Math.max(...v.scores.filter((_, i) => i !== me));
      const maxGo = ctx.level === 'easy' ? 0 : ctx.level === 'normal' ? 1 : 2;
      const go = left >= 3 && v.goes[me] < maxGo && oppMax < v.goAt - 2;
      return { type: go ? 'go' : 'stop' };
    }
    const mine = v.captured[me];
    const base = scoreCards(mine).total;
    const scored: Scored<Move>[] = v.hand.map((c) => {
      const same = v.table.filter((t) => t.month === c.month);
      if (!same.length) return { move: { type: 'play', card: c.id }, score: -cardValue(c) * 0.6 };
      const target = same.length === 2 ? [...same].sort((a, b) => cardValue(b) - cardValue(a))[0] : null;
      const got: HCard[] = same.length === 3 ? [c, ...same] : [c, target ?? same[0]];
      const gain = scoreCards([...mine, ...got]).total - base;
      return { move: { type: 'play', card: c.id, ...(target ? { target: target.id } : {}) }, score: got.reduce((a, x) => a + cardValue(x), 0) + gain * 4 };
    });
    return pickByLevel(scored, ctx.level, ctx.rng);
  },
};
