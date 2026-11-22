import { CoverFan } from '@bg/web';
import { PlayingCard } from './theme';

/** 표지: 그림 카드와 조커, 공격 카드 */
export function Cover() {
  return (
    <CoverFan spread={9}>
      {[
        { id: 'a', suit: 0, rank: 1 },
        { id: 'b', suit: 1, rank: 13 },
        { id: 'c', suit: -1, rank: 1 },
        { id: 'd', suit: 2, rank: 12 },
        { id: 'e', suit: 3, rank: 11 },
        { id: 'f', suit: 1, rank: 7 },
      ].map((c) => (
        <PlayingCard key={c.id} card={c} size="lg" />
      ))}
    </CoverFan>
  );
}
