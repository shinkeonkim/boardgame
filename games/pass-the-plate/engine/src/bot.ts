/**
 * 접시 돌리기 봇 — 지금 손패에서 내 앞 카드에 더했을 때 늘어나는 점수(한계 가치)를 어림해 고른다.
 *  - 짝·세트를 채우면 큰 가치, 시작만 하는 카드는 남은 차례가 많을 때만.
 *  - 겨자는 뒤에 초밥이 올 시간이 있을 때, 초밥은 쓰지 않은 겨자가 있으면 ×3.
 *  - 김밥은 다른 사람 줄 수와 비교 (어려움), 푸딩은 마지막 판일수록·뒤처질수록.
 *  - 젓가락이 있으면 좋은 카드 2장을 한 번에 (보통·어려움).
 *  - 어려움: 다음 사람이 노리는 카드(회 2개 → 3번째)를 가로채는 값도 더함.
 */
import { BotContext, Bot, Scored, pickByLevel } from '@bg/core';
import { DUMPLING_SCORE, Dish, MAKI_ROLLS, NIGIRI } from './cards';
import { Move, Played } from './game';
import { GameView } from './view';

function value(t: Played[], dish: Dish, left: number, v: GameView, level: string): number {
  const n = (d: Dish) => t.filter((p) => p.dish === d).length;
  switch (dish) {
    case 'tempura':
      return n('tempura') % 2 === 1 ? 5 : left >= 2 ? 2.2 : 0.2;
    case 'sashimi': {
      const k = n('sashimi') % 3;
      return k === 2 ? 10 : k === 1 ? (left >= 2 ? 4 : 0.3) : left >= 3 ? 2.4 : 0.2;
    }
    case 'dumpling': {
      const k = Math.min(5, n('dumpling'));
      return k >= 5 ? 0 : DUMPLING_SCORE[k + 1] - DUMPLING_SCORE[k];
    }
    case 'egg':
    case 'salmon':
    case 'squid': {
      const base = NIGIRI[dish]!;
      return t.some((p) => p.dish === 'wasabi' && !p.used) ? base * 3 : base;
    }
    case 'wasabi':
      return left >= 3 ? 3.5 : left === 2 ? 1.5 : 0;
    case 'chopsticks':
      return left >= 4 ? 2 : 0;
    case 'pudding': {
      const last = v.round >= v.config.rounds;
      const mine = v.puddings[v.me] + n('pudding');
      const others = v.puddings.filter((_, i) => i !== v.me);
      const behind = others.length ? Math.max(...others) - mine : 0;
      return (last ? 3 : 2) + (level === 'hard' ? Math.max(0, behind) * 0.6 : 0);
    }
    case 'maki1':
    case 'maki2':
    case 'maki3': {
      const rolls = MAKI_ROLLS[dish]!;
      if (level !== 'hard') return rolls * 1.2;
      const mine = t.reduce((a, p) => a + (MAKI_ROLLS[p.dish] ?? 0), 0);
      const best = Math.max(0, ...v.tableaus.map((tt, i) => (i === v.me || !tt ? 0 : tt.reduce((a, p) => a + (MAKI_ROLLS[p.dish] ?? 0), 0))));
      if (mine + rolls > best && mine <= best) return 4 + rolls; // 1등을 빼앗음
      return rolls * 1.1;
    }
  }
}

/** 다음 사람이 이 카드를 얼마나 원할지 (가로채기) */
function denial(v: GameView, dish: Dish, left: number): number {
  const next = (v.me + v.dir + v.players) % v.players;
  const t = v.tableaus[next];
  if (!t) return 0;
  return Math.max(0, value(t, dish, left - 1, { ...v, me: next }, 'normal') - 2) * 0.4;
}

export const plateBot: Bot<GameView, Move> = {
  thinkMs: [600, 1400],
  choose(ctx: BotContext<GameView>): Move {
    const v = ctx.view;
    const t = v.tableaus[v.me] ?? [];
    const left = v.hand.length;
    const val = (d: Dish) => value(t, d, left, v, ctx.level) + (ctx.level === 'hard' ? denial(v, d, left) : 0);
    const scored: Scored<Move>[] = v.hand.map((c) => ({ move: { type: 'pick', cardId: c.id }, score: val(c.dish) }));
    if (v.canChopsticks && ctx.level !== 'easy') {
      const ranked = [...v.hand].sort((a, b) => val(b.dish) - val(a.dish));
      const [a, b] = ranked;
      // 두 번째 카드의 가치가 젓가락을 다시 넘기는 손해보다 크면
      if (b && val(b.dish) >= 3) {
        const after = [...t, { ...a }];
        const second = value(after, b.dish, left - 1, v, ctx.level);
        scored.push({ move: { type: 'pick', cardId: a.id, second: b.id }, score: val(a.dish) + second - 1.5 });
      }
    }
    return pickByLevel(scored, ctx.level, ctx.rng);
  },
};
