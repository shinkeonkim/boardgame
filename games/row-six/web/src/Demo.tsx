import { useEffect, useState } from 'react';
import { NumberCard } from './theme';

/** 첫 화면 시연: 네 사람이 동시에 낸 카드가 작은 것부터 줄에 붙고, 6번째가 줄을 가져간다 */
const START = [[3, 12, 19, 24, 31], [40], [58, 61], [77]];
const PLAYS = [33, 44, 62, 80];

export function Demo() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return setStep(5);
    const t = setInterval(() => setStep((s) => (s >= 7 ? 0 : s + 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const rows = START.map((r) => [...r]);
  const placed = PLAYS.slice(0, Math.max(0, step - 1));
  let took = false;
  for (const n of placed) {
    let best = -1;
    rows.forEach((r, i) => {
      if (r[r.length - 1] < n && (best < 0 || r[r.length - 1] > rows[best][rows[best].length - 1])) best = i;
    });
    if (rows[best].length >= 5) {
      rows[best] = [n];
      took = true;
    } else rows[best].push(n);
  }
  return (
    <div className="rs-demo" aria-hidden>
      <div className="rs-demo-reveal">
        {PLAYS.map((n, i) => (
          <span key={n} className={`rs-demo-pick ${step >= 1 ? 'open' : ''} ${placed.includes(n) ? 'gone' : ''}`} style={{ transitionDelay: `${i * 60}ms` }}>
            <NumberCard n={n} size="xs" />
          </span>
        ))}
      </div>
      {rows.map((r, i) => (
        <div key={i} className="rs-demo-row">
          {r.map((n) => (
            <NumberCard key={n} n={n} size="xs" className={PLAYS.includes(n) ? 'fresh' : ''} />
          ))}
        </div>
      ))}
      <div className={`rs-demo-note ${took ? 'show' : ''}`}>33이 6번째 → 줄을 가져가요!</div>
    </div>
  );
}
