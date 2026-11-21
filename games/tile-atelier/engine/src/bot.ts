/**
 * 타일 공방 봇.
 *  - 가져오기 점수 = 줄을 채우면 벽에 놓일 자리의 인접 점수 + 진행 − 바닥으로 떨어질 감점(첫 플레이어 표시 포함).
 *  - 어려움: 위쪽 짧은 줄부터 채우고, 세로줄·색 보너스를 노리며, 다음 사람이 줄을 완성하는 데 필요한 색을 가로채기.
 *  - 자유 벽: 인접 점수가 가장 큰 칸.
 */
import { BotContext, Bot, Scored, pickByLevel } from '@bg/core';
import { wallCol } from './config';
import { Board, FIRST, Move, adjacency, lineProblem } from './game';
import { GameView } from './view';

function floorCost(v: GameView, b: Board, extra: number): number {
  let cost = 0;
  for (let k = 0; k < extra; k++) cost += v.config.floor[b.floor.length + k] ?? 0;
  return cost;
}

function bestCol(v: GameView, b: Board, row: number, color: number): number {
  const n = v.config.colors;
  if (!v.config.freeWall) return wallCol(n, row, color);
  let best = -1;
  let bp = -1;
  for (let col = 0; col < n; col++) {
    if (b.wall[row][col] !== null || b.wall.some((r) => r[col] === color)) continue;
    const w = b.wall.map((r) => [...r]);
    w[row][col] = color;
    const p = adjacency(w, row, col);
    if (p > bp) {
      bp = p;
      best = col;
    }
  }
  return best;
}

export const atelierBot: Bot<GameView, Move> = {
  thinkMs: [800, 1800],
  choose(ctx: BotContext<GameView>): Move {
    const v = ctx.view;
    const c = v.config;
    const b = v.boards[v.me];
    const lv = ctx.level;
    if (v.phase === 'wall') {
      const row = v.pendingRows[0];
      return { type: 'wall', row, col: bestCol(v, b, row, b.lines[row].color!) };
    }
    const scored: Scored<Move>[] = [];
    const sources = [-1, ...v.factories.map((_, i) => i)];
    const next = (v.me + 1) % v.players;
    for (const source of sources) {
      const pool = source === -1 ? v.center : v.factories[source];
      const firstMarker = source === -1 && v.center.includes(FIRST) ? 1 : 0;
      for (const color of [...new Set(pool.filter((t) => t !== FIRST))]) {
        const n = pool.filter((t) => t === color).length;
        for (let line = -1; line < c.colors; line++) {
          if (lineProblem(c, b, line, color)) continue;
          let s = 0;
          let overflow = n;
          if (line >= 0) {
            const l = b.lines[line];
            const room = line + 1 - l.count;
            const put = Math.min(room, n);
            overflow = n - put;
            const done = l.count + put === line + 1;
            if (done) {
              const col = bestCol(v, b, line, color);
              const w = b.wall.map((r) => [...r]);
              if (col >= 0) w[line][col] = color;
              s += (col >= 0 ? adjacency(w, line, col) : 0) + 1.5;
              if (lv === 'hard' && col >= 0) {
                // 세로줄·색 보너스 진행
                s += w.filter((r) => r[col] !== null).length * 0.5 + w.flat().filter((x) => x === color).length * 0.4;
              }
            } else s += put * 0.6 - (lv === 'hard' ? (line + 1 - l.count - put) * 0.15 : 0);
            if (lv === 'hard') s += (c.colors - line) * 0.12; // 짧은 줄 우선
          } else s -= 0.5;
          s += floorCost(v, b, overflow + firstMarker) * (lv === 'easy' ? 0.6 : 1.1);
          if (firstMarker && lv === 'hard' && v.factories.every((f) => !f.length)) s += 0.5; // 마지막엔 첫 플레이어가 이득
          // 가로채기: 다음 사람이 이 색으로 줄을 바로 채울 수 있으면
          if (lv === 'hard') {
            const nb = v.boards[next];
            for (let L = 0; L < c.colors; L++) {
              const nl = nb.lines[L];
              if (nl.color === color && L + 1 - nl.count <= n) s += 0.8;
            }
          }
          scored.push({ move: { type: 'take', source, color, line }, score: s });
        }
      }
    }
    if (!scored.length) {
      const pool = v.center.filter((t) => t !== FIRST);
      return { type: 'take', source: -1, color: pool[0] ?? 0, line: -1 };
    }
    return pickByLevel(scored, lv, ctx.rng);
  },
};
