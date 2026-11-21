import { useEffect, useState } from 'react';
import { TileFace } from './theme';

const T = (color: number, n: number) => ({ id: `${color}-${n}`, n, color });

/** 첫 화면 시연: 테이블 줄에 내 타일을 이어 붙이고, 무리도 내기 */
export function Demo() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return setStep(3);
    const t = setInterval(() => setStep((s) => (s + 1) % 5), 1100);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="nr-demo" aria-hidden>
      <div className="nr-set ok">
        {[T(0, 4), T(0, 5), T(0, 6)].map((x) => (
          <TileFace key={x.id} t={x} size="sm" />
        ))}
        {step >= 1 && <TileFace t={T(0, 7)} size="sm" fresh />}
      </div>
      {step >= 2 && (
        <div className="nr-set ok">
          {[T(1, 9), T(2, 9), T(3, 9)].map((x) => (
            <TileFace key={x.id} t={x} size="sm" fresh />
          ))}
        </div>
      )}
      <div className="nr-demo-say">{['테이블에 빨강 4·5·6 줄이 있어요', '내 빨강 7을 이어 붙이고', '9·9·9 무리도 내요', '손을 먼저 비우면 승리!', ''][step]}</div>
    </div>
  );
}
