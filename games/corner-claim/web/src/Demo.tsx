import { useEffect, useState } from 'react';
import { COLORS } from './theme';

const N = 8;
const STEPS: [number, number, number][][] = [
  [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
  [[7, 0, 1], [7, 1, 1], [6, 1, 1]],
  [[2, 1, 0], [2, 2, 0], [3, 2, 0]],
  [[5, 2, 1], [5, 3, 1], [4, 3, 1]],
  [[4, 4, 0], [4, 5, 0], [3, 5, 0]],
];

/** 첫 화면 시연: 귀퉁이에서 시작해 모서리로만 이어 가요 */
export function Demo() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return setStep(STEPS.length);
    const t = setInterval(() => setStep((s) => (s >= STEPS.length + 1 ? 0 : s + 1)), 900);
    return () => clearInterval(t);
  }, []);
  const cells = new Map<number, number>();
  STEPS.slice(0, step).forEach((st) => st.forEach(([x, y, c]) => cells.set(y * N + x, c)));
  return (
    <div className="cc-demo" aria-hidden>
      <div className="cc-board demo" style={{ ['--n' as string]: N }}>
        {Array.from({ length: N * N }, (_, i) => (
          <div key={i} className={`cc-cell ${cells.has(i) ? 'filled' : ''}`} style={cells.has(i) ? { background: COLORS[cells.get(i)!].fill } : undefined} />
        ))}
      </div>
      <div className="cc-demo-say">같은 색은 모서리로만 이어져요</div>
    </div>
  );
}
