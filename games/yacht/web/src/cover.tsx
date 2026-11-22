import { Die } from './theme';

/** 표지: 요트(같은 눈 다섯)와 굴러가는 주사위 */
export function Cover() {
  return (
    <div className="cover-stack">
      <div className="cover-row">
        {[6, 6, 6, 6, 6].map((d, i) => (
          <Die key={i} face={d} size={64} held={i === 2} style={{ transform: `rotate(${(i - 2) * 6}deg) translateY(${Math.abs(i - 2) * 6}px)` }} />
        ))}
      </div>
      <div className="cover-row">
        {[1, 3, 5].map((d, i) => (
          <Die key={i} face={d} size={48} style={{ transform: `rotate(${i * 25 - 20}deg)` }} />
        ))}
      </div>
    </div>
  );
}
