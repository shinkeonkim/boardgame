import { CoverFan } from '@bg/web';
import { SpaceCard } from './theme';

/** 표지: 네 색과 로켓 부채꼴 */
export function Cover() {
  return (
    <div className="ot-cover">
      <CoverFan spread={10}>
        {[
          { id: 'a', suit: 0, rank: 9 },
          { id: 'b', suit: 1, rank: 7 },
          { id: 'c', suit: 4, rank: 4 },
          { id: 'd', suit: 2, rank: 5 },
          { id: 'e', suit: 3, rank: 8 },
        ].map((c) => (
          <SpaceCard key={c.id} card={c} size="md" />
        ))}
      </CoverFan>
    </div>
  );
}
