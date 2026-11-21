/**
 * 여섯째 줄 봇 — 자기 뷰만 본다 (남이 고른 카드는 모름).
 *
 * 카드마다 "이 카드를 내면 벌점을 얼마나 받을 것 같은가"를 어림한다.
 *  - 들어갈 줄이 이미 꽉 찼으면 → 그 줄 벌점 확정.
 *  - 아니면 → 내 카드와 줄 끝 사이 숫자를 다른 사람이 낼 확률로 줄이 먼저 찰 위험을 계산.
 *    (보통·어려움) 아직 안 나온 카드만 세서 확률을 낸다 (어려움은 판에 나온 카드·내 손패를 모두 기억).
 *  - 가장 작은 줄 끝보다 작으면 → 가장 가벼운 줄을 가져감 (줄이 가벼울 때는 오히려 좋은 탈출).
 * 손패 운영: (어려움) 큰 숫자는 나중을 위해 아끼고, 늦은 차례에 낼 카드를 남긴다.
 * 줄 고르기: 벌점이 가장 적은 줄, 같으면 남에게 더 위험한 줄을 남기는 쪽.
 */
import { BotContext, pickByLevel, Bot } from '@bg/core';
import { penaltyOf } from './config';
import { Move, rowPenalty, targetRow } from './game';
import { GameView } from './view';

function unseen(v: GameView): number[] {
  const seen = new Set<number>([...v.hand, ...v.rows.flat()]);
  for (const e of v.log) {
    if (e.type === 'reveal') e.cards.forEach((x) => seen.add(x.card));
    if (e.type === 'place') e.took.forEach((x) => seen.add(x));
  }
  const out: number[] = [];
  for (let n = 1; n <= v.config.maxCard; n++) if (!seen.has(n)) out.push(n);
  return out;
}

function expectedPenalty(card: number, ctx: BotContext<GameView>, pool: number[]): number {
  const v = ctx.view;
  const c = v.config;
  const r = targetRow(v.rows, card);
  if (r < 0) {
    const cheapest = Math.min(...v.rowPenalties);
    // 가벼운 줄을 가져가는 건 나쁘지 않음 (새 줄의 시작이 내 작은 카드가 되어 다음에 위험할 수도)
    return cheapest + (ctx.level === 'hard' ? 0.3 : 0);
  }
  const row = v.rows[r];
  const end = row[row.length - 1];
  const slots = c.rowLimit - row.length; // 내 카드 전에 들어올 수 있는 칸 수
  if (slots <= 0) return rowPenalty(c, row);
  const others = v.players - 1;
  // 다른 사람 손에 있을 법한 카드: (안 나온 카드 / 남은 손패 총수) 비율
  const handsLeft = v.handCounts.reduce((a, b, i) => a + (i === v.me ? 0 : b), 0);
  const between = ctx.level === 'easy' ? card - end - 1 : pool.filter((n) => n > end && n < card).length;
  const density = ctx.level === 'easy' ? others / Math.max(1, c.maxCard) : Math.min(1, handsLeft / Math.max(1, pool.length)) / Math.max(1, v.handCounts[v.me] || 1);
  // 이번 차례에 그 사이 숫자를 내는 사람 수 기대치 ≈ between × (각자 한 장 낸다는 비율)
  const expectedIn = Math.min(others, between * density);
  if (expectedIn < slots) {
    const risk = Math.max(0, (expectedIn - slots + 1) / 1.5);
    return risk * (rowPenalty(c, row) + 2);
  }
  return rowPenalty(c, row) + (expectedIn - slots) * 1.5;
}

/** 이번 차례를 한 번 흉내 내서 내 벌점 (작은 카드는 가장 가벼운 줄을 고른다고 가정) */
function simulate(v: GameView, mine: number, others: number[]): number {
  const c = v.config;
  const rows = v.rows.map((r) => [...r]);
  const cards = [...others.map((card) => ({ card, me: false })), { card: mine, me: true }].sort((a, b) => a.card - b.card);
  let pen = 0;
  for (const { card, me } of cards) {
    let r = targetRow(rows, card);
    let take = false;
    if (r < 0) {
      r = rows.reduce((best, row, i) => (rowPenalty(c, row) < rowPenalty(c, rows[best]) ? i : best), 0);
      take = true;
    } else if (rows[r].length >= c.rowLimit) take = true;
    if (take) {
      if (me) pen += rowPenalty(c, rows[r]);
      rows[r] = [card];
    } else rows[r].push(card);
  }
  return pen;
}

/** 다른 사람들이 낼 카드를 안 나온 카드에서 뽑아 여러 번 흉내 낸 평균 벌점 */
function monteCarlo(card: number, ctx: BotContext<GameView>, pool: number[], samples: number): number {
  const v = ctx.view;
  const n = v.players - 1;
  if (!n || !pool.length) return expectedPenalty(card, ctx, pool);
  let total = 0;
  for (let i = 0; i < samples; i++) {
    const picked = new Set<number>();
    const others: number[] = [];
    while (others.length < n && picked.size < pool.length) {
      const x = pool[Math.floor(ctx.rng() * pool.length)];
      if (picked.has(x)) continue;
      picked.add(x);
      others.push(x);
    }
    total += simulate(v, card, others);
  }
  return total / samples;
}

export const rowSixBot: Bot<GameView, Move> = {
  thinkMs: [600, 1500],
  choose(ctx) {
    const v = ctx.view;
    if (v.phase === 'take' && v.chooser === v.me) {
      const scored = v.rows.map((row, i) => {
        let s = -rowPenalty(v.config, row) * 3;
        // 어려움: 내 다음 카드들이 들어가기 좋은 끝 숫자를 남기면 가산
        if (ctx.level === 'hard') {
          const after = v.rows.map((r, j) => (j === i ? [v.queue[0]?.card ?? 0] : r));
          s -= v.hand.filter((card) => {
            const t = targetRow(after, card);
            return t >= 0 && after[t].length >= v.config.rowLimit - 1;
          }).length * 0.5;
        }
        return { move: { type: 'take', row: i } as Move, score: s };
      });
      return pickByLevel(scored, ctx.level, ctx.rng);
    }
    const pool = unseen(v);
    const samples = ctx.level === 'hard' ? 80 : ctx.level === 'normal' ? 24 : 0;
    const scored = v.hand.map((card) => {
      let s = -(samples ? monteCarlo(card, ctx, pool, samples) : expectedPenalty(card, ctx, pool));
      if (ctx.level === 'hard' && v.hand.length > 2) {
        // 손패 운영: 나중에 안전하게 낼 카드(가장 큰 카드)를 아끼고, 애매한 중간 카드를 먼저 정리
        const max = Math.max(...v.hand);
        if (card === max) s -= 0.8;
      }
      return { move: { type: 'pick', card } as Move, score: s };
    });
    return pickByLevel(scored, ctx.level, ctx.rng);
  },
};
