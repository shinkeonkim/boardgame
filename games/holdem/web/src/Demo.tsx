import { useEffect, useState } from 'react';
import { PlayingCard } from '@bg/ui';
import { ChipStack } from './theme';

const BOARD = [
  { id: 'a', suit: 1, rank: 1 },
  { id: 'b', suit: 2, rank: 13 },
  { id: 'c', suit: 1, rank: 7 },
  { id: 'd', suit: 0, rank: 1 },
  { id: 'e', suit: 3, rank: 2 },
];
/** 첫 화면 시연: 플랍·턴·리버가 깔리고 팟이 커짐 */
export function Demo() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return setStep(3);
    const t = setInterval(() => setStep((s) => (s + 1) % 4), 1300);
    return () => clearInterval(t);
  }, []);
  const n = [0, 3, 4, 5][step];
  return (
    <div className="hd-demo" aria-hidden>
      <div className="hd-demo-row">
        {BOARD.slice(0, n).map((c) => (
          <PlayingCard key={c.id} card={c} size="sm" />
        ))}
      </div>
      <div className="hd-demo-row">
        <ChipStack amount={[30, 120, 300, 780][step]} size={22} />
        <b>팟 {[30, 120, 300, 780][step]}</b>
      </div>
      <b>{['프리플랍', '플랍', '턴', '리버 — 쇼다운!'][step]}</b>
    </div>
  );
}
