/**
 * 홀덤 봇 — 승률(에퀴티)을 몬테카를로로 어림한다: 남은 카드로 상대 패·남은 보드를 무작위로 깔아 내 족보가 이기는 비율.
 *  - 낼 칩 대비 팟(팟 오즈)보다 승률이 높으면 콜, 아주 높으면 레이즈(팟의 절반~전부), 낮으면 체크/폴드.
 *  - 어려움: 표본 많이 + 가끔 블러핑 + 짧은 스택이면 올인 승부. 쉬움: 표본 적게 + 자주 실수(pickByLevel).
 */
import { Bot, BotContext, Scored, pickByLevel } from '@bg/core';
import { Card, Move } from './game';
import { best } from './hand';
import { GameView } from './view';

function equity(v: GameView, samples: number, rng: () => number): number {
  const mine = v.hole[v.me]!;
  const opps = v.folded.filter((f, s) => !f && !v.busted[s] && s !== v.me).length;
  const used = new Set([...mine, ...v.board].map((c) => c.id));
  const deck: Card[] = [];
  for (let s = 0; s < 4; s++) for (let r = 1; r <= 13; r++) if (!used.has(`${s}-${r}`)) deck.push({ id: `${s}-${r}`, suit: s, rank: r });
  let win = 0;
  for (let k = 0; k < samples; k++) {
    // 섞어서 필요한 만큼만 뽑기
    const need = 5 - v.board.length + opps * 2;
    for (let i = 0; i < need; i++) {
      const j = i + Math.floor(rng() * (deck.length - i));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    const board = [...v.board, ...deck.slice(0, 5 - v.board.length)];
    const my = best([...mine, ...board]).score;
    let beat = true;
    let tie = 0;
    for (let o = 0; o < opps; o++) {
      const off = 5 - v.board.length + o * 2;
      const s = best([deck[off], deck[off + 1], ...board]).score;
      if (s > my) {
        beat = false;
        break;
      }
      if (s === my) tie++;
    }
    if (beat) win += 1 / (tie + 1);
  }
  return win / samples;
}

export const holdemBot: Bot<GameView, Move> = {
  thinkMs: [800, 2000],
  choose(ctx: BotContext<GameView>): Move {
    const v = ctx.view;
    if (v.phase === 'showdown') return { type: 'next' };
    const samples = ctx.level === 'hard' ? 260 : ctx.level === 'normal' ? 110 : 30;
    const eq = equity(v, samples, ctx.rng);
    const pot = v.pot;
    const toCall = v.toCall;
    const stack = v.chips[v.me];
    const odds = toCall / Math.max(1, pot + toCall);
    const scored: Scored<Move>[] = [];
    if (toCall === 0) scored.push({ move: { type: 'check' }, score: 1 });
    else {
      scored.push({ move: { type: 'fold' }, score: odds - eq + 0.05 });
      scored.push({ move: { type: 'call' }, score: eq - odds + (stack <= toCall ? 0.05 : 0) });
    }
    if (v.raise) {
      const half = Math.round(v.currentBet + Math.max(v.blinds.bb, pot / 2));
      const full = Math.round(v.currentBet + Math.max(v.blinds.bb * 2, pot));
      for (const [to, need] of [
        [half, 0.58],
        [full, 0.72],
      ] as const) {
        const t = Math.max(v.raise.min, Math.min(v.raise.max, to));
        scored.push({ move: { type: 'raise', to: t }, score: eq - need + (toCall === 0 ? 0.08 : 0) });
      }
      // 짧은 스택: 좋은 패면 올인
      if (stack < v.blinds.bb * 10) scored.push({ move: { type: 'allin' }, score: eq - 0.5 });
      // 가끔 블러핑 (어려움)
      if (ctx.level === 'hard' && toCall === 0 && ctx.rng() < 0.08) scored.push({ move: { type: 'raise', to: Math.max(v.raise.min, Math.min(v.raise.max, half)) }, score: 2 });
    }
    return pickByLevel(scored, ctx.level, ctx.rng);
  },
};
