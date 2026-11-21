import { useEffect, useState } from 'react';
import { DishCard } from './theme';

/** 첫 화면 시연: 한 접시 고르고 → 손패가 옆으로 → 회 세 개 완성 */
export function Demo() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return setStep(3);
    const t = setInterval(() => setStep((s) => (s + 1) % 5), 1100);
    return () => clearInterval(t);
  }, []);
  const mine = (['sashimi', 'sashimi', 'sashimi'] as const).slice(0, Math.min(3, step + 1));
  return (
    <div className="pp-demo" aria-hidden>
      <div className="hand-row">
        {(['tempura', 'sashimi', 'salmon', 'pudding'] as const).map((d, i) => (
          <DishCard key={i} dish={d} size="sm" selected={d === 'sashimi' && step < 3} />
        ))}
      </div>
      <div className="pp-demo-pass">→ 남은 접시는 옆 사람에게</div>
      <div className="tableau sm">
        {mine.map((d, i) => (
          <DishCard key={i} dish={d} size="xs" />
        ))}
        {step >= 2 && <b className="pp-demo-score">회 3개 = 10점!</b>}
      </div>
    </div>
  );
}
