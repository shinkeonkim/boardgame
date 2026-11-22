import { useEffect, useState } from 'react';
import { SAMPLE, Sketch } from './theme';

/** 첫 화면 시연: 선이 하나씩 그려지고 「집!」 */
export function Demo() {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return setN(SAMPLE.length + 1);
    const t = setInterval(() => setN((x) => (x + 1) % (SAMPLE.length + 3)), 550);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="sq-demo" aria-hidden>
      <Sketch strokes={SAMPLE.slice(0, n)} />
      <b>{n > SAMPLE.length ? '🎉 「집」 정답!' : '무엇일까요?'}</b>
    </div>
  );
}
