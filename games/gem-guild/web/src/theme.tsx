import type { DevCard, Noble } from '@bg/gem-guild-engine';
import { ChipSvg, CountBadge } from '@bg/ui';

export const GEM_INFO = [
  { name: '다이아몬드', short: '흰', fill: '#f4f4f6', ink: '#333', stroke: '#b9bcc6' },
  { name: '사파이어', short: '파', fill: '#3a7bd5', ink: '#fff', stroke: '#24509a' },
  { name: '에메랄드', short: '초', fill: '#2f9e6a', ink: '#fff', stroke: '#1d6a46' },
  { name: '루비', short: '빨', fill: '#d0453a', ink: '#fff', stroke: '#8f2a23' },
  { name: '오닉스', short: '검', fill: '#2b2b33', ink: '#fff', stroke: '#000' },
  { name: '황금', short: '금', fill: '#e3b04a', ink: '#3a2a00', stroke: '#a17a1e' },
];

/** 보석 칩: 카지노 칩 + 가운데 보석. 개수는 칩 위가 아니라 옆의 흰 알약(CountBadge)으로 */
export function GemToken({ gem, n, size = 34, selected, onClick, disabled, label }: { gem: number; n?: number; size?: number; selected?: boolean; onClick?: () => void; disabled?: boolean; label?: string }) {
  const g = GEM_INFO[gem];
  const Tag = onClick ? 'button' : 'span';
  const light = gem === 0 || gem === 5;
  return (
    <Tag className={`gem ${selected ? 'selected' : ''}`} onClick={onClick} disabled={onClick ? disabled : undefined} aria-label={label ?? `${g.name}${n !== undefined ? ` ${n}개` : ''}`} style={{ width: size, height: size }}>
      <ChipSvg fill={g.fill} edge={light ? g.stroke : '#fff'} size={size}>
        {/* 깎은 보석 */}
        <path d="M20 12.5 L26.5 17.5 L20 28 L13.5 17.5 Z" fill={light ? g.stroke : '#fff'} opacity={0.9} />
        <path d="M13.5 17.5 H26.5 M20 12.5 L17 17.5 L20 28 L23 17.5 Z" fill="none" stroke={g.fill} strokeWidth="0.9" opacity={0.85} />
      </ChipSvg>
      <i className="chip-tex" aria-hidden />
      {n !== undefined && <CountBadge n={n} />}
    </Tag>
  );
}

export function CostDots({ cost }: { cost: number[] }) {
  return (
    <span className="cost">
      {cost.map((n, i) =>
        n > 0 ? (
          <span key={i} className="cost-dot" style={{ background: i === 0 || i === 5 ? GEM_INFO[i].fill : GEM_INFO[i].stroke, color: GEM_INFO[i].ink, borderColor: GEM_INFO[i].stroke }}>
            {n}
          </span>
        ) : null,
      )}
    </span>
  );
}

export function DevCardView({ card, onClick, selected, affordable, size = 'md' }: { card: DevCard; onClick?: () => void; selected?: boolean; affordable?: boolean; size?: 'sm' | 'md' }) {
  const g = GEM_INFO[card.bonus];
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag data-flip={`g${card.id}`} className={`devcard pc light t${card.tier} ${size} ${selected ? 'selected' : ''} ${affordable ? 'affordable' : ''}`} style={{ ['--bonus' as string]: g.fill, ['--bonus-ink' as string]: g.ink }} onClick={onClick} aria-label={`${card.tier}단계 ${g.name} 카드, ${card.points}점`}>
      <div className="devcard-top">
        <b className="devcard-pts">{card.points || ''}</b>
        <GemToken gem={card.bonus} size={size === 'sm' ? 16 : 22} />
      </div>
      <CostDots cost={card.cost} />
      {affordable && <span className="devcard-ok">살 수 있어요</span>}
    </Tag>
  );
}

export function NobleView({ noble, onClick, size = 'md' }: { noble: Noble; onClick?: () => void; size?: 'sm' | 'md' }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag className={`noble pc light ${size}`} onClick={onClick} aria-label={`귀족 ${noble.points}점`}>
      <b>{noble.points}</b>
      <span className="noble-icon" aria-hidden>
        🎩
      </span>
      <span className="noble-need">
        {noble.need.map((n, i) =>
          n > 0 ? (
            <span key={i} className="need-bar" style={{ background: GEM_INFO[i].fill, color: GEM_INFO[i].ink, borderColor: GEM_INFO[i].stroke }}>
              {n}
            </span>
          ) : null,
        )}
      </span>
    </Tag>
  );
}

export function Logo({ size = 48 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden>
      <rect width="64" height="64" rx="14" fill="#232035" />
      <path d="M32 12 L48 26 L32 52 L16 26 Z" fill="#3a7bd5" stroke="#9cc0f5" strokeWidth="2" />
      <path d="M16 26 L48 26 M32 12 L26 26 L32 52 L38 26 Z" fill="none" stroke="#cfe0fb" strokeWidth="1.5" opacity=".8" />
      <circle cx="49" cy="47" r="7" fill="#e3b04a" stroke="#a17a1e" strokeWidth="2" />
    </svg>
  );
}
