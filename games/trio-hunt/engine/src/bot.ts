/**
 * 셋 찾기 봇 — 기억력 봇.
 *  기억: 기록에 남은 공개 카드(id → 숫자). 어려움은 전부, 보통은 최근 30장, 쉬움은 최근 12장만 기억.
 *  첫 장: 숫자마다 「지금 닿을 수 있는 같은 숫자」를 센다 — 내 손패는 끝에서부터 연속으로(뒤집으면 다음 카드가 끝이 되므로),
 *        남의 손패 끝·가운데 카드는 기억나는 것만. 가장 많은 숫자부터 (내 카드부터 뒤집어 정보를 덜 줌).
 *  이어서: 같은 숫자로 기억나는 카드 → 없으면 그 숫자가 있을 법한 쪽 끝(작은 숫자면 low, 큰 숫자면 high)에 걸어 본다.
 */
import { Bot, BotContext, Scored, pickByLevel } from '@bg/core';
import { Move } from './game';
import { GameView } from './view';

function memory(v: GameView, level: string): Map<string, number> {
  const flips = v.log.flatMap((e) => (e.type === 'flip' ? [e.flip] : []));
  const keep = level === 'hard' ? flips : flips.slice(level === 'normal' ? -30 : -12);
  const mem = new Map<string, number>();
  for (const f of keep) mem.set(f.id, f.n);
  for (const c of v.hand) mem.set(c.id, c.n);
  for (const f of v.flips) mem.set(f.id, f.n);
  return mem;
}

/** 이 숫자를 지금 몇 장까지 연달아 뒤집을 수 있나 (아는 것만) + 첫 수 */
function reach(v: GameView, mem: Map<string, number>, n: number): { count: number; first: Move | null } {
  let count = 0;
  let first: Move | null = null;
  const take = (mv: Move) => {
    count++;
    first ??= mv;
  };
  // 내 손패: 양 끝에서 연속
  const mine = v.hand.filter((c) => !v.flips.some((f) => f.id === c.id));
  for (let i = 0; i < mine.length && mine[i].n === n; i++) take({ type: 'reveal', seat: v.me, end: 'low' });
  for (let i = mine.length - 1; i >= 0 && mine[i].n === n && count < 6; i--) if (mine[i].n === n && !(mine.every((c) => c.n === n))) take({ type: 'reveal', seat: v.me, end: 'high' });
  v.hands.forEach((h, s) => {
    if (s === v.me) return;
    if (h.lowId && mem.get(h.lowId) === n) take({ type: 'reveal', seat: s, end: 'low' });
    if (h.highId && h.highId !== h.lowId && mem.get(h.highId) === n) take({ type: 'reveal', seat: s, end: 'high' });
  });
  v.middle.forEach((id, idx) => {
    if (id && !v.flips.some((f) => f.id === id) && mem.get(id) === n) take({ type: 'reveal', seat: -1, idx });
  });
  return { count, first };
}

/** 지금 뒤집을 수 있는 아무 곳 */
function anyMove(v: GameView, rng: () => number): Move {
  const out: Move[] = [];
  v.hands.forEach((h, s) => {
    if (h.lowId) out.push({ type: 'reveal', seat: s, end: 'low' });
    if (h.highId && h.highId !== h.lowId) out.push({ type: 'reveal', seat: s, end: 'high' });
  });
  v.middle.forEach((id, idx) => {
    if (id && !v.flips.some((f) => f.id === id)) out.push({ type: 'reveal', seat: -1, idx });
  });
  return out[Math.floor(rng() * out.length)];
}

export const trioBot: Bot<GameView, Move> = {
  thinkMs: [700, 1500],
  choose(ctx: BotContext<GameView>): Move {
    const v = ctx.view;
    const mem = memory(v, ctx.level);
    if (!v.flips.length) {
      const scored: Scored<Move>[] = [];
      for (let n = 1; n <= 12; n++) {
        const r = reach(v, mem, n);
        if (r.first) scored.push({ move: r.first, score: r.count * 10 + (n === 7 && v.config.sevenWins ? 3 : 0) + ctx.rng() });
      }
      if (!scored.length) return anyMove(v, ctx.rng);
      return pickByLevel(scored, ctx.level, ctx.rng);
    }
    const n = v.flips[0].n;
    const r = reach(v, mem, n);
    if (r.first) return r.first;
    // 모르면 걸어 보기: 작은 숫자는 남의 low, 큰 숫자는 high, 아니면 모르는 가운데
    const end = n <= 6 ? 'low' : 'high';
    const others = v.hands.map((h, s) => ({ h, s })).filter(({ h, s }) => s !== v.me && (end === 'low' ? h.lowId : h.highId) && !mem.has((end === 'low' ? h.lowId : h.highId)!));
    if (others.length) return { type: 'reveal', seat: others[Math.floor(ctx.rng() * others.length)].s, end };
    const mids = v.middle.flatMap((id, idx) => (id && !v.flips.some((f) => f.id === id) && !mem.has(id) ? [idx] : []));
    if (mids.length) return { type: 'reveal', seat: -1, idx: mids[Math.floor(ctx.rng() * mids.length)] };
    // 다 아는 카드뿐이면 아무 곳이나 (틀림 확정이지만 규칙상 계속해야 함)
    return anyMove(v, ctx.rng);
  },
};
