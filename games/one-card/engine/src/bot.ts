/**
 * 원카드 봇.
 *  - 공격을 받으면: 막을 수 있으면 (어려움은 상대 카드가 적을 때만 아끼지 않고) 막고, 아니면 받는다.
 *  - 평소: 공격 카드·조커는 아껴 두고(막기용), 같은 무늬가 많은 카드부터. 다음 사람 카드가 적으면 공격·J로 견제.
 *  - 7은 내 손에 가장 많은 무늬로. K는 다음에 낼 카드가 있을 때.
 *  - 원카드 창: 내가 한 장이면 외치고(쉬움은 가끔 깜빡), 남이면 잡는다(어려움일수록 자주).
 */
import { Bot, BotContext, Scored, pickByLevel } from '@bg/core';
import { attackOf, isJoker, mostSuit } from './game';
import { Move } from './game';
import { GameView } from './view';

export const oneCardBot: Bot<GameView, Move> = {
  thinkMs: [700, 1600],
  choose(ctx: BotContext<GameView>): Move {
    const v = ctx.view;
    const lv = ctx.level;
    if (v.phase === 'call') {
      const mine = v.callFor === v.me;
      const p = mine ? (lv === 'easy' ? 0.7 : 0.97) : lv === 'hard' ? 0.75 : lv === 'normal' ? 0.45 : 0.15;
      return ctx.rng() < p ? { type: 'call' } : { type: 'pass' };
    }
    const hand = v.hand;
    const play = hand.filter((c) => v.playable.includes(c.id));
    if (!play.length) return { type: 'draw' };
    const live = Array.from({ length: v.players }, (_, i) => i).filter((s) => !v.out.includes(s));
    const idx = live.indexOf(v.me);
    const next = live[(idx + (v.dir === 1 ? 1 : live.length - 1)) % live.length];
    const danger = v.handCounts[next] <= 2;
    const suitCount = [0, 0, 0, 0];
    for (const c of hand) if (!isJoker(c)) suitCount[c.suit]++;
    const scored: Scored<Move>[] = [];
    if (v.attack > 0) {
      for (const c of play) scored.push({ move: { type: 'play', cardId: c.id }, score: 10 - (attackOf(v.config, c)?.power ?? 0) });
      // 받기: 공격이 작고 손이 적으면 받아도 괜찮다
      scored.push({ move: { type: 'draw' }, score: v.attack <= 2 && hand.length <= 3 && lv !== 'hard' ? 9 : 2 });
      return pickByLevel(scored, lv, ctx.rng);
    }
    for (const c of play) {
      const a = attackOf(v.config, c);
      let s = 5;
      if (a) s += danger ? 6 : -4; // 공격은 아끼되, 다음 사람이 곧 끝나면 쓴다
      if (isJoker(c)) s += danger ? 3 : -5;
      if (!isJoker(c)) s += suitCount[c.suit] * 0.6; // 같은 무늬가 많으면 그 무늬를 이어 가기 쉬움
      if (!isJoker(c) && c.rank === 11 && v.config.jack) s += danger ? 4 : 0.5;
      if (!isJoker(c) && c.rank === 13 && v.config.king) s += play.length > 1 ? 2 : -3;
      if (!isJoker(c) && c.rank === 7 && v.config.seven) s += suitCount[c.suit] <= 1 ? 2 : -1;
      scored.push({ move: { type: 'play', cardId: c.id, suit: mostSuit(hand.filter((x) => x.id !== c.id)) }, score: s });
    }
    return pickByLevel(scored, lv, ctx.rng);
  },
};
