import { CoverFan } from '@bg/web';
import { CrownIcon, MoveCard, SeatStone } from './theme';

/** 표지: 왕관과 두 가문의 돌, 이동 카드 */
export function Cover() {
  return (
    <div className="cover-stack">
      <div className="cover-row">
        <SeatStone seat={0} size={52} />
        <CrownIcon size={92} />
        <SeatStone seat={1} size={52} />
      </div>
      <CoverFan spread={8}>{([[0, 1], [2, 3], [5, 2], [7, 1]] as const).map(([dir, dist], i) => <MoveCard key={i} card={{ id: `c${i}`, dir, dist }} size="md" />)}</CoverFan>
    </div>
  );
}
