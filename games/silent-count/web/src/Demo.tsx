import { useEffect, useState } from 'react';
import { NumCard } from './theme';

/** 첫 화면 시연: 조용히… 12 → 한참 뒤 47 → 금방 51 */
const STEPS = [
  { pile: [], say: '모두 숨죽이고…' },
  { pile: [12], say: '12 — 금방 나왔어요' },
  { pile: [12], say: '…한참 기다리는 중' },
  { pile: [12, 47], say: '47!' },
  { pile: [12, 47, 51], say: '51 — 바로 이어서' },
];
export function Demo() {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return setI(STEPS.length - 1);
    const t = setInterval(() => setI((s) => (s + 1) % STEPS.length), 1100);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="sc-demo" aria-hidden>
      <div className="sc-demo-row">
        {STEPS[i].pile.map((n) => (
          <NumCard key={n} n={n} size="sm" />
        ))}
      </div>
      <div className="sc-demo-say">{STEPS[i].say}</div>
    </div>
  );
}
