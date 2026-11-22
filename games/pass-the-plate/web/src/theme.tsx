import { DISH, Dish, Group } from '@bg/pass-the-plate-engine';

export const GROUP_COLOR: Record<Group, string> = {
  maki: '#2f9e6a',
  tempura: '#d79a1e',
  sashimi: '#d0533f',
  dumpling: '#c0703a',
  nigiri: '#3a7bd5',
  wasabi: '#7a8a2a',
  chopsticks: '#8a5cd0',
  pudding: '#d0478f',
};

export function DishCard({ dish, size = 'md', selected, onClick, className = '', badge, dim, flip }: { dish: Dish; size?: 'xs' | 'sm' | 'md'; selected?: boolean; onClick?: () => void; className?: string; badge?: string; dim?: boolean; flip?: string }) {
  const d = DISH[dish];
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag data-flip={flip} className={`dcard ${size} ${selected ? 'selected' : ''} ${dim ? 'dim' : ''} ${className}`} style={{ ['--tone' as string]: GROUP_COLOR[d.group] }} onClick={onClick} title={`${d.name}: ${d.hint}`} aria-label={d.name}>
      <span className="dcard-icon" aria-hidden>
        {d.icon}
        {dish === 'maki2' && d.icon}
        {dish === 'maki3' && d.icon + d.icon}
      </span>
      {size !== 'xs' && <span className="dcard-name">{d.name}</span>}
      {size === 'md' && <span className="dcard-hint">{d.hint}</span>}
      {badge && <span className="dcard-badge">{badge}</span>}
    </Tag>
  );
}

export function Logo({ size = 48 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden>
      <rect width="64" height="64" rx="14" fill="#2b2420" />
      <ellipse cx="32" cy="38" rx="22" ry="9" fill="#f6efe2" />
      <ellipse cx="32" cy="36" rx="16" ry="6" fill="#e8dcc2" />
      <rect x="22" y="26" width="20" height="9" rx="4" fill="#f4a261" />
      <rect x="22" y="31" width="20" height="4" rx="2" fill="#fff" />
      <path d="M48 14 L28 30" stroke="#c0703a" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M52 17 L31 31" stroke="#c0703a" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
