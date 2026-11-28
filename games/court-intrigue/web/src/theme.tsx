import { RoleArt } from './art';
import { Icon, iconize } from '@bg/ui';
import { ROLE_DEFS, Role } from '@bg/court-intrigue-engine';

export function RoleCard({ role, lost, size = 'md', selected, onClick, hidden, flip, flipFrom }: { role: Role | null; lost?: boolean; size?: 'xs' | 'sm' | 'md'; selected?: boolean; onClick?: () => void; hidden?: boolean; flip?: string; flipFrom?: string }) {
  const Tag = onClick ? 'button' : 'div';
  if (!role || hidden) return <Tag data-flip={flip} data-flip-from={flipFrom} className={`rcard pc back ${size} ${lost ? 'lost' : ''}`} onClick={onClick} aria-label="가려진 카드" />;
  const d = ROLE_DEFS[role];
  return (
    <Tag data-flip={flip} data-flip-from={flipFrom} className={`rcard pc ${size} ${lost ? 'lost' : ''} ${selected ? 'selected' : ''} ${lost ? '' : 'face'}`} style={{ ['--tone' as string]: d.color }} onClick={onClick} aria-label={`${d.name}${lost ? ' (잃음)' : ''}`}>
      {size === 'xs' ? (
        <span className="rcard-icon" aria-hidden>
          {iconize(d.icon)}
        </span>
      ) : (
        <RoleArt role={role} />
      )}
      <span className="rcard-name">{d.name}</span>
      {size === 'md' && (
        <span className="rcard-text">
          {d.action !== '—' && <span>{d.action}</span>}
          {d.block !== '—' && <span><Icon name="ban" /> {d.block}</span>}
        </span>
      )}
    </Tag>
  );
}

/** 금화: 겹쳐 쌓인 동전(최대 10개) + 개수. 개수가 바뀌면 살짝 튐 */
export function Coins({ n }: { n: number }) {
  return (
    <span className="coins" title={`금화 ${n}개`}>
      <span className="coin-stack" aria-hidden>
        {Array.from({ length: Math.max(1, Math.min(n, 10)) }, (_, i) => (
          <i key={i} className={n === 0 ? 'empty' : ''} />
        ))}
      </span>
      <b key={n} className="coin-n">
        {n}
      </b>
    </span>
  );
}

export function Logo({ size = 48 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden>
      <rect width="64" height="64" rx="14" fill="#231c2e" />
      <path d="M20 44 L22 24 L28 32 L32 20 L36 32 L42 24 L44 44 Z" fill="#d79a1e" />
      <rect x="18" y="46" width="28" height="5" rx="2" fill="#d79a1e" />
      <circle cx="47" cy="18" r="7" fill="#8a5cd0" />
      <text x="47" y="22" textAnchor="middle" fontSize="10" fontWeight="900" fill="#fff" fontFamily="system-ui">?</text>
    </svg>
  );
}
