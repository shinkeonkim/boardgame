/** 포커 족보 판정 (5장 · 7장 중 최고) */
import type { Card } from './game';

export const HAND_NAMES = ['하이 카드', '원 페어', '투 페어', '트리플', '스트레이트', '플러시', '풀 하우스', '포카드', '스트레이트 플러시'];

/** 점수가 클수록 강함: 족보 × 15^5 + 키커들 */
export function eval5(cards: Card[]): number {
  const ranks = cards.map((c) => (c.rank === 1 ? 14 : c.rank)).sort((a, b) => b - a);
  const flush = cards.every((c) => c.suit === cards[0].suit);
  const uniq = [...new Set(ranks)];
  let straightHigh = 0;
  if (uniq.length === 5) {
    if (ranks[0] - ranks[4] === 4) straightHigh = ranks[0];
    else if (ranks.join(',') === '14,5,4,3,2') straightHigh = 5; // A-2-3-4-5
  }
  const counts = new Map<number, number>();
  for (const r of ranks) counts.set(r, (counts.get(r) ?? 0) + 1);
  // 많이 나온 순, 같으면 높은 순
  const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const order = groups.flatMap(([r, n]) => Array(n).fill(r));
  let cat: number;
  let keys: number[] = order;
  if (straightHigh && flush) {
    cat = 8;
    keys = [straightHigh];
  } else if (groups[0][1] === 4) cat = 7;
  else if (groups[0][1] === 3 && groups[1][1] === 2) cat = 6;
  else if (flush) cat = 5;
  else if (straightHigh) {
    cat = 4;
    keys = [straightHigh];
  } else if (groups[0][1] === 3) cat = 3;
  else if (groups[0][1] === 2 && groups[1][1] === 2) cat = 2;
  else if (groups[0][1] === 2) cat = 1;
  else cat = 0;
  const uniqKeys = [...new Set(keys)];
  let score = cat;
  for (let i = 0; i < 5; i++) score = score * 15 + (uniqKeys[i] ?? 0);
  return score;
}

export const categoryOf = (score: number) => Math.floor(score / 15 ** 5);

/** 7장(이하) 중 최고 5장 */
export function best(cards: Card[]): { score: number; cards: Card[] } {
  let top = { score: -1, cards: [] as Card[] };
  const n = cards.length;
  for (let a = 0; a < n; a++)
    for (let b = a + 1; b < n; b++)
      for (let c = b + 1; c < n; c++)
        for (let d = c + 1; d < n; d++)
          for (let e = d + 1; e < n; e++) {
            const five = [cards[a], cards[b], cards[c], cards[d], cards[e]];
            const s = eval5(five);
            if (s > top.score) top = { score: s, cards: five };
          }
  return top;
}
