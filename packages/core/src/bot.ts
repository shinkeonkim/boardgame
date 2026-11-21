/**
 * 봇 공통 모듈.
 *
 * 게임은 GameModule.bot에 Bot을 하나 꽂기만 하면 된다. 플랫폼(Rooms)이 차례가 된 봇 좌석마다
 * 그 좌석의 뷰(viewFor — 사람과 같은 정보만, 몰래 보기 없음)를 넘겨 choose를 부르고, 생각하는 시간을 둔 뒤 둔다.
 * 봇이 고른 수가 규칙에 어긋나면 autoMove로 대신 둔다 (게임이 멈추지 않게).
 *
 * 만드는 방법 (쉬운 것부터):
 *   1) 아무것도 안 함 → autoMove로 두는 "기본 봇"
 *   2) scoredBot({ legal, score }) → 할 수 있는 수를 모두 나열하고 점수를 매기면, 난이도별 고르기는 여기서 처리
 *   3) Bot.choose를 직접 구현 → 블러핑·추리처럼 상태가 필요한 게임
 * 난이도 차이는 "얼마나 자주 최선을 고르는가(pickByLevel)" + "점수 계산이 얼마나 깊은가(ctx.level을 score에서 사용)"로 낸다.
 */
import type { Rng } from './module';

export type BotLevel = 'easy' | 'normal' | 'hard';

export const BOT_LEVELS: { id: BotLevel; label: string; hint: string }[] = [
  { id: 'easy', label: '쉬움', hint: '자주 실수해요. 처음 해 보는 사람과 함께하기 좋아요' },
  { id: 'normal', label: '보통', hint: '무난하게 둬요' },
  { id: 'hard', label: '어려움', hint: '수를 꼼꼼히 따져요' },
];

export const isBotLevel = (x: unknown): x is BotLevel => x === 'easy' || x === 'normal' || x === 'hard';
export const botLevelLabel = (l: BotLevel) => BOT_LEVELS.find((b) => b.id === l)?.label ?? l;

export interface BotContext<View> {
  /** 이 봇 좌석에게 보이는 뷰 (사람과 똑같은 정보) */
  view: View;
  seat: number;
  level: BotLevel;
  rng: Rng;
}

export interface Bot<View, Move> {
  /** 두기 전 기다리는 시간 [최소, 최대] ms (기본 [700, 1600]) — 사람이 따라갈 수 있게 */
  thinkMs?: [number, number];
  choose(ctx: BotContext<View>): Move;
}

export interface Scored<Move> {
  move: Move;
  score: number;
}

/**
 * 난이도별 고르기.
 *  - 어려움: 최고점 (동점이면 무작위)
 *  - 보통: 대부분 최고점, 가끔 상위 3개 중 하나
 *  - 쉬움: 점수를 흐리게(온도 높은 소프트맥스) 보고 고르고, 가끔은 아무거나
 */
export function pickByLevel<Move>(scored: Scored<Move>[], level: BotLevel, rng: Rng): Move {
  if (!scored.length) throw new Error('pickByLevel: 고를 수 있는 수가 없음');
  const sorted = [...scored].sort((a, b) => b.score - a.score);
  const best = sorted.filter((s) => s.score === sorted[0].score);
  const pickBest = () => best[Math.floor(rng() * best.length)].move;
  if (level === 'hard' || sorted.length === 1) return pickBest();
  if (level === 'normal') {
    if (rng() < 0.8) return pickBest();
    const top = sorted.slice(0, 3);
    return top[Math.floor(rng() * top.length)].move;
  }
  if (rng() < 0.25) return sorted[Math.floor(rng() * sorted.length)].move;
  return softmax(sorted, rng, spread(sorted) / 2 || 1);
}

function spread<Move>(s: Scored<Move>[]) {
  return s[0].score - s[s.length - 1].score;
}

/** 점수가 높을수록 잘 뽑히는 무작위 (temp가 클수록 고르게) */
export function softmax<Move>(scored: Scored<Move>[], rng: Rng, temp = 1): Move {
  const max = Math.max(...scored.map((s) => s.score));
  const w = scored.map((s) => Math.exp((s.score - max) / Math.max(1e-6, temp)));
  let r = rng() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < scored.length; i++) {
    r -= w[i];
    if (r <= 0) return scored[i].move;
  }
  return scored[scored.length - 1].move;
}

/** 할 수 있는 수를 나열하고 점수를 매기는 봇 */
export function scoredBot<View, Move>(def: {
  legal(view: View, seat: number): Move[];
  score(move: Move, ctx: BotContext<View>): number;
  thinkMs?: [number, number];
}): Bot<View, Move> {
  return {
    thinkMs: def.thinkMs,
    choose(ctx) {
      const moves = def.legal(ctx.view, ctx.seat);
      if (!moves.length) throw new Error('봇: 둘 수 있는 수가 없음');
      return pickByLevel(
        moves.map((move) => ({ move, score: def.score(move, ctx) })),
        ctx.level,
        ctx.rng,
      );
    },
  };
}

/** 0 이상 정수 무작위 */
export const randInt = (rng: Rng, n: number) => Math.floor(rng() * n);
export const pickOne = <T>(rng: Rng, xs: readonly T[]): T => xs[randInt(rng, xs.length)];
