import type { DevCard, Noble } from '@bg/gem-guild-engine';
import { ChipSvg, CountBadge, Icon } from '@bg/ui';

export const GEM_INFO = [
  { name: '다이아몬드', short: '흰', fill: '#f4f4f6', ink: '#333', stroke: '#b9bcc6' },
  { name: '사파이어', short: '파', fill: '#3a7bd5', ink: '#fff', stroke: '#24509a' },
  { name: '에메랄드', short: '초', fill: '#2f9e6a', ink: '#fff', stroke: '#1d6a46' },
  { name: '루비', short: '빨', fill: '#d0453a', ink: '#fff', stroke: '#8f2a23' },
  { name: '오닉스', short: '검', fill: '#2b2b33', ink: '#fff', stroke: '#000' },
  { name: '황금', short: '금', fill: '#e3b04a', ink: '#3a2a00', stroke: '#a17a1e' },
];

/** 보석 칩: 카지노 칩 + 가운데 보석. 개수는 칩 위가 아니라 옆의 흰 알약(CountBadge)으로 */
/**
 * 보석 칩. stack 을 주면 그 수만큼(최대 5개) 칩을 실제로 쌓아 보여 줌: 많이 남은 색은 더미가 높고,
 * 하나도 없으면 빈 자리(점선 원)만. 정확한 수는 옆의 흰 알약(CountBadge).
 */
export function GemToken({ gem, n, size = 34, selected, onClick, disabled, label, stack }: { gem: number; n?: number; size?: number; selected?: boolean; onClick?: () => void; disabled?: boolean; label?: string; stack?: number }) {
  const g = GEM_INFO[gem];
  const Tag = onClick ? 'button' : 'span';
  const light = gem === 0 || gem === 5;
  const chip = (
    <ChipSvg fill={g.fill} edge={light ? g.stroke : '#fff'} size={size}>
      {/* 깎은 보석 */}
      <path d="M20 12.5 L26.5 17.5 L20 28 L13.5 17.5 Z" fill={light ? g.stroke : '#fff'} opacity={0.9} />
      <path d="M13.5 17.5 H26.5 M20 12.5 L17 17.5 L20 28 L23 17.5 Z" fill="none" stroke={g.fill} strokeWidth="0.9" opacity={0.85} />
    </ChipSvg>
  );
  const aria = label ?? `${g.name}${n !== undefined ? ` ${n}개` : ''}`;
  if (stack === undefined)
    return (
      <Tag className={`gem ${selected ? 'selected' : ''}`} onClick={onClick} disabled={onClick ? disabled : undefined} aria-label={aria} style={{ width: size, height: size }}>
        {chip}
        <i className="chip-tex" aria-hidden />
        {n !== undefined && <CountBadge n={n} />}
      </Tag>
    );
  const layers = Math.max(0, Math.min(5, stack));
  const step = Math.max(2, Math.round(size * 0.12));
  const h = size + step * Math.max(0, layers - 1);
  return (
    <Tag className={`gem stacked ${layers ? '' : 'empty'} ${selected ? 'selected' : ''}`} onClick={onClick} disabled={onClick ? disabled : undefined} aria-label={aria} style={{ width: size, height: h }}>
      {layers === 0 ? (
        <span className="gem-layer gem-ghost" style={{ bottom: 0, width: size, height: size, borderColor: g.stroke }} aria-hidden />
      ) : (
        Array.from({ length: layers }, (_, i) => (
          <span key={i} className={`gem-layer ${i === layers - 1 ? 'top' : ''}`} style={{ bottom: i * step }} aria-hidden>
            {chip}
            {i === layers - 1 && <i className="chip-tex" />}
          </span>
        ))
      )}
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

/**
 * 개발 카드 윗단 그림: 보너스 보석의 고장 + 단계별 건물.
 * 다이아몬드 = 설산, 사파이어 = 바닷가 절벽, 에메랄드 = 숲, 루비 = 화산, 오닉스 = 동굴 · 1단계 천막 → 2단계 공방 → 3단계 성.
 */
function GemScene({ gem, tier }: { gem: number; tier: number }) {
  const land = [
    <g key="0">
      <rect width="60" height="34" fill="#cfe0f2" />
      <path d="M-2 34 L16 10 L26 22 L36 6 L62 34 Z" fill="#f7fbff" />
      <path d="M16 10 L20 16 L14 18 Z M36 6 L41 13 L33 14 Z" fill="#b9c8dc" />
    </g>,
    <g key="1">
      <rect width="60" height="34" fill="#9fd0f2" />
      <path d="M0 24 q8 -2 15 0 t15 0 t15 0 t15 0 V34 H0 Z" fill="#2f78c8" />
      <path d="M38 34 V14 q8 -2 22 2 V34 Z" fill="#8a7a62" />
    </g>,
    <g key="2">
      <rect width="60" height="34" fill="#cfe8c8" />
      {[6, 16, 26, 50, 58].map((x, i) => (
        <path key={i} d={`M${x} 30 l-6 0 6 -14 6 14 z`} fill={i % 2 ? '#2f7a4a' : '#3e9a63'} />
      ))}
      <rect width="60" height="4" y="30" fill="#2f6a3a" />
    </g>,
    <g key="3">
      <rect width="60" height="34" fill="#f3c9a8" />
      <path d="M4 34 L22 12 h8 L48 34 Z" fill="#5a2a22" />
      <path d="M22 12 q4 6 8 0" fill="#ff8a3d" />
      <circle cx="26" cy="6" r="2.4" fill="#9a8a8a" opacity="0.6" />
      <circle cx="30" cy="3" r="1.8" fill="#9a8a8a" opacity="0.5" />
    </g>,
    <g key="4">
      <rect width="60" height="34" fill="#4a4a58" />
      <path d="M0 34 V8 Q30 -4 60 8 V34 Z" fill="#2b2b33" />
      <path d="M12 34 Q14 14 30 12 Q46 14 48 34 Z" fill="#15151b" />
      <path d="M20 34 l3 -8 3 8 z M34 34 l2.5 -6 2.5 6 z" fill="#6a6a7a" />
    </g>,
    <g key="5">
      <rect width="60" height="34" fill="#f6e3a8" />
    </g>,
  ][gem];
  const building =
    tier === 1 ? (
      <g>
        <path d="M6 32 l7 -9 7 9 z" fill="#d8b48a" stroke="#7a5a3a" strokeWidth="0.6" />
        <path d="M13 32 v-6" stroke="#7a5a3a" strokeWidth="0.8" />
      </g>
    ) : tier === 2 ? (
      <g>
        <rect x="5" y="22" width="14" height="10" fill="#c9a27a" stroke="#6a4a2a" strokeWidth="0.6" />
        <path d="M4 22 l8 -6 8 6 z" fill="#8a3a2a" />
        <rect x="10" y="26" width="4" height="6" fill="#4a2a1a" />
        <path d="M17 17 v-5 h2 v6" fill="#6a6a6a" />
      </g>
    ) : (
      <g>
        <rect x="4" y="18" width="20" height="14" fill="#e8dcc8" stroke="#6a5a4a" strokeWidth="0.6" />
        <rect x="3" y="12" width="6" height="20" fill="#f0e6d4" stroke="#6a5a4a" strokeWidth="0.6" />
        <rect x="19" y="12" width="6" height="20" fill="#f0e6d4" stroke="#6a5a4a" strokeWidth="0.6" />
        <path d="M2.5 12 l3.5 -5 3.5 5 z M18.5 12 l3.5 -5 3.5 5 z" fill="#3a5aa0" />
        <path d="M11 32 v-6 a3 3 0 0 1 6 0 v6 z" fill="#4a3a2a" />
        <path d="M6 7 v-4 l3 1 -3 1" stroke="#6a5a4a" strokeWidth="0.5" fill="#d0533f" />
      </g>
    );
  return (
    <svg className="devcard-art" viewBox="0 0 60 34" preserveAspectRatio="xMidYMid slice" aria-hidden>
      {land}
      {building}
    </svg>
  );
}

export function DevCardView({ card, onClick, selected, affordable, size = 'md', secret, flip = true }: { card: DevCard; onClick?: () => void; selected?: boolean; affordable?: boolean; size?: 'xs' | 'sm' | 'md'; /** 몰래 예약 (나만 앞면을 봄) */ secret?: boolean; /** 움직임(FLIP) 추적 — 같은 카드가 두 곳에 보이면 한 곳만 */ flip?: boolean }) {
  const g = GEM_INFO[card.bonus];
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag data-flip={flip ? `g${card.id}` : undefined} className={`devcard pc light t${card.tier} ${size} ${selected ? 'selected' : ''} ${affordable ? 'affordable' : ''}`} style={{ ['--bonus' as string]: g.fill, ['--bonus-ink' as string]: g.ink }} onClick={onClick} aria-label={`${card.tier}단계 ${g.name} 카드, ${card.points}점`}>
      <GemScene gem={card.bonus} tier={card.tier} />
      <div className="devcard-top">
        <b className="devcard-pts">{card.points || ''}</b>
        <GemToken gem={card.bonus} size={size === 'md' ? 22 : size === 'sm' ? 16 : 12} />
      </div>
      <CostDots cost={card.cost} />
      {affordable && size !== 'xs' && <span className="devcard-ok">살 수 있어요</span>}
      {secret && (
        <span className="devcard-secret" title="몰래 예약 — 다른 사람에게는 뒷면만 보여요">
          <Icon name="lock" />
        </span>
      )}
    </Tag>
  );
}

/**
 * 산 카드를 실제 탁자처럼 색별로 쌓아 보여 줌 (위 카드의 점수·보석 띠만 보이게 겹침).
 * 비어 있는 색은 점선 자리만. 카드 수가 곧 그 색의 영구 할인.
 */
export function Tableau({ cards, size = 'xs', label }: { cards: DevCard[]; size?: 'xs' | 'sm'; label?: string }) {
  return (
    <div className={`gg-tableau ${size}`} role="group" aria-label={label ?? '산 카드'}>
      {[0, 1, 2, 3, 4].map((gem) => {
        const col = cards.filter((c) => c.bonus === gem).sort((a, b) => a.tier - b.tier || a.points - b.points);
        const pts = col.reduce((a, c) => a + c.points, 0);
        return (
          <div key={gem} className={`gg-tab-col ${col.length ? '' : 'empty'}`} style={{ ['--bonus' as string]: GEM_INFO[gem].fill, ['--n' as string]: col.length }} aria-label={`${GEM_INFO[gem].name} 카드 ${col.length}장${pts ? `, ${pts}점` : ''}`}>
            {col.length ? col.map((c) => <DevCardView key={c.id} card={c} size={size} flip={false} />) : <span className="gg-tab-slot" aria-hidden><GemToken gem={gem} size={size === 'sm' ? 18 : 14} /></span>}
            <span className="gg-tab-count" aria-hidden>
              {col.length}
              {pts ? <small> · {pts}점</small> : null}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** 몰래 예약한 카드의 뒷면 (단계만 보임) */
export function ReservedBack({ tier, size = 'xs' }: { tier: 1 | 2 | 3; size?: 'xs' | 'sm' }) {
  return (
    <div className={`devcard-back pc back t${tier} ${size}`} aria-label={`몰래 예약한 ${tier}단계 카드 (뒷면)`} title="더미에서 몰래 예약 — 무슨 카드인지 몰라요">
      <b>{tier}</b>
      <Icon name="lock" />
    </div>
  );
}

export function NobleView({ noble, onClick, size = 'md' }: { noble: Noble; onClick?: () => void; size?: 'sm' | 'md' }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag className={`noble pc light ${size}`} onClick={onClick} aria-label={`귀족 ${noble.points}점`}>
      <b>{noble.points}</b>
      <span className="noble-icon" aria-hidden>
        <Icon name="hat" />
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
