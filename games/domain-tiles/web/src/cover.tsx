import type { Kingdom } from '@bg/domain-tiles-engine';
import { KingdomBoard } from './Kingdom';

/** 표지: 거의 다 지은 5×5 왕국 */
const K: Kingdom = (() => {
  const t = [
    ['wheat', 'wheat', 'forest', 'forest', 'forest'],
    ['wheat', 'water', 'water', 'forest', 'mine'],
    ['grass', 'water', 'castle', 'wheat', 'mine'],
    ['grass', 'water', 'swamp', 'wheat', 'wheat'],
    ['grass', 'grass', 'swamp', 'swamp', 'wheat'],
  ] as const;
  const crowns: Record<string, number> = { '0,-2': 1, '-1,-1': 1, '2,-1': 2, '-2,1': 1, '0,2': 2, '2,0': 3, '1,-2': 1 };
  const k: Kingdom = {};
  t.forEach((row, y) =>
    row.forEach((v, x) => {
      const p = `${x - 2},${y - 2}`;
      k[p] = v === 'castle' ? { castle: true } : { t: v, crowns: crowns[p] ?? 0 };
    }),
  );
  return k;
})();
export function Cover() {
  return (
    <div className="dt-cover">
      <KingdomBoard kingdom={K} size={5} cell={84} />
    </div>
  );
}
