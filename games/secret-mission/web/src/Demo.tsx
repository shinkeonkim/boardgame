import { useEffect, useState } from 'react';
import { RoleCard, TokenCard } from './theme';

/** 첫 화면 시연: 역할 → 투표 → 원정 카드 공개 */
export function Demo() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return setStep(2);
    const t = setInterval(() => setStep((s) => (s + 1) % 3), 1600);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="sm-demo" aria-hidden>
      {step === 0 && (
        <div className="sm-demo-row">
          <RoleCard role="agent" size="sm" />
          <RoleCard role="spy" size="sm" />
          <RoleCard role="seer" size="sm" />
        </div>
      )}
      {step === 1 && (
        <div className="sm-demo-row">
          <TokenCard kind="yes" />
          <TokenCard kind="yes" />
          <TokenCard kind="no" />
        </div>
      )}
      {step === 2 && (
        <div className="sm-demo-row">
          <TokenCard kind="success" />
          <TokenCard kind="fail" />
          <TokenCard kind="success" />
        </div>
      )}
      <b>{['누가 첩자일까?', '원정대 찬성·반대', '실패 카드가 하나 — 원정 실패!'][step]}</b>
    </div>
  );
}
