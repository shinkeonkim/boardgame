import { PlayingCard } from '@bg/ui';
import { CoverFan } from '@bg/web';

/** 표지: 하트 부채꼴 + 스페이드 Q */
export function Cover() {
  return (
    <div className="hr-cover">
      <CoverFan spread={9}>
        {[1, 13, 12, 11, 10].map((r) => (
          <PlayingCard key={r} card={{ id: `h${r}`, suit: 1, rank: r }} size="lg" />
        ))}
      </CoverFan>
      <span className="hr-cover-queen">
        <PlayingCard card={{ id: 'q', suit: 0, rank: 12 }} size="lg" />
      </span>
    </div>
  );
}
