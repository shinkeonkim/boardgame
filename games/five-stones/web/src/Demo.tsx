import { useEffect, useState } from 'react';
import { StoneView } from './theme';

/** 첫 화면 시연: 흑이 하나씩 이어 가다 다섯 */
const SEQ: [number, number, 0 | 1][] = [
  [2, 2, 0],
  [3, 2, 1],
  [3, 3, 0],
  [2, 3, 1],
  [4, 4, 0],
  [5, 5, 1],
  [1, 1, 0],
  [1, 2, 1],
  [0, 0, 0],
];
export function Demo() {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return setN(SEQ.length);
    const t = setInterval(() => setN((s) => (s >= SEQ.length + 2 ? 0 : s + 1)), 700);
    return () => clearInterval(t);
  }, []);
  const done = n >= SEQ.length;
  return (
    <div className="fs-demo" aria-hidden>
      <div className="fs-demo-board">
        {SEQ.slice(0, n).map(([x, y, s], i) => (
          <span key={i} className={`fs-demo-stone ${done && s === 0 && x === y ? 'win' : ''}`} style={{ left: `${(x + 0.5) * 16.66}%`, top: `${(y + 0.5) * 16.66}%` }}>
            <StoneView stone={s} size={100} />
          </span>
        ))}
      </div>
      <div className="fs-demo-say">{done ? '흑 다섯! 대각선 승리' : n % 2 ? '백이 막아요' : '흑이 이어 가요'}</div>
    </div>
  );
}
