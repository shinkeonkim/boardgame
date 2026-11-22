import { CoverFan } from '@bg/web';
import { CardFace } from './cards';

/** 표지: 다섯 지역 카드 (숫자가 클수록 유적이 가까워짐) + 투자 카드 */
export function Cover() {
  return (
    <CoverFan spread={8}>
      {[
        [0, 3],
        [1, 0],
        [2, 6],
        [3, 8],
        [4, 10],
      ].map(([color, value]) => (
        <CardFace key={`${color}-${value}`} card={{ id: `${color}-${value}`, color, value }} size="md" />
      ))}
    </CoverFan>
  );
}
