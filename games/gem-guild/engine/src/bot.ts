/**
 * 보석 상단 봇.
 *  - 목표 카드: (점수 + 보너스 쓸모 + 귀족에 가까워짐) ÷ (모자란 보석을 모으는 데 걸릴 차례)가 가장 큰 카드.
 *  - 살 수 있으면 가치 높은 카드부터 사고, 아니면 목표에 모자란 색 위주로 보석을 가져온다.
 *  - 보석이 넘칠 것 같거나 목표가 1~2개 모자라면 예약(황금도 받음). 어려움은 남이 곧 살 3점 이상 카드를 막기 위해 예약.
 */
import { BotContext, Bot, Scored, pickByLevel } from '@bg/core';
import { DevCard, GEMS, GOLD, Gem } from './cards';
import { Move } from './game';
import { GameView } from './view';

function missing(v: GameView, card: DevCard, seat: number): number[] {
  const s = v.seats[seat];
  return GEMS.map((g) => Math.max(0, card.cost[g] - s.bonuses[g] - s.tokens[g]));
}

function bonusUse(v: GameView, g: Gem, seat: number): number {
  const s = v.seats[seat];
  let use = 0;
  for (const c of v.market.flat()) if (c.cost[g] > s.bonuses[g]) use += 0.25;
  for (const n of v.nobles) if (n.need[g] > s.bonuses[g]) use += 0.6;
  return use;
}

function cardValue(v: GameView, c: DevCard, seat: number, level: string): number {
  let val = c.points * 2.2 + bonusUse(v, c.bonus, seat) * (level === 'easy' ? 0.5 : 1);
  // 귀족 완성에 바로 닿으면
  const b = [...v.seats[seat].bonuses];
  b[c.bonus]++;
  for (const n of v.nobles) if (n.need.every((x, i) => b[i] >= x)) val += 6;
  // 막바지엔 점수만
  if (v.finalRound || v.seats[seat].points >= v.config.winPoints - 4) val += c.points * 2;
  return val;
}

export const guildBot: Bot<GameView, Move> = {
  thinkMs: [900, 2000],
  choose(ctx: BotContext<GameView>): Move {
    const v = ctx.view;
    const me = v.me;
    const s = v.seats[me];
    const lv = ctx.level;
    if (v.phase === 'discard') {
      // 목표에 덜 필요한 색부터
      const target = [...v.market.flat(), ...(s.reserved ?? [])].sort((a, b) => cardValue(v, b, me, lv) - cardValue(v, a, me, lv))[0];
      const need = target ? target.cost : [0, 0, 0, 0, 0];
      const gems = [0, 0, 0, 0, 0, 0];
      let over = v.over;
      const order = [0, 1, 2, 3, 4].sort((a, b) => s.tokens[b] - need[b] - (s.tokens[a] - need[a]));
      for (const g of order) {
        while (over > 0 && s.tokens[g] - gems[g] > 0 && s.tokens[g] - gems[g] > (need[g] ?? 0)) {
          gems[g]++;
          over--;
        }
      }
      for (let g = 0; g < 6 && over > 0; g++)
        while (over > 0 && s.tokens[g] - gems[g] > 0) {
          gems[g]++;
          over--;
        }
      return { type: 'discard', gems };
    }
    if (v.phase === 'noble') return { type: 'noble', nobleId: v.eligibleNobles[0].id };

    const scored: Scored<Move>[] = [];
    const all = [...v.market.flat(), ...(s.reserved ?? [])];
    // 사기
    for (const c of all) if (v.affordable.includes(c.id)) scored.push({ move: { type: 'buy', cardId: c.id }, score: 4 + cardValue(v, c, me, lv) });
    // 목표 고르기
    const ranked = all
      .map((c) => {
        const miss = missing(v, c, me).reduce((a, b) => a + b, 0) - s.tokens[GOLD];
        const turns = Math.max(0, Math.ceil(Math.max(0, miss) / 2.6));
        return { c, miss, score: cardValue(v, c, me, lv) / (turns + 1) };
      })
      .sort((a, b) => b.score - a.score);
    const target = ranked[0];
    // 보석 가져오기
    const tokenRoom = v.config.tokenLimit - s.tokens.reduce((a, b) => a + b, 0);
    if (target) {
      const miss = missing(v, target.c, me);
      const colors = GEMS.filter((g) => v.bank[g] > 0).sort((a, b) => miss[b] - miss[a] || v.bank[b] - v.bank[a]);
      const three = colors.slice(0, 3);
      const useful = three.reduce((a: number, g) => a + Math.min(1, miss[g]), 0);
      if (three.length) scored.push({ move: { type: 'take', gems: three }, score: 2 + useful * 1.5 - Math.max(0, three.length - tokenRoom) * 1.2 });
      const two = GEMS.find((g) => miss[g] >= 2 && v.bank[g] >= v.config.takeTwoMin);
      if (two !== undefined) scored.push({ move: { type: 'take', gems: [two, two] }, score: 2 + 3 - Math.max(0, 2 - tokenRoom) * 1.2 });
      // 예약
      if ((s.reserved?.length ?? 0) < v.config.maxReserve && v.market.flat().includes(target.c) && target.miss > 0 && target.miss <= 3)
        scored.push({ move: { type: 'reserve', cardId: target.c.id }, score: 2.5 + (v.bank[GOLD] > 0 ? 1 : 0) + (tokenRoom <= 1 ? 2 : 0) });
    }
    // 어려움: 남이 곧 살 비싼 카드 막기
    if (lv === 'hard' && (s.reserved?.length ?? 0) < v.config.maxReserve) {
      for (const c of v.market.flat()) {
        if (c.points < 3) continue;
        for (let o = 0; o < v.players; o++) {
          if (o === me) continue;
          const miss = missing(v, c, o).reduce((a, b) => a + b, 0) - v.seats[o].tokens[GOLD];
          if (miss <= 0) scored.push({ move: { type: 'reserve', cardId: c.id }, score: 3 + c.points });
        }
      }
    }
    if (!scored.length) {
      const colors = GEMS.filter((g) => v.bank[g] > 0).slice(0, 3);
      if (colors.length) return { type: 'take', gems: colors };
      const any = v.market.flat()[0];
      if (any) return { type: 'reserve', cardId: any.id };
      const tier = v.deckCounts.findIndex((d) => d > 0);
      return { type: 'reserve', tier: (tier + 1) as 1 | 2 | 3 };
    }
    return pickByLevel(scored, lv, ctx.rng);
  },
};
