import { CoverFan } from '@bg/web';
import { TrioCard } from './theme';

/** 표지: 7 세 장과 뒤집힌 카드들 */
export function Cover() {
  return (
    <div className="cover-stack">
      <CoverFan spread={7}>{[7, 7, 7].map((n, i) => <TrioCard key={i} n={n} size="lg" glow />)}</CoverFan>
      <div className="cover-row">
        {[3, null, 11, null, 5].map((n, i) => (
          <TrioCard key={i} n={n} faceDown={n === null} size="md" />
        ))}
      </div>
    </div>
  );
}
