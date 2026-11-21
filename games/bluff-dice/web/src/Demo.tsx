import { useEffect, useState } from 'react';
import { Cup, Die } from './theme';

const DICE = [
  [3, 3, 5],
  [1, 4, 6],
  [3, 2, 2],
];
const BIDS = ['「3이 3개」', '「3이 4개」', '거짓말!'];

/** 첫 화면 시연: 호가가 오르다 거짓말 → 공개해 세기 */
export function Demo() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return setStep(4);
    const t = setInterval(() => setStep((s) => (s + 1) % 6), 1200);
    return () => clearInterval(t);
  }, []);
  const open = step >= 4;
  return (
    <div className="bd-demo" aria-hidden>
      {DICE.map((ds, seat) => (
        <div key={seat} className="bd-demo-row">
          {open || seat === 0 ? ds.map((d, i) => <Die key={i} face={d} seat={seat} size={26} hit={open && (d === 3 || d === 1)} />) : <Cup seat={seat} count={3} size={28} />}
          {step >= seat + 1 && step <= 3 && <span className="bd-demo-say">{BIDS[seat]}</span>}
        </div>
      ))}
      <div className={`bd-demo-sum ${open ? 'show' : ''}`}>3이 3개 + 1이 1개 = 4개 → 호가가 맞았어요!</div>
    </div>
  );
}
