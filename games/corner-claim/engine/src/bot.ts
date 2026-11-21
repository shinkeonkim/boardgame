/**
 * 모서리 땅따먹기 봇.
 *  - 점수 = 조각 크기(큰 것부터 쓰기) + 새로 생기는 내 모서리 자리 + (어려움) 막는 상대 모서리 자리·초반엔 가운데로 뻗기.
 *  - 쉬움은 크기 위주로 대충, 보통은 모서리까지, 어려움은 견제까지.
 */
import { BotContext, Bot, Scored, pickByLevel } from '@bg/core';
import { colorCount, colorOwner } from './config';
import { Move, anchors, cellsOf, legalPlacements } from './game';
import { pieceById } from './pieces';
import { GameView } from './view';

export const claimBot: Bot<GameView, Move> = {
  thinkMs: [700, 1600],
  choose(ctx: BotContext<GameView>): Move {
    const v = ctx.view;
    const c = v.config;
    const n = c.size;
    const color = v.color;
    const lv = ctx.level;
    const m = { board: v.board, config: c, remaining: v.remaining };
    let options = legalPlacements(m, color);
    // 쉬움은 후보를 줄여 빨리
    if (lv === 'easy' && options.length > 120) options = options.filter((_, i) => i % 3 === 0);
    const mySeatColors = new Set(Array.from({ length: colorCount(c) }, (_, k) => k).filter((k) => colorOwner(c, v.players, k) === v.me || k === color));
    const oppAnchors = new Set<number>();
    if (lv === 'hard') for (let k = 0; k < colorCount(c); k++) if (!mySeatColors.has(k)) anchors(m, k).forEach((a) => oppAnchors.add(a));
    const placed = v.board.filter((x) => x === color).length;
    const center = (n - 1) / 2;
    const scored: Scored<Move>[] = options.map((p) => {
      const cells = cellsOf(p);
      const size = pieceById(p.piece)!.size;
      let s = size * (lv === 'easy' ? 2 : 1.6);
      if (lv !== 'easy') {
        // 새 모서리: 놓은 칸 주변 대각선 빈칸 중 내 변과 닿지 않는 곳
        const set = new Set(cells.map(([x, y]) => y * n + x));
        const at = (x: number, y: number) => (x < 0 || y < 0 || x >= n || y >= n ? -2 : set.has(y * n + x) ? color : v.board[y * n + x]);
        let corners = 0;
        for (const [x, y] of cells)
          for (const [dx, dy] of [
            [1, 1],
            [1, -1],
            [-1, 1],
            [-1, -1],
          ]) {
            const nx = x + dx;
            const ny = y + dy;
            if (at(nx, ny) !== -1) continue;
            if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([ex, ey]) => at(nx + ex, ny + ey) === color)) continue;
            corners++;
          }
        s += corners * 0.55;
      }
      if (lv === 'hard') {
        s += cells.filter(([x, y]) => oppAnchors.has(y * n + x)).length * 1.2;
        if (placed < 20) s -= cells.reduce((a, [x, y]) => a + Math.abs(x - center) + Math.abs(y - center), 0) / cells.length * 0.18;
      }
      if (lv === 'easy') s += ctx.rng() * 3;
      return { move: { type: 'place', ...p } as Move, score: s };
    });
    if (!scored.length) return { type: 'place', piece: v.remaining[color][0], orient: 0, x: 0, y: 0 };
    return pickByLevel(scored, lv, ctx.rng);
  },
};
