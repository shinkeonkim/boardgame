import { Cup, Die } from './theme';

/** 표지: 엎어 둔 컵들과 쏟아진 주사위 */
export function Cover() {
  return (
    <div className="cover-stack">
      <div className="cover-row">
        <Cup seat={0} count={5} size={84} />
        <Cup seat={1} count={4} size={84} />
        <Cup seat={2} count={5} size={84} />
      </div>
      <div className="cover-row">
        {[1, 6, 3, 6, 5].map((f, i) => (
          <Die key={i} face={f} seat={i % 3} size={52} style={{ transform: `rotate(${(i - 2) * 9}deg)` }} />
        ))}
      </div>
    </div>
  );
}
