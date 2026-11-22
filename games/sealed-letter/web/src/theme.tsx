import { RoleArt } from './art';
import { CARD_DEFS, Kind } from '@bg/sealed-letter-engine';

const TONE: Record<Kind, string> = {
  spy: '#5b6b84',
  watch: '#7a8a2a',
  seer: '#8a5cd0',
  duelist: '#c0703a',
  shield: '#2f9e6a',
  envoy: '#3a7bd5',
  scribe: '#1fa3b4',
  chancellor: '#d79a1e',
  agent: '#d0478f',
  queen: '#c0392b',
};

export function LetterCard({
  kind,
  value,
  size = 'md',
  selected,
  onClick,
  className = '',
  disabled,
  title,
  flip,
}: {
  flip?: string;
  kind: Kind;
  value: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  selected?: boolean;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  title?: string;
}) {
  const d = CARD_DEFS[kind];
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag data-flip={flip} className={`lcard pc light ${size} ${selected ? 'selected' : ''} ${className}`} style={{ ['--tone' as string]: TONE[kind] }} onClick={onClick} disabled={onClick ? disabled : undefined} title={title ?? `${value} ${d.name}: ${d.text}`} aria-label={`${value} ${d.name}`}>
      <span className="lcard-val pc-num">{value}</span>
      {size === 'xs' ? (
        <span className="lcard-icon" aria-hidden>
          {d.icon}
        </span>
      ) : (
        <RoleArt kind={kind} tone={TONE[kind]} />
      )}
      <span className="lcard-name">{d.name}</span>
      {(size === 'md' || size === 'lg') && <span className="lcard-text">{d.text}</span>}
    </Tag>
  );
}

export function CardBackMini() {
  return <span className="lcard pc back xs" aria-hidden />;
}

export function Seal({ on }: { on: boolean }) {
  return <i className={`seal ${on ? 'on' : ''}`} aria-hidden />;
}

export function Logo({ size = 48 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden>
      <rect width="64" height="64" rx="14" fill="#3a2430" />
      <rect x="12" y="18" width="40" height="28" rx="3" fill="#f6efe2" />
      <path d="M12 20 L32 34 L52 20" fill="none" stroke="#c8b89a" strokeWidth="2.5" />
      <circle cx="32" cy="36" r="7" fill="#c0392b" />
      <path d="M29 36 l2 2 l4 -4" stroke="#f6d7d0" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </svg>
  );
}
