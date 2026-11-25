/**
 * 오목 봇: 모든 후보 자리를 「공격(내 줄) + 수비(상대 줄)」 모양 점수로 매김.
 *  - 이기는 수(오목)와 상대의 오목·열린 4 막기는 난이도와 상관없이 놓치지 않음 (어려움·보통)
 *  - 쉬움은 점수가 비슷한 자리 중에서 자주 덜 좋은 곳을 고름
 */
import { Bot, BotContext, pickByLevel } from '@bg/core';
import { Move, bestCells } from './game';
import { GameView } from './view';

export const stoneBot: Bot<GameView, Move> = {
  thinkMs: [500, 1300],
  choose(ctx: BotContext<GameView>): Move {
    const v = ctx.view;
    const n = v.config.size;
    const me = v.myStone ?? 0;
    if (v.moves === 0) {
      const c = Math.floor(n / 2);
      return { type: 'place', x: c, y: c };
    }
    const cells = bestCells(v.board, n, me, v.config.exactFive).slice(0, 12);
    // 결정적인 수(오목 완성·상대 오목/열린4 막기)는 쉬움이 아니면 바로
    if (ctx.level !== 'easy' && cells[0] && cells[0][2] >= 100_000) return { type: 'place', x: cells[0][0], y: cells[0][1] };
    return pickByLevel(
      cells.map(([x, y, score]) => ({ move: { type: 'place', x, y } as Move, score: Math.log10(1 + score) })),
      ctx.level,
      ctx.rng,
    );
  },
};
