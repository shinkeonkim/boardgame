import { useEffect, useState } from 'react';
import { Die } from './theme';

/** 첫 화면 시연: 굴림 → 6 세 개 남기기 → 다시 굴림 → 요트! */
const STEPS = [
  { dice: [6, 2, 6, 4, 6], hold: [false, false, false, false, false], say: '첫 굴림' },
  { dice: [6, 2, 6, 4, 6], hold: [true, false, true, false, true], say: '6 세 개를 남기고' },
  { dice: [6, 6, 6, 1, 6], hold: [true, true, true, false, true], say: '다시 굴려 6이 하나 더!' },
  { dice: [6, 6, 6, 6, 6], hold: [false, false, false, false, false], say: '요트! 50점 ⛵' },
];
export function Demo() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return setStep(3);
    const t = setInterval(() => setStep((s) => (s + 1) % STEPS.length), 1400);
    return () => clearInterval(t);
  }, []);
  const s = STEPS[step];
  return (
    <div className="ya-demo" aria-hidden>
      <div className="ya-demo-row">
        {s.dice.map((d, i) => (
          <Die key={`${step}-${i}`} face={d} size={46} held={s.hold[i]} className={s.hold[i] ? '' : 'rolled'} style={{ animationDelay: `${i * 50}ms` }} />
        ))}
      </div>
      <div className="ya-demo-say">{s.say}</div>
    </div>
  );
}
