import { TileFace } from './theme';

/** 표지: 줄(같은 색 연속)과 무리(같은 숫자) */
const t = (n: number, color: number, k = 0) => ({ id: `${color}-${n}-${k}`, n, color });
export function Cover() {
  return (
    <div className="cover-stack">
      <div className="cover-row">{[t(4, 0), t(5, 0), t(6, 0), t(7, 0)].map((x) => <TileFace key={x.id} t={x} />)}</div>
      <div className="cover-row">{[t(9, 0, 1), t(9, 1), t(9, 2), t(9, 3)].map((x) => <TileFace key={x.id} t={x} />)}</div>
      <div className="cover-row">{[t(11, 4), t(12, 4), { id: 'J0', n: 0, color: -1 }, t(13, 4)].map((x) => <TileFace key={x.id} t={x} />)}</div>
    </div>
  );
}
