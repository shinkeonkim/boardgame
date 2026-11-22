import { CARDS, NOBLES } from '@bg/gem-guild-engine';
import { CoverFan } from '@bg/web';
import { DevCardView, GemToken, NobleView } from './theme';

/** 표지: 단계별 카드 + 쌓인 보석 칩 + 귀족 */
const pick = (tier: number, bonus: number) => CARDS.find((c) => c.tier === tier && c.bonus === bonus)!;
export function Cover() {
  return (
    <div className="cover-stack">
      <div className="cover-row">
        <NobleView noble={NOBLES[0]} />
        <NobleView noble={NOBLES[3]} />
      </div>
      <CoverFan spread={6}>{[pick(1, 2), pick(2, 1), pick(3, 0), pick(2, 3), pick(1, 4)].map((c) => <DevCardView key={c.id} card={c} />)}</CoverFan>
      <div className="cover-row">
        {[0, 1, 2, 3, 4, 5].map((g) => (
          <GemToken key={g} gem={g} size={54} />
        ))}
      </div>
    </div>
  );
}
