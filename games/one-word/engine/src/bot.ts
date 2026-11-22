/**
 * 한 단어 봇 — 단어마다 붙은 연상 태그(Cipher Ops 단어 목록)를 쓴다.
 *  힌트: 정답의 태그 중 하나. 보통·어려움은 좌석마다 다른 태그를 골라 겹침(지워짐)을 피하고, 쉬움은 아무거나(잘 겹침).
 *  맞히기: 지워지지 않은 힌트가 태그에 많이 들어 있는 단어. 아무것도 안 맞으면 어려움은 넘기고 쉬움은 아무거나.
 */
import { Bot, BotContext, Scored, pickByLevel } from '@bg/core';
import { packWords, tagsOf } from '@bg/cipher-ops-engine';
import { Move, norm } from './game';
import { GameView } from './view';

const FALLBACK = ['느낌', '모양', '색', '소리', '생각'];

export const wordBot: Bot<GameView, Move> = {
  thinkMs: [1200, 3000],
  choose(ctx: BotContext<GameView>): Move {
    const v = ctx.view;
    if (v.phase === 'clue') {
      const tags = v.word ? tagsOf(v.word) : [];
      const pool = tags.length ? tags : FALLBACK;
      const i = ctx.level === 'easy' ? Math.floor(ctx.rng() * pool.length) : (v.me + v.card) % pool.length;
      return { type: 'clue', word: pool[i] };
    }
    const clues = v.clues.filter((c) => c.word && !c.erased).map((c) => norm(c.word!));
    const tried = new Set(v.results.map((r) => r.word));
    const scored: Scored<Move>[] = packWords(v.config.pack)
      .filter((w) => !tried.has(w))
      .map((w) => {
        const tags = tagsOf(w).map(norm);
        const hit = clues.filter((c) => tags.includes(c)).length;
        return { move: { type: 'guess', word: w } as Move, score: hit + ctx.rng() * 0.3 };
      });
    const best = Math.max(...scored.map((s) => s.score));
    if (best < 1 && ctx.level !== 'easy') return { type: 'pass' };
    return pickByLevel(scored, ctx.level, ctx.rng);
  },
};
