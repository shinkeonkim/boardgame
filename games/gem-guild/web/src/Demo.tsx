import { useEffect, useState } from 'react';
import { CARDS } from '@bg/gem-guild-engine';
import { DevCardView, GemToken } from './theme';

/** 첫 화면 시연: 보석 3개 → 카드 사기 → 보너스로 다음 카드가 싸져요 */
export function Demo() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return setStep(3);
    const t = setInterval(() => setStep((s) => (s + 1) % 5), 1200);
    return () => clearInterval(t);
  }, []);
  const card = CARDS.find((c) => c.tier === 1 && c.cost.filter(Boolean).length === 3)!;
  return (
    <div className="gg-demo" aria-hidden>
      <div className="gg-bank-row">
        {[0, 1, 2, 3, 4].map((g) => (
          <GemToken key={g} gem={g} size={30} selected={step === 1 && card.cost[g] > 0} />
        ))}
      </div>
      <DevCardView card={card} affordable={step >= 2} selected={step >= 3} />
      <div className="gg-demo-say">{['보석을 모아…', '서로 다른 색 3개!', '이제 살 수 있어요', '샀어요! 이 색은 앞으로 1개씩 할인 💎', '보너스가 쌓이면 귀족이 찾아와요 🎩'][step]}</div>
    </div>
  );
}
