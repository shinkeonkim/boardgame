import { useEffect, useState } from 'react';

const WORDS = ['고래', '피아노', '태풍', '상어', '케이크', '문어', '로켓', '진주', '거미'];
const KEY = ['r', 'b', 'n', 'r', 'n', 'r', 'b', 'r', 'x'];
const ORDER = [0, 3, 5];

/** 첫 화면 시연: 팀장 힌트 「바다 3」 → 요원이 바다 단어를 하나씩 */
export function Demo() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return setStep(4);
    const t = setInterval(() => setStep((s) => (s + 1) % 6), 1100);
    return () => clearInterval(t);
  }, []);
  const open = new Set(ORDER.slice(0, Math.max(0, step - 1)));
  return (
    <div className="co-demo" aria-hidden>
      <div className={`co-demo-clue ${step >= 1 ? 'show' : ''}`}>
        🔴 팀장: 「<b>바다</b>」 3
      </div>
      <div className="co-demo-grid">
        {WORDS.map((w, i) => (
          <span key={w} className={`co-card ${open.has(i) ? `${KEY[i] === 'r' ? 'red' : 'blue'} open` : 'unknown'}`}>
            <span className="co-word">{w}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
