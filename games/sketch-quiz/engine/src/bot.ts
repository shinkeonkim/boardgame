/**
 * 그림 퀴즈 봇 — 그림은 못 그려서 그릴 차례엔 넘기고, 맞힐 땐 사람처럼 힌트로 후보를 좁혀 던진다.
 *  - 후보: 단어 묶음에서 글자 수·띄어쓰기가 같고, 보이는 초성·글자와 맞는 말 (이미 틀린 답은 뺌).
 *  - 어려움은 후보에서만, 쉬움은 가끔 엉뚱한 말도. 후보가 많으면 (그림을 "보고") 서두르지 않는다.
 */
import { Bot, BotContext } from '@bg/core';
import { choseong, Move, norm, wordPool } from './game';
import { GameView } from './view';

export const sketchBot: Bot<GameView, Move> = {
  thinkMs: [2500, 6000],
  choose(ctx: BotContext<GameView>): Move {
    const v = ctx.view;
    if (v.phase === 'reveal') return { type: 'next' };
    if (v.me === v.drawer) return { type: 'skip' };
    if (v.phase !== 'draw') return { type: 'timeup' };
    const pool = v.config.pack === 'custom' ? [] : wordPool(v.config);
    const tried = new Set(v.log.flatMap((e) => (e.type === 'guess' ? [norm(e.text)] : [])));
    const cand = pool.filter((w) => {
      const cs = [...w];
      if (cs.length !== v.slots.length || tried.has(norm(w))) return false;
      return v.slots.every((s, i) => (s.ch === null || s.ch === cs[i]) && (s.cho === null || s.cho === choseong(cs[i])));
    });
    const sloppy = ctx.level === 'easy' ? 0.35 : ctx.level === 'normal' ? 0.15 : 0;
    const src = cand.length && ctx.rng() >= sloppy ? cand : pool.length ? pool : ['몰라요'];
    // 후보가 많으면 한 번씩 쉬기 (단어 던지기를 줄임) — 맞히는 사람은 언제든 답할 수 있으니 「포기」 대신 짐작
    return { type: 'guess', text: src[Math.floor(ctx.rng() * src.length)] };
  },
};
