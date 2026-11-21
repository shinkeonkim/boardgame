/**
 * 허풍 주사위 봇 — 내 주사위와 남은 주사위 수만 안다.
 *  - 어떤 호가가 참일 확률 = 내 주사위 중 맞는 개수 + 모르는 주사위에서 나올 개수의 이항분포 꼬리.
 *  - 지금 호가가 참일 확률이 낮으면 「거짓말!」, 거의 정확히 맞을 것 같으면 「딱 맞다!」.
 *  - 아니면 참일 확률이 높은 호가로 올린다 (내가 가진 숫자 위주 + 가끔 허풍).
 *  - 어려움: 다른 사람이 같은 숫자를 불렀으면 그 사람이 그 숫자를 가졌다고 보고 확률을 올린다.
 */
import { BotContext, Bot, Scored, pickByLevel } from '@bg/core';
import { Move } from './game';
import { GameView } from './view';

function binomTail(n: number, p: number, k: number): number {
  if (k <= 0) return 1;
  if (k > n) return 0;
  let sum = 0;
  let c = 1;
  for (let i = 0; i <= n; i++) {
    if (i > 0) c = (c * (n - i + 1)) / i;
    if (i >= k) sum += c * p ** i * (1 - p) ** (n - i);
  }
  return Math.min(1, sum);
}
function binomExact(n: number, p: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let c = 1;
  for (let i = 1; i <= k; i++) c = (c * (n - i + 1)) / i;
  return c * p ** k * (1 - p) ** (n - k);
}

/** 이 숫자가 모르는 주사위에서 나올 확률 */
const pFace = (v: GameView, face: number) => (v.wild && face !== 1 ? 2 : 1) / v.config.faces;
const mine = (v: GameView, face: number) => v.myDice.filter((d) => d === face || (v.wild && face !== 1 && d === 1)).length;

/** 다른 사람 호가에서 읽은 덤 (어려움): 그 숫자를 부른 사람마다 +0.6개 */
function readBids(v: GameView, face: number, level: string): number {
  if (level !== 'hard') return 0;
  const callers = new Set(v.bids.filter((b) => b.seat !== v.me && b.face === face).map((b) => b.seat));
  return Math.min(callers.size * 0.6, 2.5);
}

function truthProb(v: GameView, count: number, face: number, level: string): number {
  const unknown = v.total - v.myDice.length;
  const need = count - mine(v, face) - Math.round(readBids(v, face, level));
  return binomTail(unknown, pFace(v, face), need);
}

export const bluffBot: Bot<GameView, Move> = {
  thinkMs: [900, 2200],
  choose(ctx: BotContext<GameView>): Move {
    const v = ctx.view;
    const lv = ctx.level;
    if (v.phase === 'reveal') return { type: 'roll' };
    const prev = v.bids[v.bids.length - 1];
    const scored: Scored<Move>[] = [];
    if (prev) {
      const pTrue = truthProb(v, prev.count, prev.face, lv);
      const threshold = lv === 'hard' ? 0.42 : lv === 'normal' ? 0.35 : 0.25;
      scored.push({ move: { type: 'challenge' }, score: (1 - pTrue) * 10 + (pTrue < threshold ? 3 : -3) });
      if (v.config.exactCall) {
        const unknown = v.total - v.myDice.length;
        const pExact = binomExact(unknown, pFace(v, prev.face), prev.count - mine(v, prev.face) - Math.round(readBids(v, prev.face, lv)));
        if (lv !== 'easy' && pExact > 0.32) scored.push({ move: { type: 'exact' }, score: pExact * 12 });
      }
    }
    for (let face = 1; face <= v.config.faces; face++) {
      const min = v.minCounts[face];
      if (min === null || min > v.total) continue;
      for (let count = min; count <= Math.min(v.total, min + 2); count++) {
        const p = truthProb(v, count, face, lv);
        // 다음 사람이 거짓말이라고 부를 위험 = 1-p, 너무 낮은 호가는 다음 사람에게 쉬운 판을 주므로 약간 감점
        let s = p * 10 - (count - min) * 0.8;
        if (mine(v, face) > 0) s += 0.4 * mine(v, face);
        if (lv === 'easy') s += ctx.rng() * 4;
        if (lv === 'hard' && ctx.rng() < 0.12) s += 1.5; // 가끔 허풍
        scored.push({ move: { type: 'bid', count, face }, score: s });
      }
    }
    if (!scored.length) return { type: 'challenge' };
    return pickByLevel(scored, lv, ctx.rng);
  },
};
