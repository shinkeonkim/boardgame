import { CoverFan } from '@bg/web';
import { RoleCard, TokenCard } from './theme';

/** 표지: 역할 카드 펼침 + 성공·실패 카드 */
export function Cover() {
  return (
    <div className="cover-stack">
      <CoverFan spread={8}>{(['agent', 'seer', 'spy', 'guard', 'hunter'] as const).map((r) => <RoleCard key={r} role={r} />)}</CoverFan>
      <div className="cover-row">
        <TokenCard kind="success" />
        <TokenCard kind="fail" />
        <TokenCard kind="yes" />
        <TokenCard kind="no" />
      </div>
    </div>
  );
}
