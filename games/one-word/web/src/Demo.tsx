import { useEffect, useState } from 'react';
import { ClueNote, WordCard } from './theme';

/** 첫 화면 시연: 힌트 → 겹친 힌트 지우기 → 정답 */
export function Demo() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return setStep(2);
    const t = setInterval(() => setStep((s) => (s + 1) % 3), 1500);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="ow-demo" aria-hidden>
      <WordCard word={step === 2 ? '고래' : null} size="md" />
      <div className="ow-demo-row">
        <ClueNote text="바다" seatColor="#e0483c" state={step >= 1 ? 'erased' : 'shown'} />
        <ClueNote text="바다" seatColor="#3b7be0" state={step >= 1 ? 'erased' : 'shown'} />
        <ClueNote text="분수" seatColor="#2fa865" state="shown" />
        <ClueNote text="큰" seatColor="#e6b422" state="shown" />
      </div>
      <b>{['한 단어씩 힌트', '겹친 「바다」는 지워져요', '「분수」 「큰」… 고래!'][step]}</b>
    </div>
  );
}
