/**
 * Crown March 봇 — 자기 좌석의 뷰만 본다 (손패 공개 설정이면 남의 손패도 보이므로 그만큼 더 잘 둔다).
 *
 * 점수 기준:
 *  - 놓기/기사: 놓은 뒤 판 점수(영역 제곱)에서 "내 점수 − 가장 높은 상대 점수"가 얼마나 늘었는지.
 *    기사는 아껴 쓴다 (남은 기사·남은 돌에 따라 비용).
 *  - (보통·어려움) 왕관이 옮겨 간 자리에서 다음 사람이 낼 수 있는 가장 좋은 수만큼 손해 — 손패 공개면 실제 손패로, 아니면 모든 카드로 어림.
 *  - 가져오기: 손패가 적을수록, 지금 낼 좋은 수가 없을수록 좋다.
 */
import { BotContext, scoredBot } from '@bg/core';
import { Card, Dir, Move, playOutcome, scoreBoard, sameSide } from './game';
import { GameView } from './view';

/** 이 판 점수에서 seat 편의 우세 (내 점수 − 가장 높은 상대 점수) */
function edge(v: GameView, board: number[], seat: number): number {
  const scores = scoreBoard(board, v.size, v.config, v.players).scores;
  let opp = 0;
  for (let p = 0; p < v.players; p++) if (!sameSide(v.config.teams, p, seat)) opp = Math.max(opp, scores[p]);
  return scores[seat] - opp;
}

interface Sim {
  board: number[];
  crown: { x: number; y: number };
  heroes: number[];
  supply: number;
}

function apply(v: GameView, s: Sim, seat: number, card: Card): Sim | null {
  const r = playOutcome({ size: v.size, board: s.board, crown: s.crown, heroes: s.heroes, supply: s.supply }, v.config.teams, seat, card);
  if (!('kind' in r)) return null;
  const board = s.board.slice();
  board[r.to.y * v.size + r.to.x] = seat;
  const heroes = s.heroes.slice();
  if (r.kind === 'hero') heroes[seat]--;
  return { board, crown: r.to, heroes, supply: s.supply - (r.kind === 'place' ? 1 : 0) };
}

/** 모든 카드 모양 (손패 비공개일 때 상대가 가졌을 법한 카드) */
function allCards(v: GameView): Card[] {
  const dirs = (v.config.diagonals ? [0, 1, 2, 3, 4, 5, 6, 7] : [0, 2, 4, 6]) as Dir[];
  const out: Card[] = [];
  for (const dir of dirs) for (let dist = 1; dist <= v.config.maxDistance; dist++) out.push({ id: `any-${dir}-${dist}`, dir, dist });
  return out;
}

/** 다음 사람이 이 상태에서 둘 수 있는 가장 좋은 수의 이득 (그 사람 편 기준) */
function nextThreat(v: GameView, s: Sim, me: number): number {
  const next = (me + 1) % v.players;
  if (sameSide(v.config.teams, next, me)) return 0;
  const hand = v.hands[next] ?? null;
  const cards = hand ?? allCards(v);
  const base = edge(v, s.board, next);
  let best = 0;
  for (const c of cards) {
    const after = apply(v, s, next, c);
    if (!after) continue;
    best = Math.max(best, edge(v, after.board, next) - base);
  }
  // 손패를 모르면 그중 일부만 들고 있을 것이므로 줄여서
  return hand ? best : best * 0.45;
}

function heroCost(v: GameView, s: Sim, seat: number): number {
  const left = s.heroes[seat];
  const late = s.supply < v.players * 3 ? 0.5 : 1;
  return (left <= 1 ? 9 : 6) * late;
}

function scorePlay(cardId: string, ctx: BotContext<GameView>): number {
  const v = ctx.view;
  const me = v.me;
  const card = v.hands[me]?.find((c) => c.id === cardId);
  if (!card) return -100;
  const sim: Sim = { board: v.board, crown: v.crown, heroes: v.heroes, supply: v.supply };
  const after = apply(v, sim, me, card);
  if (!after) return -100;
  const gain = edge(v, after.board, me) - edge(v, v.board, me);
  const hero = after.heroes[me] < sim.heroes[me];
  let score = gain + (hero ? -heroCost(v, sim, me) : 1);
  if (ctx.level !== 'easy') score -= nextThreat(v, after, me) * (ctx.level === 'hard' ? 0.9 : 0.5);
  // 어려움: 가운데 쪽 자리를 조금 선호 (다음 수 선택지가 많음)
  if (ctx.level === 'hard') {
    const mid = (v.size - 1) / 2;
    score -= (Math.abs(after.crown.x - mid) + Math.abs(after.crown.y - mid)) * 0.15;
  }
  return score;
}

function scoreDraw(ctx: BotContext<GameView>): number {
  const v = ctx.view;
  const hand = v.hands[v.me]?.length ?? 0;
  return 1.5 + (v.config.handLimit - hand) * 0.8;
}

export const crownBot = scoredBot<GameView, Move>({
  legal(v) {
    if (v.status !== 'playing' || v.turn !== v.me) return [];
    const out: Move[] = v.can.plays.map((cardId) => ({ type: 'play', cardId }));
    if (v.can.draw) out.push({ type: 'draw' });
    if (!out.length) out.push({ type: 'pass' });
    return out;
  },
  score(move, ctx) {
    if (move.type === 'play') return scorePlay(move.cardId, ctx);
    if (move.type === 'draw') return scoreDraw(ctx);
    return 0;
  },
});


