/**
 * 불꽃 신호 봇 — 자기 손패는 모르고(뷰 그대로), 힌트와 보이는 카드로 추리한다.
 *
 * 약속(화면 「게임 방법 → 봇과 할 때」에도 적어 둠):
 *  - 힌트로 "새로 가리켜진 가장 최근 카드"(초점)는 → 지금 낼 수 있다는 뜻(플레이 힌트).
 *  - 단, 초점이 버릴 차례 카드(가장 오래된 힌트 없는 카드)였거나 숫자 5 힌트면 → 지키라는 뜻(보존 힌트).
 *  - 버릴 때는 힌트 없는 가장 오래된 카드부터.
 * 난이도:
 *  - 쉬움: 확실한 카드만 내고, 힌트는 보이는 대로 아무거나. 약속을 잘 안 지킴.
 *  - 보통: 약속대로 플레이·보존 힌트를 주고 받음.
 *  - 어려움: + 확률 플레이(실수 여유가 있을 때), 가까운 사람 우선, 중복 힌트 피하기, 쓸모없는 카드 먼저 버리기.
 */
import { BotContext, Bot, Scored, pickByLevel } from '@bg/core';
import { copiesOf } from './config';
import { Card, Clue, Move, hintColors, touchesColor } from './game';
import { GameView, SeenCard, possibilities } from './view';

const playableNow = (v: GameView, color: number, value: number) => v.piles[color] === value - 1;

/** 다시는 쌓을 수 없는 카드인지 (이미 쌓였거나, 아래 숫자가 모두 버려짐) */
function dead(v: GameView, color: number, value: number): boolean {
  if (v.piles[color] >= value) return true;
  for (let k = v.piles[color] + 1; k < value; k++) {
    const gone = v.discard.filter((d) => d.color === color && d.value === k).length;
    if (gone >= copiesOf(v.config, color, k)) return true;
  }
  return false;
}

function critical(v: GameView, card: Card): boolean {
  if (dead(v, card.color, card.value)) return false;
  const gone = v.discard.filter((d) => d.color === card.color && d.value === card.value).length;
  return copiesOf(v.config, card.color, card.value) - gone === 1;
}

interface Know {
  card: SeenCard;
  idx: number;
  play: number; // 낼 수 있을 확률
  useless: number; // 쓸모없을 확률
  certain: boolean;
}

function knowMine(v: GameView): Know[] {
  return v.hands[v.me].map((card, idx) => {
    const ps = possibilities(v, v.me, card.clue);
    const total = ps.reduce((a, p) => a + p.count, 0) || 1;
    const play = ps.filter((p) => playableNow(v, p.color, p.value)).reduce((a, p) => a + p.count, 0) / total;
    const useless = ps.filter((p) => dead(v, p.color, p.value)).reduce((a, p) => a + p.count, 0) / total;
    return { card, idx, play, useless, certain: ps.length === 1 };
  });
}

/** 다른 사람이 이 카드를 낼 거라고 이미 알고 있는지 (플레이 힌트를 받았거나 확실히 앎) */
function alreadyKnownPlay(v: GameView, seat: number, card: SeenCard): boolean {
  const cl = card.clue;
  if (cl.focus && !cl.focusOnChop && cl.value !== 5) return true;
  const ps = possibilities({ ...v, hands: v.hands }, seat, cl).filter((p) => p.count > 0);
  return ps.length > 0 && ps.every((p) => playableNow(v, p.color, p.value));
}

/** 이 힌트를 주면 초점이 될 카드 */
function focusOf(v: GameView, to: number, hint: { color?: number; value?: number }): { focus: number; touched: number[]; onChop: boolean } | null {
  const hand = v.hands[to];
  const touched: number[] = [];
  hand.forEach((card, i) => {
    const hit = hint.color !== undefined ? touchesColor(v.config, card as Card, hint.color) : card.value === hint.value;
    if (hit) touched.push(i);
  });
  if (!touched.length) return null;
  const fresh = touched.filter((i) => !hand[i].clue.touched);
  const list = fresh.length ? fresh : touched;
  const focus = list[list.length - 1];
  return { focus, touched, onChop: focus === v.chops[to] };
}

/** 이미 누군가 플레이 힌트를 받은(또는 쌓일 예정인) 같은 카드가 있는지 */
function duplicateClued(v: GameView, card: Card, except: number): boolean {
  return v.hands.some((h, s) => s !== except && s !== v.me && h.some((x) => x.color === card.color && x.value === card.value && x.clue.touched));
}

export const flareBot: Bot<GameView, Move> = {
  thinkMs: [900, 1800],
  choose(ctx: BotContext<GameView>): Move {
    const v = ctx.view;
    const lv = ctx.level;
    const mine = knowMine(v);
    const fusesLeft = v.config.fuses - v.fuses;
    const scored: Scored<Move>[] = [];

    // ---- 내기 ----
    for (const k of mine) {
      const cl = k.card.clue;
      let s = -Infinity;
      if (k.play === 1) s = 100 - (cl.value ?? 3);
      else if (lv !== 'easy' && cl.focus && !cl.focusOnChop && cl.value !== 5 && k.play > 0) s = 70 + k.play * 20 - (fusesLeft <= 1 ? 60 : 0);
      else if (lv === 'hard' && k.play >= 0.6 && fusesLeft >= 2) s = 35 + k.play * 20;
      else if (lv === 'easy' && cl.touched && k.play >= 0.5 && fusesLeft >= 2) s = 30;
      if (s > -Infinity) scored.push({ move: { type: 'play', cardId: k.card.id }, score: s });
    }

    // ---- 힌트 ----
    if (v.hints > 0) {
      const order = Array.from({ length: v.players - 1 }, (_, i) => (v.me + 1 + i) % v.players);
      order.forEach((to, dist) => {
        const hand = v.hands[to];
        const options: { color?: number; value?: number }[] = [...hintColors(v.config).map((color) => ({ color })), ...[1, 2, 3, 4, 5].map((value) => ({ value }))];
        for (const h of options) {
          const f = focusOf(v, to, h);
          if (!f) continue;
          const target = hand[f.focus] as Card & SeenCard;
          let s = -Infinity;
          const isSave = f.onChop || h.value === 5;
          const playableTarget = playableNow(v, target.color, target.value);
          if (playableTarget && !alreadyKnownPlay(v, to, target) && !duplicateClued(v, target, to)) {
            // 플레이 힌트: 초점이 낼 수 있는 카드 — 보존으로 읽힐 모양이면 감점
            s = 55 - target.value - dist * (lv === 'hard' ? 3 : 1) - (isSave ? 25 : 0);
            // 다른 가리켜진 카드가 나중에 잘못 내질 위험 (새로 가리켜진 쓸모없는 카드)
            const bad = f.touched.filter((i) => i !== f.focus && !hand[i].clue.touched && dead(v, hand[i].color!, hand[i].value!)).length;
            s -= bad * 8;
            s += (f.touched.length - 1) * (lv === 'hard' ? 1.5 : 0.5);
          } else if (lv !== 'easy' && f.onChop && dist === 0 && critical(v, target) && !target.clue.touched) {
            // 보존 힌트: 다음 사람의 버릴 차례 카드가 마지막 한 장 (5 포함)
            s = 75 + (target.value === 5 ? 2 : 0);
            if (!h.value && target.value !== 5 && playableTarget) s -= 10;
          } else if (lv === 'easy' && !target.clue.touched) {
            s = 10 + ctx.rng() * 8;
          }
          if (s > -Infinity) scored.push({ move: { type: 'hint', to, ...(h.color !== undefined ? { color: h.color } : { value: h.value! }) } as Move, score: s });
        }
      });
    }

    // ---- 버리기 ----
    if (v.hints < v.config.hints) {
      const uselessKnown = mine.filter((k) => k.useless === 1);
      if (uselessKnown.length) scored.push({ move: { type: 'discard', cardId: uselessKnown[0].card.id }, score: 45 });
      const chop = v.chops[v.me];
      const target = chop >= 0 ? mine[chop] : mine.filter((k) => !(k.card.clue.focus && !k.card.clue.focusOnChop)).sort((a, b) => b.useless - a.useless)[0] ?? mine[0];
      if (target) {
        const urgency = v.hints === 0 ? 30 : v.hints <= 2 ? 12 : 0;
        scored.push({ move: { type: 'discard', cardId: target.card.id }, score: 8 + urgency + (lv === 'hard' ? target.useless * 20 : 0) });
      }
    }

    if (!scored.length) {
      // 힌트 토큰이 가득인데 줄 힌트가 없거나 아무것도 없음: 가장 안전한 힌트 → 없으면 확률 높은 카드
      if (v.hints > 0) {
        for (let d = 1; d < v.players; d++) {
          const to = (v.me + d) % v.players;
          const touchedCard = v.hands[to].find((c) => c.clue.touched) ?? v.hands[to][0];
          if (touchedCard) return { type: 'hint', to, value: touchedCard.value! };
        }
      }
      const best = [...mine].sort((a, b) => b.play - a.play)[0];
      return { type: 'play', cardId: best.card.id };
    }
    return pickByLevel(scored, lv, ctx.rng);
  },
};

export type { Clue };
