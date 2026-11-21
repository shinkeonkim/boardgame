import { useEffect, useState } from 'react';
import type { Card } from '@bg/expedition-lines-engine';
import { CardFace } from './cards';
import { Glyph, suitVars } from './theme';

/** 첫 화면 왼쪽: 카드가 탐험대 줄에 차례로 쌓이는 짧은 시연 (반복) */
const DEMO: { col: number; card: Card }[] = [
  { col: 0, card: { id: 'd1', color: 0, value: 0 } as Card },
  { col: 1, card: { id: 'd2', color: 1, value: 3 } as Card },
  { col: 0, card: { id: 'd3', color: 0, value: 4 } as Card },
  { col: 2, card: { id: 'd4', color: 3, value: 2 } as Card },
  { col: 1, card: { id: 'd5', color: 1, value: 6 } as Card },
  { col: 0, card: { id: 'd6', color: 0, value: 7 } as Card },
  { col: 2, card: { id: 'd7', color: 3, value: 5 } as Card },
  { col: 1, card: { id: 'd8', color: 1, value: 9 } as Card },
  { col: 0, card: { id: 'd9', color: 0, value: 10 } as Card },
];

export function DemoBoard() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setStep(DEMO.length);
      return;
    }
    const t = setInterval(() => setStep((s) => (s >= DEMO.length + 2 ? 0 : s + 1)), 900);
    return () => clearInterval(t);
  }, []);
  const shown = DEMO.slice(0, Math.min(step, DEMO.length));
  const cols = [0, 1, 2].map((c) => shown.filter((d) => d.col === c).map((d) => d.card));
  const colors = [0, 1, 3];
  return (
    <div className="demo-board" aria-hidden>
      {cols.map((cards, i) => (
        <div key={i} className="demo-col" style={suitVars(colors[i])}>
          <span className="demo-empty">
            <Glyph color={colors[i]} size={18} />
          </span>
          {cards.map((c, j) => (
            <span key={c.id} className="demo-card" style={{ ['--j' as string]: j }}>
              <CardFace card={c} size="sm" />
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

