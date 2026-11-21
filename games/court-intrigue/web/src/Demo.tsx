import { useEffect, useState } from 'react';
import { Coins, RoleCard } from './theme';

/** 첫 화면 시연: 세금(재무관 주장) → 도전! → 거짓말 들킴 */
export function Demo() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return setStep(3);
    const t = setInterval(() => setStep((s) => (s + 1) % 5), 1300);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="ci-demo" aria-hidden>
      <div className="ci-demo-row">
        <b>민지</b> <Coins n={2} />
        <RoleCard role={step >= 3 ? 'raider' : null} size="sm" lost={step >= 3} />
        <RoleCard role={null} size="sm" />
      </div>
      <div className="ci-demo-say">{['「세금! 나는 재무관이야」 💰', '도윤: 「거짓말이야!」 ⚡', '카드를 보여 줘야 해요…', '재무관이 아니었어요! 💔', '도전 성공 — 민지 영향력 하나 잃음'][step]}</div>
    </div>
  );
}
