import { CoverFan } from '@bg/web';
import { NumCard } from './theme';

/** 표지: 작은 수부터 큰 수로 이어지는 카드 */
export function Cover() {
  return (
    <div className="sc-cover">
      <CoverFan spread={9}>
        {[3, 18, 42, 67, 95].map((n) => (
          <NumCard key={n} n={n} size="lg" />
        ))}
      </CoverFan>
    </div>
  );
}
