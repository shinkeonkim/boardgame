/**
 * 비밀 편지 봇.
 *  - 어려움: 버려진 카드·공개된 카드·내가 아는 카드(점술가·결투·재상)를 세서 상대가 들었을 확률을 계산.
 *  - 보통: 장수만 세고(버린 카드 반영), 아는 카드는 씀.
 *  - 쉬움: 확률을 거의 안 보고, 가끔 아무 카드나.
 * 원칙: 여왕은 절대 내지 않음, 밀정 규칙은 엔진이 강제, 판 끝이 가까우면 높은 카드를 남김.
 */
import { BotContext, Bot, Scored, pickByLevel } from '@bg/core';
import { CARD_DEFS, Kind, deckSpec } from './cards';
import { Card, Move } from './game';
import { GameView, unseenCounts } from './view';

function probs(v: GameView, level: string): Map<Kind, number> {
  const spec = deckSpec(v.config.edition);
  const counts = level === 'easy' ? new Map(spec.map((s) => [s.kind, s.copies])) : unseenCounts(v, spec);
  const total = [...counts.values()].reduce((a, b) => a + b, 0) || 1;
  return new Map([...counts].map(([k, n]) => [k, n / total]));
}
const valueOfKind = (v: GameView, k: Kind) => deckSpec(v.config.edition).find((s) => s.kind === k)!.value;

export const letterBot: Bot<GameView, Move> = {
  thinkMs: [900, 2000],
  choose(ctx: BotContext<GameView>): Move {
    const v = ctx.view;
    const lv = ctx.level;
    const hand = v.hand;
    if (v.phase === 'scribe') {
      // 남길 카드: 판이 길면 쓸모 있는 카드, 짧으면 높은 카드 (여왕 우선)
      const keep = [...hand].sort((a, b) => b.value - a.value)[0];
      return { type: 'keep', cardId: keep.id };
    }
    const p = probs(v, lv);
    const opps = (c: Card) => (v.targets[c.id] ?? []).filter((t) => t !== v.me);
    const leader = (t: number) => v.tokens[t] * 0.3;
    const late = v.deckCount <= v.alive.filter(Boolean).length;
    const scored: Scored<Move>[] = [];
    for (const card of hand) {
      if (v.mustAgent && card.kind !== 'agent') continue;
      const other = hand.find((c) => c !== card)!;
      const keepBonus = other ? other.value * (late ? 0.9 : 0.25) : 0;
      const push = (move: Move, s: number) => scored.push({ move, score: s + keepBonus + (lv === 'easy' ? ctx.rng() * 4 : 0) });
      switch (card.kind) {
        case 'queen':
          push({ type: 'play', cardId: card.id }, -1000);
          break;
        case 'watch': {
          const ts = opps(card);
          if (!ts.length) push({ type: 'play', cardId: card.id }, 0);
          for (const t of ts) {
            const known = v.known[t];
            if (known && known.kind !== 'watch') push({ type: 'play', cardId: card.id, target: t, guess: known.kind }, 30 + leader(t));
            else {
              let best: Kind = 'duelist';
              let bp = -1;
              for (const [k, pr] of p) {
                if (k === 'watch' && v.config.guardNoGuard) continue;
                const adj = k === other?.kind ? pr * 0.7 : pr; // 내가 든 종류는 남이 들었을 확률이 낮음
                if (adj > bp) {
                  bp = adj;
                  best = k;
                }
              }
              push({ type: 'play', cardId: card.id, target: t, guess: best }, bp * 14 + leader(t));
            }
          }
          break;
        }
        case 'seer': {
          const ts = opps(card).filter((t) => !v.known[t]);
          push({ type: 'play', cardId: card.id, target: ts[0] ?? opps(card)[0] }, ts.length ? 3 : 0.5);
          break;
        }
        case 'duelist': {
          const ts = opps(card);
          if (!ts.length) {
            push({ type: 'play', cardId: card.id }, 0);
            break;
          }
          const mine = other?.value ?? 0;
          for (const t of ts) {
            const known = v.known[t];
            let win = 0;
            let lose = 0;
            if (known) {
              win = known.value < mine ? 1 : 0;
              lose = known.value > mine ? 1 : 0;
            } else
              for (const [k, pr] of p) {
                const val = valueOfKind(v, k);
                if (val < mine) win += pr;
                else if (val > mine) lose += pr;
              }
            push({ type: 'play', cardId: card.id, target: t }, (win - lose * 1.3) * 10 + leader(t));
          }
          break;
        }
        case 'shield':
          push({ type: 'play', cardId: card.id }, 2 + (other?.kind === 'queen' ? 6 : 0) + (other && other.value >= 5 ? 1.5 : 0));
          break;
        case 'envoy': {
          for (const t of v.targets[card.id] ?? []) {
            if (t === v.me) {
              push({ type: 'play', cardId: card.id, target: t }, other?.kind === 'queen' ? -1000 : other && other.value <= 2 ? 1 : -2);
              continue;
            }
            const known = v.known[t];
            const pq = known ? (known.kind === 'queen' ? 1 : 0) : p.get('queen') ?? 0;
            push({ type: 'play', cardId: card.id, target: t }, pq * 25 + (known && known.value >= 5 ? 3 : 1) + leader(t));
          }
          break;
        }
        case 'chancellor': {
          for (const t of opps(card)) {
            const known = v.known[t];
            const gain = known ? known.value - (other?.value ?? 0) : 4 - (other?.value ?? 0);
            push({ type: 'play', cardId: card.id, target: t }, gain * 1.2 - (other?.kind === 'queen' ? 50 : 0));
          }
          if (!opps(card).length) push({ type: 'play', cardId: card.id }, 0);
          break;
        }
        case 'agent':
          push({ type: 'play', cardId: card.id }, v.mustAgent ? 100 : other && other.value <= 3 ? -1 : 0.5);
          break;
        case 'spy':
          push({ type: 'play', cardId: card.id }, 3);
          break;
        case 'scribe':
          push({ type: 'play', cardId: card.id }, 2.5);
          break;
      }
    }
    if (!scored.length) {
      const c = hand.find((x) => x.kind !== 'queen') ?? hand[0];
      return { type: 'play', cardId: c.id, target: (v.targets[c.id] ?? [])[0], guess: c.kind === 'watch' ? 'duelist' : undefined };
    }
    // 필수 대상이 빠진 경우(대상 없음) 엔진이 처리
    void CARD_DEFS;
    return pickByLevel(scored, lv, ctx.rng);
  },
};
