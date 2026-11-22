import { TileView } from './theme';

/** 표지: 공장 원판 세 개 위의 타일과, 반쯤 채운 벽 */
const FACTORIES = [
  [0, 0, 2, 4],
  [1, 3, 3, 0],
  [4, 2, 1, 1],
];
export function Cover() {
  return (
    <div className="cover-stack">
      <div className="cover-row">
        {FACTORIES.map((f, i) => (
          <div key={i} className="ta-factory cover-factory">
            {f.map((col, k) => (
              <TileView key={k} color={col} size={34} />
            ))}
          </div>
        ))}
      </div>
      <div className="cover-wall">
        {Array.from({ length: 25 }, (_, i) => {
          const r = Math.floor(i / 5);
          const c = i % 5;
          const col = (c - r + 5) % 5;
          return (i * 7) % 3 !== 0 ? <TileView key={i} color={col} size={30} /> : <span key={i} className="cover-wall-slot" />;
        })}
      </div>
    </div>
  );
}
