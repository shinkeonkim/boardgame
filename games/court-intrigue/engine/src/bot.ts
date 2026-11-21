/**
 * 궁정 음모 봇 — 허풍과 도전의 게임.
 *  - 행동: 가진 역할은 당당히 쓰고, 없는 역할은 난이도별로 허풍 (어려움은 들킬 확률이 낮을 때만).
 *  - 도전: 공개된 카드·내 카드로 상대가 그 역할을 가졌을 확률을 계산 → 낮으면 도전.
 *          내가 위험할 때(암살 대상·영향력 1개)는 더 과감하게.
 *  - 막기: 가진 역할로 막고, 암살에 영향력이 1개면 호위 기사 허풍 (어차피 잃으니까).
 *  - 잃기·교환: 쓸모 있는 역할(재무관 > 자객 > 약탈자·호위 기사 > 외교관)을 남김.
 */
import { BotContext, Bot, Scored, pickByLevel } from '@bg/core';
import { Move } from './game';
import { ACTION_DEFS, ActionKind, Role } from './roles';
import { GameView, roleProb } from './view';

const VALUE: Record<Role, number> = { treasurer: 5, assassin: 4, raider: 3, guard: 3, diplomat: 2 };

function mine(v: GameView): Role[] {
  return v.hands[v.me].filter((h) => !h.lost).map((h) => h.role!);
}

/** 위협 순위: 영향력·금화가 많은 상대 */
function threat(v: GameView, s: number) {
  return v.influence[s] * 3 + v.coins[s] * 0.6 + v.totals[s];
}

function bluffRate(level: string) {
  return level === 'hard' ? 0.35 : level === 'normal' ? 0.12 : 0.4;
}

function chooseAction(ctx: BotContext<GameView>): Move {
  const v = ctx.view;
  const me = v.me;
  const hand = mine(v);
  const lv = ctx.level;
  const opps = Array.from({ length: v.players }, (_, i) => i).filter((s) => s !== me && v.influence[s] > 0);
  const top = [...opps].sort((a, b) => threat(v, b) - threat(v, a));
  const scored: Scored<Move>[] = [];
  for (const a of v.legal) {
    const def = ACTION_DEFS[a];
    const truthful = !def.role || hand.includes(def.role);
    // 허풍이면 들킬 위험: 상대 중 누군가 도전할 확률 ~ (그 역할이 많이 공개됐을수록 위험)
    const bluffPenalty = truthful ? 0 : lv === 'easy' ? 2 : 6 - (lv === 'hard' && ctx.rng() < bluffRate(lv) ? 4 : 0);
    const pick = (target?: number, base = 0) => scored.push({ move: { type: 'act', action: a as ActionKind, target }, score: base - bluffPenalty });
    switch (a) {
      case 'coup':
        pick(top[0], 30);
        break;
      case 'assassinate':
        for (const t of top.slice(0, 2)) pick(t, 16 + threat(v, t) * 0.3 - roleProb(v, t, 'guard') * 8);
        break;
      case 'tax':
        pick(undefined, 11);
        break;
      case 'steal': {
        const rich = opps.filter((t) => v.coins[t] >= 2).sort((x, y) => v.coins[y] - v.coins[x]);
        for (const t of rich.slice(0, 2)) pick(t, 9 + v.coins[t] * 0.4 - (roleProb(v, t, 'raider') + roleProb(v, t, 'diplomat')) * 5);
        break;
      }
      case 'exchange':
        pick(undefined, hand.some((r) => VALUE[r] <= 2) ? 7 : 3);
        break;
      case 'aid': {
        const blockRisk = Math.max(...opps.map((t) => roleProb(v, t, 'treasurer')), 0);
        pick(undefined, 6 - blockRisk * 5);
        break;
      }
      case 'income':
        pick(undefined, 4);
        break;
    }
  }
  return pickByLevel(scored, lv, ctx.rng);
}

function decideChallenge(ctx: BotContext<GameView>, claimant: number, role: Role): Move {
  const v = ctx.view;
  const p = roleProb(v, claimant, role);
  if (p === 0) return { type: 'challenge' };
  const pend = v.pending!;
  const targetMe = pend.target === v.me;
  const danger = targetMe && (pend.action === 'assassinate' || pend.action === 'steal') && v.phase === 'challenge';
  let threshold = ctx.level === 'hard' ? 0.3 : ctx.level === 'normal' ? 0.2 : 0.15;
  if (danger && pend.action === 'assassinate' && v.influence[v.me] === 1 && !mine(v).includes('guard')) threshold = 0.95; // 어차피 잃으니 도전
  if (ctx.level === 'easy') return ctx.rng() < 0.15 ? { type: 'challenge' } : { type: 'pass' };
  return p < threshold ? { type: 'challenge' } : { type: 'pass' };
}

function decideBlock(ctx: BotContext<GameView>): Move {
  const v = ctx.view;
  const pend = v.pending!;
  const hand = mine(v);
  const def = ACTION_DEFS[pend.action];
  const own = def.blockers.find((r) => hand.includes(r));
  if (own) return { type: 'block', role: own };
  if (pend.action === 'assassinate' && pend.target === v.me) {
    // 영향력 1개면 잃을 것이 같으니 허풍으로 막기
    if (v.influence[v.me] === 1 && ctx.level !== 'easy') return { type: 'block', role: 'guard' };
    if (ctx.rng() < bluffRate(ctx.level) * 0.6) return { type: 'block', role: 'guard' };
  }
  if (pend.action === 'steal' && pend.target === v.me && v.coins[v.me] >= 2 && ctx.rng() < bluffRate(ctx.level) * 0.5) return { type: 'block', role: 'diplomat' };
  if (pend.action === 'aid' && ctx.level === 'hard' && v.coins[pend.actor] >= v.config.coupCost - 2 && ctx.rng() < 0.3) return { type: 'block', role: 'treasurer' };
  return { type: 'pass' };
}

export const intrigueBot: Bot<GameView, Move> = {
  thinkMs: [900, 2200],
  choose(ctx) {
    const v = ctx.view;
    switch (v.phase) {
      case 'action':
        return chooseAction(ctx);
      case 'challenge':
        return decideChallenge(ctx, v.pending!.actor, ACTION_DEFS[v.pending!.action].role!);
      case 'blockChallenge':
        return decideChallenge(ctx, v.pending!.blocker!, v.pending!.blockRole!);
      case 'block':
        return decideBlock(ctx);
      case 'lose': {
        const live = v.hands[v.me].filter((h) => !h.lost);
        const worst = [...live].sort((a, b) => VALUE[a.role!] - VALUE[b.role!])[0];
        return { type: 'lose', cardId: worst.id };
      }
      case 'exchange': {
        const live = v.hands[v.me].filter((h) => !h.lost);
        const pool = [...live.map((h) => ({ id: h.id, role: h.role! })), ...v.drawn.map((d) => ({ id: d.id, role: d.role }))];
        const keep: string[] = [];
        const used = new Set<Role>();
        for (const c of [...pool].sort((a, b) => VALUE[b.role] - VALUE[a.role])) {
          if (keep.length >= live.length) break;
          if (used.has(c.role) && pool.some((o) => !used.has(o.role) && !keep.includes(o.id) && VALUE[o.role] >= 3)) continue;
          keep.push(c.id);
          used.add(c.role);
        }
        for (const c of pool) if (keep.length < live.length && !keep.includes(c.id)) keep.push(c.id);
        return { type: 'keep', cardIds: keep };
      }
    }
  },
};
