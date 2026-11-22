import { CoverFan } from '@bg/web';
import { Coins, RoleCard } from './theme';

/** 표지: 역할 다섯 장 + 금화 */
export function Cover() {
  return (
    <div className="cover-stack">
      <CoverFan spread={7}>{(['treasurer', 'assassin', 'raider', 'diplomat', 'guard'] as const).map((r) => <RoleCard key={r} role={r} size="md" />)}</CoverFan>
      <div className="cover-coins">
        <Coins n={7} />
      </div>
    </div>
  );
}
