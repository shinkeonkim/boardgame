import { useEffect, useState } from 'react';
import type { Kingdom } from '@bg/domain-tiles-engine';
import { KingdomBoard } from './Kingdom';

/** 첫 화면 시연: 성 옆에 호수 → 호수 이어 붙이기 → 왕관 */
const STEPS: Kingdom[] = [
  { '0,0': { castle: true } },
  { '0,0': { castle: true }, '1,0': { t: 'water', crowns: 0 }, '2,0': { t: 'water', crowns: 1 } },
  { '0,0': { castle: true }, '1,0': { t: 'water', crowns: 0 }, '2,0': { t: 'water', crowns: 1 }, '1,1': { t: 'water', crowns: 0 }, '0,1': { t: 'wheat', crowns: 0 } },
  { '0,0': { castle: true }, '1,0': { t: 'water', crowns: 0 }, '2,0': { t: 'water', crowns: 1 }, '1,1': { t: 'water', crowns: 0 }, '0,1': { t: 'wheat', crowns: 0 }, '2,1': { t: 'water', crowns: 1 }, '2,2': { t: 'grass', crowns: 0 } },
];
const SAY = ['성에서 시작', '성 옆에 호수', '호수에 호수를 이어요', '호수 4칸 × 왕관 2 = 8점'];
export function Demo() {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return setI(STEPS.length - 1);
    const t = setInterval(() => setI((s) => (s + 1) % STEPS.length), 1300);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="dt-demo" aria-hidden>
      <KingdomBoard kingdom={STEPS[i]} size={3} cell={30} small />
      <div className="dt-demo-say">{SAY[i]}</div>
    </div>
  );
}
