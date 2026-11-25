import { useEffect, useState } from 'react';
import { SpaceCard } from './theme';

/** 첫 화면 시연: 파랑 7 과제를 민지가 맡음 → 파랑으로 시작 → 민지가 로켓으로 가져감 */
const STEPS = [
  { cards: [], say: '과제: 파랑 7 — 민지가 맡았어요' },
  { cards: [{ id: 'a', suit: 1, rank: 7 }], say: '파랑 7 로 시작' },
  { cards: [{ id: 'a', suit: 1, rank: 7 }, { id: 'b', suit: 1, rank: 3 }], say: '낮은 파랑으로 길을 비켜 줘요' },
  { cards: [{ id: 'a', suit: 1, rank: 7 }, { id: 'b', suit: 1, rank: 3 }, { id: 'c', suit: 4, rank: 2 }], say: '민지가 로켓으로 가져감 — 과제 성공!' },
];
export function Demo() {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return setI(STEPS.length - 1);
    const t = setInterval(() => setI((s) => (s + 1) % STEPS.length), 1300);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="ot-demo" aria-hidden>
      <div className="ot-demo-row">
        {STEPS[i].cards.map((c) => (
          <SpaceCard key={c.id} card={c} size="sm" />
        ))}
      </div>
      <div className="ot-demo-say">{STEPS[i].say}</div>
    </div>
  );
}
