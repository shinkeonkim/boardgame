import { iconize } from '@bg/ui';
import { useEffect, useState } from 'react';
import { PlayingCard } from './theme';

const FLOW = [
  { top: { id: 'a', suit: 1, rank: 9 }, say: '하트 9 위에…' },
  { top: { id: 'b', suit: 1, rank: 2 }, say: '하트 2 — 공격 +2!' },
  { top: { id: 'c', suit: 0, rank: 1 }, say: '♠A로 막아 +7!' },
  { top: { id: 'd', suit: -1, rank: 1 }, say: '컬러 조커 +14!! 😱' },
];
/** 첫 화면 시연: 공격이 쌓이는 원카드 */
export function Demo() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return setStep(3);
    const t = setInterval(() => setStep((s) => (s + 1) % FLOW.length), 1300);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="oc-demo" aria-hidden>
      <div className="oc-demo-row">
        <PlayingCard key={step} card={FLOW[step].top} size="lg" className="oc-top" />
      </div>
      <b>{iconize(FLOW[step].say)}</b>
    </div>
  );
}
