/**
 * 침묵의 숫자 봇: 「내 가장 낮은 카드 - 맨 위 카드」 만큼 기다렸다가 냄 (간격이 클수록 오래 기다림).
 * 남은 카드가 많으면 숫자가 촘촘하니 한 칸당 시간을 줄임. 쉬움은 시간 감각이 흔들리고, 어려움은 정확.
 * 수리검: 누가 먼저 쓰자고 하면, 내 가장 낮은 카드가 맨 위와 많이 떨어져 있을 때(기다리기 불안할 때) 동의.
 */
import { Bot, BotContext } from '@bg/core';
import { Move } from './game';
import { GameView } from './view';

export const mindBot: Bot<GameView, Move> = {
  thinkMs: [300, 600],
  choose(ctx: BotContext<GameView>): Move {
    const v = ctx.view;
    const low = v.hand[0];
    if (low === undefined) return { type: 'wait' };
    const gap = low - v.top;
    // 수리검: 남이 제안했고, 내 간격이 크면(기다리기 불안) 동의
    if (v.stars > 0 && v.starVotes.some(Boolean) && !v.starVotes[v.me] && gap > 25) return { type: 'star', on: true };
    // 한 칸(숫자 1)당 기다리는 시간: 남은 카드가 많을수록 짧게
    const density = Math.max(1, v.remaining);
    const perStep = Math.max(80, Math.min(260, 2600 / density));
    const noise = ctx.level === 'easy' ? 0.45 : ctx.level === 'normal' ? 0.2 : 0.08;
    const want = gap * perStep * (1 + (ctx.rng() * 2 - 1) * noise);
    return v.sinceMs >= want ? { type: 'play' } : { type: 'wait' };
  },
};
