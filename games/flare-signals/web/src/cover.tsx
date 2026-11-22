import { CLASSIC } from '@bg/flare-signals-engine';
import { CoverFan } from '@bg/web';
import { FlareCard } from './theme';

/** 표지: 다섯 색 불꽃 카드를 1~5로 펼침 */
export function Cover() {
  return <CoverFan spread={9}>{[0, 1, 2, 3, 4].map((col) => <FlareCard key={col} c={CLASSIC} color={col} value={col + 1} size="md" />)}</CoverFan>;
}
