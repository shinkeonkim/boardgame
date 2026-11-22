import { TileView } from './theme';

/** 표지: 가려진 타일 줄과 맞힌 타일 하나 */
const ROW = [
  { n: 2, color: 0 as const, revealed: true },
  { n: null, color: 1 as const, revealed: false },
  { n: null, color: 0 as const, revealed: false },
  { n: 7, color: 1 as const, revealed: true },
  { n: null, color: 0 as const, revealed: false },
  { n: null, color: 1 as const, revealed: false },
];
export function Cover() {
  return (
    <div className="cover-stack">
      <div className="cover-row">{ROW.map((t, i) => <TileView key={i} t={t} size="lg" />)}</div>
      <div className="cover-row">
        {[{ n: 4, color: 1 as const, revealed: false }, { n: 9, color: 0 as const, revealed: false }, { n: 11, color: 1 as const, revealed: false }].map((t, i) => (
          <TileView key={i} t={t} mine size="lg" />
        ))}
      </div>
    </div>
  );
}
