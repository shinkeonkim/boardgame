import { useEffect, useState } from 'react';
import { TileView } from './theme';

/** 첫 화면 시연: 공장에서 한 색을 가져와 줄을 채우고 벽으로 */
export function Demo() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return setStep(3);
    const t = setInterval(() => setStep((s) => (s + 1) % 5), 1100);
    return () => clearInterval(t);
  }, []);
  const factory = [0, 0, 3, 1];
  return (
    <div className="ta-demo" aria-hidden>
      <div className="ta-factory">
        {factory.map((col, i) => (
          <TileView key={i} color={col} size={26} selected={step === 1 && col === 0} ghost={step >= 2 && col === 0} />
        ))}
      </div>
      <div className="ta-demo-line">
        <span className="ta-slot" style={{ width: 26, height: 26 }} />
        {step >= 2 && step < 3 ? (
          <>
            <TileView color={0} size={26} />
            <TileView color={0} size={26} />
          </>
        ) : (
          <>
            <span className="ta-slot" style={{ width: 26, height: 26 }} />
            <span className="ta-slot" style={{ width: 26, height: 26 }} />
          </>
        )}
        <span className="ta-demo-arrow">→</span>
        {step >= 3 ? <TileView color={0} size={26} /> : <span className="ta-cell" style={{ width: 26, height: 26 }} />}
      </div>
      <div className="ta-demo-say">{['공장에 타일 4장', '하늘색을 모두 가져와요', '패턴 줄에 놓고', '줄이 차면 벽으로 → 점수!', '이어서 놓을수록 점수가 커져요'][step]}</div>
    </div>
  );
}
