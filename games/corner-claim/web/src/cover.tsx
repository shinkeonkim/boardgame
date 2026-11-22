import { PIECES } from '@bg/corner-claim-engine';
import { PieceIcon } from './theme';

/** 표지: 네 색 조각이 귀퉁이에서 뻗어 나오는 모습 */
const SHOW: [string, number, number][] = [
  ['X5', 0, 0],
  ['W5', 1, 1],
  ['F5', 2, 3],
  ['L5', 3, 2],
  ['T5', 0, 1],
  ['Z5', 2, 0],
  ['P5', 1, 2],
  ['V5', 3, 3],
];
export function Cover() {
  return (
    <div className="cover-pieces-grid">
      {SHOW.map(([id, color, o]) => {
        const p = PIECES.find((x) => x.id === id) ?? PIECES[PIECES.length - 1];
        return <PieceIcon key={id} cells={p.orients[o % p.orients.length]} color={color} size={26} />;
      })}
    </div>
  );
}
