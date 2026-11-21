import { useEffect, useState } from 'react';
import { CLASSIC } from '@bg/flare-signals-engine';
import { FlareCard, MysteryCard } from './theme';

const clue = (value: number | null, colors: number[] = [], focus = false) => ({ colors, notColors: [], value, notValues: [], touched: value !== null || colors.length > 0, focus, focusOnChop: false, at: 0 });

/** 첫 화면 시연: 친구 카드는 보이고 내 카드는 안 보여요 → 힌트 → 쏘아 올리기 */
export function Demo() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return setStep(3);
    const t = setInterval(() => setStep((s) => (s + 1) % 5), 1300);
    return () => clearInterval(t);
  }, []);
  const c = CLASSIC;
  return (
    <div className="fs-demo" aria-hidden>
      <div className="fs-demo-sky">
        {[0, 1, 2, 3, 4].map((k) => (k === 0 && step >= 3 ? <FlareCard key={k} c={c} color={0} value={1} size="xs" className="pop" /> : <span key={k} className="pile-empty mini" style={{ ['--fc' as string]: ['#e0483c', '#e6b422', '#2fa865', '#3b7be0', '#9b5ad6'][k] }} />))}
      </div>
      <div className="fs-demo-row">
        <span className="small">친구</span>
        <FlareCard c={c} color={2} value={3} size="sm" />
        <FlareCard c={c} color={3} value={4} size="sm" />
        <FlareCard c={c} color={1} value={2} size="sm" />
      </div>
      <div className={`fs-demo-bubble ${step >= 1 && step < 3 ? 'show' : ''}`}>친구: 「이 카드가 1이야!」</div>
      <div className="fs-demo-row">
        <span className="small">나</span>
        <MysteryCard c={c} clue={clue(step >= 2 ? 1 : null, [], step >= 2)} show size="sm" className={step === 2 ? 'selected' : ''} />
        {step < 3 && <MysteryCard c={c} clue={clue(null)} show size="sm" />}
        <MysteryCard c={c} clue={clue(null)} show size="sm" />
      </div>
    </div>
  );
}
