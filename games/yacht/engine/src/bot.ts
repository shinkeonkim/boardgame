/**
 * 요트 봇.
 *  - 칸 가치: 적을 점수 + 그 칸의 「기대 대비」 (위쪽은 보너스 기준 3개 대비, 요트·스트레이트를 0으로 버리면 큰 손해)
 *  - 굴리기: 남길 주사위 32가지마다 다시 굴린 결과를 몬테카를로로 뽑아 가장 좋은 칸 가치의 평균
 *  - 적기 vs 굴리기 중 값이 큰 쪽. 어려움은 표본을 많이, 쉬움은 적게 + pickByLevel로 실수
 */
import { Bot, BotContext, Scored, pickByLevel } from '@bg/core';
import { Cat, UPPER } from './config';
import { Move, isYacht, scoreFor } from './game';
import { GameView, SeatView } from './view';

function catValue(v: GameView, s: SeatView, cat: Cat, pts: number, dice: number[]): number {
  const open = v.cats.filter((c) => s.card[c] === undefined).length;
  const lateness = open / v.cats.length; // 1 = 처음, 0 = 끝
  const extraYacht = v.config.scoring === 'extended' && isYacht(dice) && s.card.yacht === 50 ? 100 : 0;
  const ui = UPPER.indexOf(cat);
  if (ui >= 0) {
    const par = 3 * (ui + 1);
    const bonusAlive = s.upper < v.config.bonusAt;
    return pts + extraYacht + (bonusAlive ? (pts - par) * 0.9 + (pts >= par ? 3 : 0) : 0);
  }
  const zero = (p: number) => -p * lateness;
  switch (cat) {
    case 'choice':
      return pts * 0.75 - 4 * lateness + extraYacht;
    case 'threeKind':
      return (pts ? pts - 4 : zero(6)) + extraYacht;
    case 'fourKind':
      return (pts ? pts + 4 : zero(9)) + extraYacht;
    case 'fullHouse':
      return (pts ? pts + 3 : zero(9)) + extraYacht;
    case 'smallStraight':
      return (pts ? pts + 4 : zero(10)) + extraYacht;
    case 'largeStraight':
      return (pts ? pts + 8 : zero(12)) + extraYacht;
    case 'yacht':
      return pts ? 95 : zero(18);
  }
  return pts;
}

function bestNow(v: GameView, s: SeatView, dice: number[]): { cat: Cat; value: number } {
  let best: { cat: Cat; value: number } | null = null;
  for (const cat of v.cats) {
    if (s.card[cat] !== undefined) continue;
    const val = catValue(v, s, cat, scoreFor(v.config, cat, dice), dice);
    if (!best || val > best.value) best = { cat, value: val };
  }
  return best!;
}

export const yachtBot: Bot<GameView, Move> = {
  thinkMs: [600, 1400],
  choose(ctx: BotContext<GameView>): Move {
    const v = ctx.view;
    const s = v.seats[v.me];
    if (s.rolled === 0) return { type: 'roll' };
    const left = v.config.rolls - s.rolled;
    // 남길 주사위를 이미 골라 보여 줬으면 그대로 굴림
    if (s.picked && left > 0 && !s.held.every(Boolean)) return { type: 'roll', hold: s.held };
    const scored: Scored<Move>[] = [];
    for (const cat of v.cats) {
      if (s.card[cat] !== undefined) continue;
      scored.push({ move: { type: 'score', cat }, score: catValue(v, s, cat, scoreFor(v.config, cat, s.dice), s.dice) });
    }
    if (left > 0) {
      const samples = ctx.level === 'hard' ? 70 : ctx.level === 'normal' ? 28 : 8;
      // 같은 결과가 나오는 남기기(같은 눈 조합)는 한 번만
      const seen = new Set<string>();
      for (let mask = 0; mask < 31; mask++) {
        const hold = Array.from({ length: 5 }, (_, i) => !!(mask & (1 << i)));
        const key = s.dice
          .filter((_, i) => hold[i])
          .sort()
          .join('');
        if (seen.has(key)) continue;
        seen.add(key);
        let total = 0;
        for (let k = 0; k < samples; k++) {
          const dice = s.dice.map((d, i) => (hold[i] ? d : 1 + Math.floor(ctx.rng() * 6)));
          total += bestNow(v, s, dice).value;
        }
        // 더 굴릴 기회가 남으면 조금 더 기대 (한 단계만 보는 근사)
        const ev = total / samples + (left > 1 ? 2.5 : 0);
        scored.push({ move: { type: 'roll', hold }, score: ev });
      }
    }
    const pick = pickByLevel(scored, ctx.level, ctx.rng);
    // 다시 굴릴 때: 먼저 남길 주사위를 골라 보여 주고(hold), 다음 생각에서 그대로 굴림
    if (pick.type === 'roll' && pick.hold?.some(Boolean)) return { type: 'hold', hold: pick.hold };
    return pick;
  },
};
