import type { Disc } from '@bg/hidden-thorn-engine';
import { seatColor } from '@bg/ui';

/** 원판 하나: disc가 null이면 뒷면(좌석 색) */
export function DiscView({ disc, seat = 0, size = 40, onClick, selected, label }: { disc: Disc | null; seat?: number; size?: number; onClick?: () => void; selected?: boolean; label?: string }) {
  const Tag = onClick ? 'button' : 'span';
  return (
    <Tag className={`disc ${disc ?? 'back'} ${selected ? 'selected' : ''}`} style={{ width: size, height: size, ['--seat' as string]: seatColor(seat) }} onClick={onClick} aria-label={label ?? (disc === 'rose' ? '장미' : disc === 'thorn' ? '가시' : '뒤집힌 원판')}>
      <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
        <circle cx="20" cy="20" r="18" fill={disc ? 'var(--disc-face)' : 'var(--seat)'} stroke="rgb(0 0 0 / .25)" strokeWidth="2" />
        {disc === 'rose' && (
          <g>
            {[0, 72, 144, 216, 288].map((r) => (
              <ellipse key={r} cx="20" cy="13" rx="5" ry="7" fill="#d84a5c" transform={`rotate(${r} 20 20)`} />
            ))}
            <circle cx="20" cy="20" r="4.5" fill="#f2c14e" />
          </g>
        )}
        {disc === 'thorn' && (
          <g fill="#3f7d3a">
            <path d="M20 5 L23 16 L34 13 L25 21 L33 30 L22 25 L20 36 L17 25 L7 30 L15 21 L6 13 L17 16 Z" />
            <circle cx="20" cy="20" r="3" fill="#1f3d1c" />
          </g>
        )}
        {!disc && <circle cx="20" cy="20" r="12" fill="none" stroke="rgb(255 255 255 / .35)" strokeWidth="2" />}
      </svg>
      <i className="chip-tex" aria-hidden />
    </Tag>
  );
}

export function Logo({ size = 48 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden>
      <rect width="64" height="64" rx="14" fill="#1f2a1e" />
      <circle cx="26" cy="34" r="16" fill="#f6efe2" />
      {[0, 72, 144, 216, 288].map((r) => (
        <ellipse key={r} cx="26" cy="27" rx="4.5" ry="6.5" fill="#d84a5c" transform={`rotate(${r} 26 34)`} />
      ))}
      <circle cx="26" cy="34" r="4" fill="#f2c14e" />
      <path d="M46 10 L48 20 L57 18 L50 24 L56 32 L47 28 L45 38 L43 28 L34 31 L41 24 L35 17 L44 20 Z" fill="#5aa152" />
    </svg>
  );
}
