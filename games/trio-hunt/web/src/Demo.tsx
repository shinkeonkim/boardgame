import { useEffect, useState } from 'react';
import { TrioCard } from './theme';

/** 첫 화면 시연: 7 → 7 → 7 세트! */
export function Demo() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return setStep(3);
    const t = setInterval(() => setStep((s) => (s + 1) % 5), 1100);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="th-demo" aria-hidden>
      <div className="th-demo-row">
        {[0, 1, 2].map((i) => (
          <TrioCard key={`${i}-${step > i}`} n={step > i ? 7 : null} faceDown={step <= i} size="lg" glow={step > i} />
        ))}
      </div>
      <b>{step >= 3 ? '7 세 장 — 바로 승리!' : '가장 작은 카드? 가장 큰 카드?'}</b>
    </div>
  );
}
