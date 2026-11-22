import { PlayingCard } from '@bg/ui';
import { CoverFan } from '@bg/web';
import { ChipStack } from './theme';

/** 표지: 로열 플러시와 칩 더미 */
export function Cover() {
  return (
    <div className="cover-stack">
      <CoverFan spread={6}>{[1, 13, 12, 11, 10].map((r) => <PlayingCard key={r} card={{ id: `h${r}`, suit: 1, rank: r }} size="lg" />)}</CoverFan>
      <div className="cover-row">
        <ChipStack amount={1500} size={40} max={4} />
        <ChipStack amount={630} size={40} max={4} />
        <ChipStack amount={2100} size={40} max={5} />
      </div>
    </div>
  );
}
