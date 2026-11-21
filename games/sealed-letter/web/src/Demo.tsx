import { useEffect, useState } from 'react';
import { LetterCard } from './theme';

/** 첫 화면 시연: 2장 중 1장 → 파수꾼으로 추측 */
export function Demo() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return setStep(2);
    const t = setInterval(() => setStep((s) => (s + 1) % 5), 1200);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="sl-demo" aria-hidden>
      <div className="hand-row">
        <LetterCard kind="watch" value={1} size="md" selected={step >= 1} className={step >= 2 ? 'played' : ''} />
        <LetterCard kind="queen" value={8} size="md" />
      </div>
      <div className="sl-demo-say">{step === 0 ? '여왕은 지켜야 해요… 파수꾼을 내 볼까?' : step === 1 ? '「민지 님, 결투사죠?」' : step >= 2 ? '맞았어요! 민지 님 탈락 🗡️' : ''}</div>
    </div>
  );
}
