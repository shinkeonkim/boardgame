/**
 * 숫자 금고 봇 — 보이는 정보(색·공개된 숫자·내 타일·틀린 추측 기록)로 가려진 타일의 후보를 좁힌다.
 *  - 후보가 가장 적은 타일을 골라 맞힌다 (확률 = 1/후보 수).
 *  - 맞힌 뒤 계속할지: 어려움은 다음 확률이 높거나 질 게 적을 때(이번에 뽑은 타일이 없으면 더 신중),
 *    보통은 확실할 때만, 쉬움은 반반.
 *  - 쉬움은 순서 제약을 덜 써서 후보를 넓게 본다.
 */
import { BotContext, Bot, pickOne } from '@bg/core';
import { Move } from './game';
import { GameView, candidates } from './view';

function bestGuess(ctx: BotContext<GameView>) {
  const v = ctx.view;
  let best: { target: number; tileId: string; values: number[] } | null = null;
  for (let target = 0; target < v.players; target++) {
    if (target === v.me || v.rows[target].every((t) => t.revealed)) continue;
    const cand = candidates(v, v.me, target);
    for (const [tileId, values] of cand) {
      let vals = values;
      if (ctx.level === 'easy') {
        // 쉬움: 색만 맞추고 순서 제약은 대충 (후보를 넓힘)
        const t = v.rows[target].find((x) => x.id === tileId)!;
        vals = Array.from({ length: v.config.maxNumber + 1 }, (_, n) => n).filter((n) => !v.rows.some((row) => row.some((x) => x.n === n && x.color === t.color)));
        if (!vals.length) vals = values;
      }
      if (!best || vals.length < best.values.length || (vals.length === best.values.length && ctx.rng() < 0.3)) best = { target, tileId, values: vals };
    }
  }
  return best;
}

export const vaultBot: Bot<GameView, Move> = {
  thinkMs: [900, 2000],
  choose(ctx) {
    const v = ctx.view;
    const me = v.me;
    if (v.phase === 'draw') {
      // 색 고르기: 내 줄에 덜 있는 색 (상대가 덜 추리하게) — 어려움만
      if (!v.config.chooseColor) return { type: 'draw' };
      const [b, w] = v.poolCount;
      if (!b) return { type: 'draw', color: 1 };
      if (!w) return { type: 'draw', color: 0 };
      if (ctx.level === 'hard') {
        const mine = v.rows[me];
        return { type: 'draw', color: mine.filter((t) => t.color === 0).length > mine.filter((t) => t.color === 1).length ? 1 : 0 };
      }
      return { type: 'draw', color: ctx.rng() < 0.5 ? 0 : 1 };
    }
    if (v.phase === 'place') return { type: 'place', index: Math.floor(ctx.rng() * (v.rows[me].length + 1)) };
    if (v.phase === 'reveal') {
      // 공개해도 덜 아픈 타일: 이미 거의 알려진 것 (양 끝)
      const hidden = v.rows[me].filter((t) => !t.revealed);
      return { type: 'reveal', tileId: (ctx.level === 'easy' ? pickOne(ctx.rng, hidden) : hidden[0]).id };
    }
    const g = bestGuess(ctx);
    if (!g) return { type: 'stop' };
    if (v.phase === 'continue') {
      const p = 1 / g.values.length;
      const risk = v.pending ? 1 : 0.6; // 뽑은 타일이 없으면 틀릴 때 내 타일을 공개해야 하니 덜 위험(이미 정한 것)
      const go = ctx.level === 'hard' ? p >= 0.5 || (p >= 0.34 && v.rows[me].filter((t) => !t.revealed).length > 3) : ctx.level === 'normal' ? p >= 0.99 : ctx.rng() < 0.5;
      if (!go || p * risk < 0.2) return { type: 'stop' };
    }
    const value = ctx.level === 'easy' ? pickOne(ctx.rng, g.values) : g.values[Math.floor(ctx.rng() * g.values.length)];
    return { type: 'guess', target: g.target, tileId: g.tileId, value };
  },
};
