/**
 * Expedition Lines 봇 — 자기 좌석의 뷰만 본다 (남의 손패·덱 순서 모름).
 *
 * 점수 기준 (높을수록 좋은 수):
 *  - 놓기: 이미 시작한 탐험대면 숫자만큼 이득, 건너뛰는 숫자(손에 있는 작은 카드가 막힘)만큼 손해.
 *          새 탐험대는 손에 같은 색이 충분해 비용(20)을 넘길 수 있을 때만, 남은 턴이 적으면 시작 안 함.
 *          투자 카드는 그 색이 크게 남을 것 같고 초반일 때만.
 *  - 버리기: 내게 쓸모없는 카드일수록, 상대가 주워 쓸 수 없는 카드일수록 좋다.
 *  - 가져오기: 버림 더미 맨 위가 내 탐험대에 바로 이어지면 덱보다 좋다.
 *              (어려움) 이기고 있으면 덱으로 빨리 끝내고, 지고 있으면 버림 더미로 시간을 끈다.
 * 난이도: 쉬움은 상대 견제·속도 조절을 안 보고 자주 아무 수나, 어려움은 모두 본다.
 */
import { BotContext, scoredBot } from '@bg/core';
import { deckSize } from './config';
import { Card, Move, playBlockReason, scorePlayer } from './game';
import { GameView } from './view';

const sameSide = (v: GameView, a: number, b: number) => a === b || (v.config.teams && a % 2 === b % 2);

/** 남은 덱 장수 (비공개 설정이면 보이는 카드로 계산) */
function deckLeft(v: GameView): number {
  if (v.deckCount !== null) return v.deckCount;
  if (v.deckEmpty) return 0;
  const seen =
    v.handCounts.reduce((a, b) => a + b, 0) +
    v.expeditions.reduce((a, cols) => a + cols.reduce((x, c) => x + c.length, 0), 0) +
    v.discardCounts.reduce((a, b) => a + b, 0);
  return Math.max(1, deckSize(v.config) - seen);
}

/** 내가 앞으로 몇 번 더 차례를 가질지 (대략) */
const myTurnsLeft = (v: GameView) => Math.max(0, Math.ceil(deckLeft(v) / v.players));

function lastValue(col: Card[]): number | null {
  const last = col[col.length - 1];
  return last ? last.value : null;
}

/** 이 색 탐험대를 지금 시작해서 끝날 때까지 얻을 것 같은 점수 (손에 있는 같은 색 카드 기준) */
function colorPotential(v: GameView, color: number, extraWager = 0): number {
  const mine = v.hand.filter((c) => c.color === color);
  const col = v.expeditions[v.me][color];
  const turns = myTurnsLeft(v);
  const nums = mine.filter((c) => c.value > 0).sort((a, b) => a.value - b.value);
  const wagers = col.filter((c) => c.value === 0).length + extraWager + (col.length === 0 ? mine.filter((c) => c.value === 0).length * 0.5 : 0);
  // 남은 턴 안에 다 못 놓는 카드는 덜 친다
  const playable = nums.slice(0, Math.max(0, turns));
  const sum = col.reduce((a, c) => a + c.value, 0) + playable.reduce((a, c) => a + c.value, 0);
  // 아직 안 나온 같은 색 큰 숫자를 덱에서 더 얻을 기대치 (턴이 많을수록)
  const draws = Math.min(3, turns / 4) * ((v.config.minValue + v.config.maxValue) / 2) * 0.4;
  return (sum + draws - v.config.expeditionCost) * (1 + wagers);
}

/** 상대(다른 편)가 이 카드를 주워 바로 이을 수 있으면 그 가치 */
function giftToOpponents(v: GameView, card: Card): number {
  let best = 0;
  for (let p = 0; p < v.players; p++) {
    if (sameSide(v, p, v.me)) continue;
    const col = v.expeditions[p][card.color];
    if (!col.length) continue;
    if (playBlockReason(v.config, col, card) === null) best = Math.max(best, card.value === 0 ? 4 : card.value);
  }
  return best;
}

/** 내 점수 − 가장 높은 상대 점수 (지금 탐험대 기준) */
function lead(v: GameView): number {
  const now = v.expeditions.map((cols) => scorePlayer(v.config, cols).total);
  const total = (p: number) => (v.totals[p] ?? 0) + now[p];
  const mine = total(v.me);
  let opp = -Infinity;
  for (let p = 0; p < v.players; p++) if (!sameSide(v, p, v.me)) opp = Math.max(opp, total(p));
  return mine - (opp === -Infinity ? 0 : opp);
}

function scorePlay(card: Card, ctx: BotContext<GameView>): number {
  const v = ctx.view;
  const col = v.expeditions[v.me][card.color];
  const turns = myTurnsLeft(v);
  const last = lastValue(col);
  const sameColor = v.hand.filter((c) => c.color === card.color && c.id !== card.id);
  // 이 카드를 놓으면 못 쓰게 되는 손패 (같은 색, 더 작은 숫자)
  const blocked = sameColor.filter((c) => (card.value === 0 ? false : c.value === 0 || c.value < card.value || (!v.config.allowEqual && c.value === card.value)));
  const blockedLoss = blocked.reduce((a, c) => a + (c.value === 0 ? 8 : c.value), 0);

  if (col.length === 0) {
    // 새 탐험대 시작
    const pot = colorPotential(v, card.color, card.value === 0 ? 1 : 0);
    if (turns < 3) return -30 + pot * 0.2;
    // 손에 더 작은 카드가 있으면 그것부터
    return pot * 0.6 - blockedLoss * 1.2 + (card.value === 0 ? -2 : 0);
  }
  if (card.value === 0) {
    // 투자 카드: 아직 숫자를 놓지 않은 탐험대에 더 거는 것
    const pot = colorPotential(v, card.color, 1);
    return turns < 6 ? -10 : pot * 0.4;
  }
  const gap = last === null ? 0 : Math.max(0, card.value - (last === 0 ? v.config.minValue : last) - (v.config.allowEqual ? 0 : 1));
  const gapCost = ctx.level === 'easy' ? 0 : gap * (turns > 8 ? 1.2 : 0.4);
  // 시작한 탐험대에 바로 이어 놓기: 숫자만큼 이득 (와거 배수 반영)
  const mult = 1 + col.filter((c) => c.value === 0).length;
  return card.value * 0.8 * mult - gapCost - blockedLoss * 1.5 + 4;
}

function scoreDiscard(card: Card, ctx: BotContext<GameView>): number {
  const v = ctx.view;
  const col = v.expeditions[v.me][card.color];
  const turns = myTurnsLeft(v);
  let keep = 0;
  if (col.length) {
    keep = playBlockReason(v.config, col, card) === null ? (card.value === 0 ? 3 : card.value) * 1.1 : 0; // 이미 못 놓는 카드는 버려도 됨
  } else {
    const pot = colorPotential(v, card.color);
    keep = pot > 0 && turns >= 3 ? Math.min(12, pot * 0.25) + (card.value === 0 ? 2 : card.value * 0.3) : card.value * 0.1;
  }
  const gift = ctx.level === 'easy' ? 0 : giftToOpponents(v, card) * (ctx.level === 'hard' ? 1.4 : 0.9);
  return -keep - gift;
}

function scoreDraw(source: 'deck' | number, ctx: BotContext<GameView>): number {
  const v = ctx.view;
  const ahead = lead(v);
  const tempo = ctx.level === 'hard' ? Math.max(-4, Math.min(4, ahead / 8)) : 0; // 이기고 있으면 덱을 줄여 빨리 끝내기
  if (source === 'deck') return 2 + tempo;
  const top = v.discardTops[source];
  if (!top) return -50;
  const col = v.expeditions[v.me][top.color];
  let value = -3 - tempo; // 버림 더미에서 가져오면 덱이 안 줄어 판이 길어진다
  if (col.length && playBlockReason(v.config, col, top) === null) {
    const last = lastValue(col) ?? 0;
    const gap = Math.max(0, top.value - Math.max(last, v.config.minValue - 1) - 1);
    value += (top.value === 0 ? 4 : top.value) * 1.2 - gap * 0.3 + 3;
  } else if (!col.length && myTurnsLeft(v) > 4) {
    const pot = colorPotential(v, top.color);
    if (pot > -5) value += top.value * 0.6;
  }
  // 어려움: 상대가 노리는 카드를 가로채기
  if (ctx.level === 'hard') value += giftToOpponents(v, top) * 0.3;
  return value;
}

export const expeditionBot = scoredBot<GameView, Move>({
  legal(v) {
    const out: Move[] = [];
    if (v.status !== 'playing' || v.turn !== v.me) return out;
    if (v.phase === 'play') {
      for (const c of v.hand) {
        if (playBlockReason(v.config, v.expeditions[v.me][c.color], c) === null) out.push({ type: 'play', cardId: c.id });
        out.push({ type: 'discard', cardId: c.id });
      }
    } else {
      if (v.drawable.deck) out.push({ type: 'draw', source: 'deck' });
      v.drawable.discards.forEach((ok, i) => ok && out.push({ type: 'draw', source: i }));
    }
    return out;
  },
  score(move, ctx) {
    const card = 'cardId' in move ? ctx.view.hand.find((c) => c.id === move.cardId)! : null;
    if (move.type === 'play') return scorePlay(card!, ctx);
    if (move.type === 'discard') return scoreDiscard(card!, ctx);
    return scoreDraw(move.source, ctx);
  },
});
