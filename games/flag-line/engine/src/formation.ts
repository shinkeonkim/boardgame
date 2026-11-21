/**
 * 대형 판정 (원작: 쐐기 > 방진 > 대대 > 산개 > 무리), 같은 대형이면 숫자 합.
 *   쐐기(wedge): 같은 색 + 연속 숫자     5
 *   방진(phalanx): 같은 숫자             4
 *   대대(battalion): 같은 색             3
 *   산개(skirmish): 연속 숫자            2
 *   무리(host): 아무거나                 1
 */
export interface TroopCard {
  id: string;
  color: number;
  value: number;
}

export const FORMATIONS = ['', '무리', '산개', '대대', '방진', '쐐기'] as const;

export function formationRank(cards: { color: number; value: number }[]): number {
  const vs = cards.map((c) => c.value).sort((a, b) => a - b);
  const sameColor = cards.every((c) => c.color === cards[0].color);
  const sameValue = vs.every((v) => v === vs[0]);
  const run = vs.every((v, i) => i === 0 || v === vs[i - 1] + 1);
  if (sameColor && run) return 5;
  if (sameValue) return 4;
  if (sameColor) return 3;
  if (run) return 2;
  return 1;
}

/** 비교용 점수: 대형 × 1000 + 합 */
export const strength = (cards: { color: number; value: number }[]) => formationRank(cards) * 1000 + cards.reduce((a, c) => a + c.value, 0);

/** pool에서 need장을 골라 cards에 더했을 때 가능한 최고 점수 (가능한 조합을 모두 봄, 일찍 끝내기 지원) */
export function bestCompletion(cards: TroopCard[], pool: TroopCard[], size: number, beats?: number): number {
  const need = size - cards.length;
  if (need <= 0) return strength(cards);
  let best = -1;
  const pick: TroopCard[] = [];
  const rec = (start: number) => {
    if (beats !== undefined && best > beats) return;
    if (pick.length === need) {
      const s = strength([...cards, ...pick]);
      if (s > best) best = s;
      return;
    }
    for (let i = start; i <= pool.length - (need - pick.length); i++) {
      pick.push(pool[i]);
      rec(i + 1);
      pick.pop();
      if (beats !== undefined && best > beats) return;
    }
  };
  rec(0);
  return best;
}
