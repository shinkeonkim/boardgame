import { useEffect, useState } from 'react';
import { PlayingCard } from '@bg/ui';

/** 첫 화면 시연: 클로버를 따라 내다가, 무늬가 없는 사람이 스페이드 Q 를 버림 */
const STEPS = [
  { cards: [{ id: 'a', suit: 3, rank: 10 }], say: '클로버 10으로 시작' },
  { cards: [{ id: 'a', suit: 3, rank: 10 }, { id: 'b', suit: 3, rank: 1 }], say: '클로버 A — 가장 높아요' },
  { cards: [{ id: 'a', suit: 3, rank: 10 }, { id: 'b', suit: 3, rank: 1 }, { id: 'c', suit: 0, rank: 12 }], say: '클로버가 없어서 스페이드 Q 를 버림!' },
  { cards: [{ id: 'a', suit: 3, rank: 10 }, { id: 'b', suit: 3, rank: 1 }, { id: 'c', suit: 0, rank: 12 }, { id: 'd', suit: 1, rank: 4 }], say: 'A 를 낸 사람이 13 + 1점을 가져가요' },
];
export function Demo() {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return setI(STEPS.length - 1);
    const t = setInterval(() => setI((s) => (s + 1) % STEPS.length), 1200);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="hr-demo" aria-hidden>
      <div className="hr-demo-row">
        {STEPS[i].cards.map((c) => (
          <PlayingCard key={c.id} card={c} size="sm" />
        ))}
      </div>
      <div className="hr-demo-say">{STEPS[i].say}</div>
    </div>
  );
}
