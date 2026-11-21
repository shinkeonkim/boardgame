/**
 * 숨은 가시 봇 — 내 원판만 알고, 남의 원판은 행동으로 짐작.
 *  - 놓기: 가끔 가시로 함정 (쉬움은 아무렇게나, 어려움은 앞서거나 남들이 높게 부를 것 같을 때).
 *  - 부르기: 내 더미가 모두 장미면 그만큼은 확실 + 남의 맨 위 장미일 확률로 더 부름.
 *            내 더미에 가시가 있으면 이기면 안 되므로(내 것부터 뒤집음) 허풍으로만 올리다가 포기.
 *  - 뒤집기: 높게 부른 사람(장미일 가능성↑)·적게 쌓은 사람부터.
 *  - 잃기: 장미를 버리고 가시는 남겨 함정을 유지 (어려움).
 */
import { BotContext, Bot, Scored, pickByLevel } from '@bg/core';
import { Move } from './game';
import { GameView } from './view';

function topRoseProb(v: GameView, s: number, depth: number, level: string): number {
  // 이번 판에 높게 부른 사람은 장미를 쌓았을 가능성이 높다
  const bidder = v.log.some((e) => e.type === 'bid' && e.seat === s);
  const base = level === 'hard' && bidder ? 0.88 : level === 'easy' ? 0.7 : 0.75;
  return base ** depth;
}

/** 이길 수 있을 것 같은 최대 장미 수 (확률 0.5 이상으로 뒤집을 수 있는) */
function safeCount(v: GameView, level: string): number {
  if (v.myMat.includes('thorn')) return 0;
  let n = v.myMat.length;
  let p = 1;
  const depth = v.matCounts.map(() => 0);
  for (let k = 0; k < 20; k++) {
    let best = -1;
    let bp = 0;
    for (let s = 0; s < v.players; s++) {
      if (s === v.me || depth[s] >= v.matCounts[s]) continue;
      const pr = topRoseProb(v, s, depth[s] + 1, level) / (depth[s] ? topRoseProb(v, s, depth[s], level) : 1);
      if (pr > bp) {
        bp = pr;
        best = s;
      }
    }
    if (best < 0 || p * bp < 0.5) break;
    p *= bp;
    depth[best]++;
    n++;
  }
  return n;
}

export const thornBot: Bot<GameView, Move> = {
  thinkMs: [800, 1800],
  choose(ctx: BotContext<GameView>): Move {
    const v = ctx.view;
    const lv = ctx.level;
    const r = ctx.rng;
    const hasThorn = v.hand.includes('thorn');
    const hasRose = v.hand.includes('rose');
    const lead = v.points[v.me] >= Math.max(...v.points.filter((_, i) => i !== v.me));
    switch (v.phase) {
      case 'open':
      case 'turn': {
        const scored: Scored<Move>[] = [];
        const trap = lv === 'easy' ? 0.5 : lv === 'hard' ? (lead ? 0.45 : 0.3) : 0.3;
        if (hasThorn) scored.push({ move: { type: 'place', disc: 'thorn' }, score: r() < trap ? 6 : 1 });
        if (hasRose) scored.push({ move: { type: 'place', disc: 'rose' }, score: 4 });
        if (v.phase === 'turn' && v.total >= 1) {
          const safe = safeCount(v, lv);
          const want = Math.max(1, Math.min(v.total, safe));
          // 원판이 충분히 깔렸고 내가 안전하면 도전
          const ready = v.total >= Math.min(v.players + 1, v.total) && (safe >= Math.ceil(v.total / 2) || !hasRose);
          if (!v.myMat.includes('thorn')) scored.push({ move: { type: 'bid', count: want }, score: ready ? 5 + safe * 0.5 : 0 });
          else if (lv === 'hard' && !hasRose && !hasThorn) scored.push({ move: { type: 'bid', count: 1 }, score: 2 }); // 놓을 게 없으면 낮게 시작해 남을 유인
          if (!hasRose && !hasThorn && !scored.length) return { type: 'bid', count: 1 };
        }
        if (!scored.length) return { type: 'bid', count: 1 };
        return pickByLevel(scored, lv, r);
      }
      case 'bidding': {
        const cur = v.bid!.count;
        if (v.myMat.includes('thorn')) {
          // 허풍으로 한두 번 올려 남이 높게 부르게 만들고 포기
          const bluffTo = lv === 'hard' ? Math.min(v.total - 1, Math.floor(v.total * 0.6)) : cur;
          if (cur + 1 <= bluffTo && r() < 0.5) return { type: 'bid', count: cur + 1 };
          return { type: 'pass' };
        }
        const safe = safeCount(v, lv) + (lv === 'easy' ? Math.round(r() * 2) : 0);
        if (cur + 1 <= Math.min(safe, v.total)) return { type: 'bid', count: cur + 1 };
        return { type: 'pass' };
      }
      case 'flip': {
        const scored: Scored<Move>[] = [];
        const depth = v.flippedDiscs.map((f) => f.length);
        for (let s = 0; s < v.players; s++) {
          if (s === v.me || depth[s] >= v.matCounts[s]) continue;
          const p = topRoseProb(v, s, depth[s] + 1, lv);
          scored.push({ move: { type: 'flip', seat: s }, score: p * 10 - v.matCounts[s] * 0.3 });
        }
        return pickByLevel(scored, lv, r);
      }
      case 'lose': {
        if (lv !== 'easy' && v.myOwned.includes('rose') && v.myOwned.filter((d) => d === 'rose').length > 1) return { type: 'lose', disc: 'rose' };
        return { type: 'lose', disc: v.myOwned.includes('rose') ? 'rose' : 'thorn' };
      }
    }
  },
};
