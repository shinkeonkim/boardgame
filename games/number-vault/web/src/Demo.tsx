import { useEffect, useState } from 'react';
import { TileView } from './theme';

const ROW = [
  { n: 1, color: 0 as const },
  { n: 4, color: 1 as const },
  { n: 7, color: 0 as const },
  { n: 9, color: 1 as const },
];

/** 첫 화면 시연: 가려진 타일을 하나씩 맞혀 연다 */
export function Demo() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return setStep(3);
    const t = setInterval(() => setStep((s) => (s + 1) % 6), 1100);
    return () => clearInterval(t);
  }, []);
  const opened = step >= 2 ? (step >= 4 ? [1, 2] : [1]) : [];
  return (
    <div className="nv-demo" aria-hidden>
      <div className="nv-tiles">
        {ROW.map((t, i) => (
          <TileView key={i} t={{ ...t, n: opened.includes(i) ? t.n : null, revealed: opened.includes(i) }} size="md" selected={(step === 1 && i === 1) || (step === 3 && i === 2)} />
        ))}
      </div>
      <div className="nv-demo-say">{step === 1 ? '「두 번째는 4!」' : step === 2 ? '맞았어요 🔓 하나 더?' : step === 3 ? '「세 번째는 7!」' : step >= 4 ? '또 맞았어요!' : '가려진 타일은 왼쪽부터 커져요'}</div>
    </div>
  );
}
