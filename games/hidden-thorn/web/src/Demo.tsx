import { iconize } from '@bg/ui';
import { useEffect, useState } from 'react';
import { DiscView } from './theme';

/** 첫 화면 시연: 「3장」 도전 → 내 것 → 남의 것 → 가시! */
export function Demo() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return setStep(4);
    const t = setInterval(() => setStep((s) => (s + 1) % 6), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="ht-demo" aria-hidden>
      <div className="ht-demo-say">{iconize(['모두 원판을 몰래 놓아요', '「장미 3장 뒤집을게!」', '내 원판부터… 🌹', '다음은 민지 것… 🌹', '도윤 것… 🌵 가시!', '찔렸다! 원판 하나를 잃어요'][step])}</div>
      <div className="ht-demo-row">
        <DiscView disc={step >= 2 ? 'rose' : null} seat={0} size={38} />
        <DiscView disc={step >= 3 ? 'rose' : null} seat={1} size={38} />
        <DiscView disc={step >= 4 ? 'thorn' : null} seat={2} size={38} />
      </div>
    </div>
  );
}
