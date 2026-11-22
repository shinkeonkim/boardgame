import { CoverFan } from '@bg/web';
import { LetterCard } from './theme';

/** 표지: 역할 초상 다섯 장 */
export function Cover() {
  return (
    <CoverFan spread={7}>
      {(
        [
          ['watch', 1],
          ['seer', 2],
          ['duelist', 3],
          ['chancellor', 6],
          ['queen', 8],
        ] as const
      ).map(([k, v]) => (
        <LetterCard key={k} kind={k} value={v} size="md" />
      ))}
    </CoverFan>
  );
}
