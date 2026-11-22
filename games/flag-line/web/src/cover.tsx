import { CoverFan } from '@bg/web';
import { FlagIcon, Troop } from './theme';

/** 표지: 깃발 앞에 놓인 대형(쐐기) + 손패 */
export function Cover() {
  return (
    <div className="cover-stack">
      <div className="cover-row">
        <FlagIcon owner={0} size={56} />
        <FlagIcon owner={null} size={56} />
        <FlagIcon owner={1} size={56} />
      </div>
      <CoverFan spread={7}>{[[3, 7], [3, 8], [3, 9], [0, 10], [5, 6]].map(([c, v], i) => <Troop key={i} color={c} value={v} size="md" />)}</CoverFan>
    </div>
  );
}
