import { useEffect, useState } from 'react';
import { CrownIcon, SeatStone } from './theme';

/** 첫 화면 왼쪽: 왕관이 움직이며 돌을 놓는 짧은 시연 (반복) */
const DEMO_N = 5;
const DEMO: { x: number; y: number; seat: number; hero?: boolean }[] = [
  { x: 3, y: 1, seat: 0 },
  { x: 3, y: 3, seat: 1 },
  { x: 2, y: 2, seat: 0 },
  { x: 1, y: 3, seat: 1 },
  { x: 2, y: 1, seat: 0 },
  { x: 3, y: 2, seat: 1 },
  { x: 1, y: 2, seat: 0 },
  { x: 3, y: 2, seat: 0, hero: true },
  { x: 0, y: 3, seat: 1 },
  { x: 1, y: 1, seat: 0 },
];

export function DemoBoard() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setStep(DEMO.length);
      return;
    }
    const t = setInterval(() => setStep((s) => (s >= DEMO.length + 2 ? 0 : s + 1)), 950);
    return () => clearInterval(t);
  }, []);
  const shown = Math.min(step, DEMO.length);
  const cells = new Map<number, { seat: number; fresh: boolean; hero: boolean }>();
  DEMO.slice(0, shown).forEach((m, i) => cells.set(m.y * DEMO_N + m.x, { seat: m.seat, fresh: i === shown - 1, hero: !!m.hero }));
  const crown = shown === 0 ? { x: 2, y: 2 } : DEMO[shown - 1];
  return (
    <div className="demo-board" aria-hidden>
      <div className="demo-grid">
        {Array.from({ length: DEMO_N * DEMO_N }, (_, i) => {
          const v = cells.get(i);
          return (
            <div key={i} className="demo-cell">
              {v && (
                <span className={`stone ${v.fresh ? (v.hero ? 'flipped' : 'fresh') : ''}`} key={`${i}-${v.seat}`}>
                  <SeatStone seat={v.seat} size="100%" />
                </span>
              )}
            </div>
          );
        })}
      </div>
      <span className="demo-crown" style={{ left: `${((crown.x + 0.5) / DEMO_N) * 100}%`, top: `${((crown.y + 0.5) / DEMO_N) * 100}%` }}>
        <CrownIcon size="100%" />
      </span>
    </div>
  );
}

