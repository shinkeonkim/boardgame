/**
 * 영지 도미노 봇: 놓을 때는 점수가 가장 많이 오르는 자리(같은 땅끼리 붙이기·왕관 있는 구역 키우기),
 * 고를 때는 「내 왕국에 놓으면 오를 점수」가 큰 도미노 (같으면 번호가 작은 것 — 다음에 먼저 둠).
 */
import { Bot, BotContext, Scored, pickByLevel } from '@bg/core';
import { Kingdom, Move, legalPlacements, scoreKingdom } from './game';
import { Domino } from './tiles';
import { GameView } from './view';

const key = (x: number, y: number) => `${x},${y}`;

/** 이 도미노를 이 왕국에 가장 잘 놓았을 때의 점수와 같은 땅 이웃 수(앞으로의 가능성) */
function bestGain(k: Kingdom, d: Domino, size: number): { score: number; at: ReturnType<typeof legalPlacements>[number] | null } {
  const base = scoreKingdom(k).total;
  let best = { score: -5, at: null as ReturnType<typeof legalPlacements>[number] | null };
  for (const p of legalPlacements(k, d, size)) {
    const nk = { ...k, [key(p.x1, p.y1)]: d.a, [key(p.x2, p.y2)]: d.b };
    let s = scoreKingdom(nk).total - base;
    // 같은 땅과 많이 닿을수록 (구역을 키우는 중) 조금 더
    for (const [x, y, half] of [
      [p.x1, p.y1, d.a],
      [p.x2, p.y2, d.b],
    ] as const)
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const c = nk[key(x + dx, y + dy)];
        if (c && !('castle' in c) && c.t === half.t) s += 0.3;
      }
    if (s > best.score) best = { score: s, at: p };
  }
  return best;
}

export const domainBot: Bot<GameView, Move> = {
  thinkMs: [700, 1500],
  choose(ctx: BotContext<GameView>): Move {
    const v = ctx.view;
    const k = v.kingdoms[v.me];
    if (v.step === 'place') {
      const d = v.row[v.active].domino;
      const options = legalPlacements(k, d, v.config.size);
      if (!options.length) return { type: 'discard' };
      const base = scoreKingdom(k).total;
      const scored: Scored<Move>[] = options.map((p) => {
        const nk = { ...k, [key(p.x1, p.y1)]: d.a, [key(p.x2, p.y2)]: d.b };
        let s = scoreKingdom(nk).total - base;
        for (const [x, y, half] of [
          [p.x1, p.y1, d.a],
          [p.x2, p.y2, d.b],
        ] as const)
          for (const [dx, dy] of [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ]) {
            const c = nk[key(x + dx, y + dy)];
            if (c && !('castle' in c) && c.t === half.t) s += 0.3;
          }
        return { move: { type: 'place', ...p }, score: s };
      });
      return pickByLevel(scored, ctx.level, ctx.rng);
    }
    const scored: Scored<Move>[] = v.next.flatMap((slot, i) => (slot.claim === null ? [{ move: { type: 'claim', slot: i } as Move, score: bestGain(k, slot.domino, v.config.size).score + (48 - slot.domino.id) / 100 }] : []));
    return pickByLevel(scored, ctx.level, ctx.rng);
  },
};
