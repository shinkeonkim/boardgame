/**
 * 암호 작전 봇 — 단어마다 붙은 연상 태그(words.ts)로 힌트를 주고 맞힌다.
 *  - 팀장: 우리 팀 단어들이 함께 가진 태그 중에서, 암살자·상대·중립 단어가 가진 태그는 피하고
 *          가장 많이 묶이는 태그를 힌트로 (어려움은 위험을 엄격히, 쉬움은 한 단어짜리 힌트를 자주).
 *  - 요원: 힌트 단어를 태그로 가진 단어를 고른다. 사람이 태그에 없는 힌트를 주면 이름이 비슷한 단어,
 *          그것도 없으면 무리하지 않고 그만 고른다. (어려움) 지난 힌트에서 못 맞힌 단어도 기억해 노린다.
 *  - 같은 팀 사람 요원이 있으면 의논을 기다린다 (deferToHumans).
 */
import { BotContext, Bot, Scored, pickByLevel } from '@bg/core';
import { Move, Team, clueProblem } from './game';
import { GameView } from './view';
import { tagsOf } from './words';

function spymasterMove(ctx: BotContext<GameView>): Move {
  const v = ctx.view;
  const team = v.myTeam!;
  const open = v.words.map((w, i) => ({ w, i, k: v.key[i] })).filter((x) => v.revealed[x.i] === null);
  const mine = open.filter((x) => x.k === team);
  const tagCount = new Map<string, { mine: number[]; opp: number; neutral: number; assassin: number }>();
  for (const x of open) {
    for (const t of tagsOf(x.w)) {
      const rec = tagCount.get(t) ?? { mine: [], opp: 0, neutral: 0, assassin: 0 };
      if (x.k === team) rec.mine.push(x.i);
      else if (x.k === 'X') rec.assassin++;
      else if (x.k === 'N') rec.neutral++;
      else rec.opp++;
      tagCount.set(t, rec);
    }
  }
  const scored: Scored<Move>[] = [];
  for (const [tag, r] of tagCount) {
    if (!r.mine.length || clueProblem(v, tag)) continue;
    const risk = r.assassin * (ctx.level === 'easy' ? 6 : 100) + r.opp * (ctx.level === 'hard' ? 9 : 6) + r.neutral * 3;
    // 묶은 수만큼 이득, 위험이 있으면 숫자를 줄여 안전한 만큼만
    const count = ctx.level === 'easy' ? 1 : Math.max(1, r.mine.length - (r.opp + r.assassin > 0 ? 1 : 0));
    const s = r.mine.length * 10 - risk + (ctx.level === 'easy' ? ctx.rng() * 8 : 0);
    scored.push({ move: { type: 'clue', word: tag, count: Math.min(count, mine.length) }, score: s });
  }
  if (!scored.length) {
    // 태그가 없는 사용자 단어뿐: 우리 단어 하나의 첫 글자로 (최후의 수단)
    for (const x of mine) {
      const hint = `${x.w.slice(0, 1)}로시작`;
      if (!clueProblem(v, hint)) return { type: 'clue', word: hint, count: 1 };
    }
    return { type: 'end' };
  }
  return pickByLevel(scored, ctx.level, ctx.rng);
}

function operativeMove(ctx: BotContext<GameView>): Move {
  const v = ctx.view;
  const clue = v.clue!;
  const open = v.words.map((w, i) => ({ w, i })).filter((x) => v.revealed[x.i] === null);
  const matchScore = (w: string, word: string) => {
    if (tagsOf(w).includes(word)) return 10;
    if (word.length >= 2 && (w.includes(word.slice(0, 2)) || word.includes(w.slice(0, 2)))) return 4;
    return 0;
  };
  // 이번 힌트로 아직 더 맞힐 게 남았는지
  const hitsSoFar = clue.hits.length;
  const intended = clue.count === 0 || clue.count === 99 ? 9 : clue.count;
  const scored: Scored<Move>[] = open.map((x) => {
    let s = matchScore(x.w, clue.word);
    if (ctx.level === 'hard') {
      // 지난 우리 팀 힌트 중 덜 맞힌 것의 남은 단어
      for (const old of v.clues) {
        if (old.team !== v.myTeam || old === clue) continue;
        const left = (old.count === 99 ? 9 : old.count) - old.hits.length;
        if (left > 0 && matchScore(x.w, old.word) >= 10) s = Math.max(s, 6);
      }
    }
    return { move: { type: 'guess', index: x.i } as Move, score: s + (ctx.level === 'easy' ? ctx.rng() * 6 : ctx.rng() * 0.5) };
  });
  const best = Math.max(...scored.map((x) => x.score));
  // 확신이 없으면 그만 (이미 하나라도 맞혔거나, 이번 힌트 몫을 다 맞혔으면)
  const done = hitsSoFar >= intended;
  const threshold = ctx.level === 'hard' ? 6 : ctx.level === 'normal' ? 5 : 3;
  if ((done && best < 10) || (best < threshold && hitsSoFar > 0) || (done && ctx.level !== 'easy' && hitsSoFar > intended)) return { type: 'end' };
  if (best < threshold && hitsSoFar === 0 && ctx.level !== 'easy') return { type: 'end' };
  return pickByLevel(scored, ctx.level, ctx.rng);
}

export const cipherBot: Bot<GameView, Move> = {
  thinkMs: [1500, 3000],
  deferToHumans: true,
  choose(ctx) {
    return ctx.view.phase === 'clue' ? spymasterMove(ctx) : operativeMove(ctx);
  },
};
