import { useEffect, useState } from 'react';
import { FlagIcon, Troop } from './theme';

/** 첫 화면 시연: 파랑 8·9·10 쐐기 완성 → 깃발 차지 */
export function Demo() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return setStep(4);
    const t = setInterval(() => setStep((s) => (s + 1) % 6), 1000);
    return () => clearInterval(t);
  }, []);
  const mine = [8, 9, 10].slice(0, Math.min(3, step));
  return (
    <div className="fl-demo" aria-hidden>
      <div className="fl-stack theirs">
        <Troop color={1} value={4} size="sm" />
        <Troop color={4} value={6} size="sm" />
      </div>
      <div className="fl-flag">
        <FlagIcon owner={step >= 4 ? 0 : null} size={28} />
      </div>
      <div className="fl-stack mine">
        {mine.map((v) => (
          <Troop key={v} color={3} value={v} size="sm" />
        ))}
      </div>
      <div className="fl-demo-say">{step >= 4 ? '쐐기 완성! 상대는 못 이겨요 → 깃발 차지 🚩' : '같은 색 연속 숫자를 모아요…'}</div>
    </div>
  );
}
