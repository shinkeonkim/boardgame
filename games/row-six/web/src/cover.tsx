import { CoverFan } from '@bg/web';
import { CardBack, NumberCard } from './theme';

/** 표지: 벌점이 다른 카드 다섯 장을 펼치고, 뒤에 뒷면 두 장 */
export function Cover() {
  return (
    <div className="cover-stack">
      <CoverFan>{[7, 22, 55, 66, 104].map((n) => <NumberCard key={n} n={n} size="lg" />)}</CoverFan>
      <div className="cover-row">
        <CardBack size="md" />
        <CardBack size="md" />
      </div>
    </div>
  );
}
