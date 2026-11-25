import { useEffect, useState } from 'react';
import { DECK } from '@bg/go-stop-engine';
import { HwatuCard } from './theme';

const card = (id: string) => DECK.find((c) => c.id === id)!;
const SAY = ['손에서 벚꽃 광을 내면', '바닥의 벚꽃과 짝!', '광 3장이면 3점 — 고? 스톱?'];
export function Demo() {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return setI(2);
    const t = setInterval(() => setI((s) => (s + 1) % 3), 1400);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="gs-demo" aria-hidden>
      <div className="gs-demo-row">
        <span className={`gs-demo-card ${i >= 1 ? 'moved' : ''}`}>
          <HwatuCard card={card('3-0')} w={40} glow={i === 0} />
        </span>
        <HwatuCard card={card('3-2')} w={40} glow={i === 1} />
        {i === 2 && (
          <>
            <HwatuCard card={card('1-0')} w={40} />
            <HwatuCard card={card('8-0')} w={40} />
          </>
        )}
      </div>
      <div className="gs-demo-say">{SAY[i]}</div>
    </div>
  );
}
