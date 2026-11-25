import type { Domino, Half, Terrain } from '@bg/domain-tiles-engine';

export const TERRAIN: Record<Terrain, { name: string; short: string; fill: string; ink: string }> = {
  wheat: { name: '밀밭', short: '밀', fill: '#e5c24a', ink: '#8a6a10' },
  forest: { name: '숲', short: '숲', fill: '#2f7a3a', ink: '#1b4a22' },
  water: { name: '호수', short: '물', fill: '#3b7be0', ink: '#1d4a8f' },
  grass: { name: '풀밭', short: '풀', fill: '#8ccf5a', ink: '#4a7a22' },
  swamp: { name: '늪', short: '늪', fill: '#8a7a4a', ink: '#4a3f22' },
  mine: { name: '광산', short: '광', fill: '#6b6f78', ink: '#2e3138' },
};

/** 땅마다 다른 무늬 (색을 구분하기 어려워도 알아보게) */
function Pattern({ t }: { t: Terrain }) {
  const ink = TERRAIN[t].ink;
  switch (t) {
    case 'wheat':
      return <path d="M8 30l4-14M18 32l4-16M28 30l4-14" stroke={ink} strokeWidth="2" strokeLinecap="round" opacity=".55" />;
    case 'forest':
      return <path d="M10 30l6-12 6 12zM22 26l5-10 5 10z" fill={ink} opacity=".7" />;
    case 'water':
      return <path d="M6 16q4-4 8 0t8 0 8 0 8 0M6 26q4-4 8 0t8 0 8 0 8 0" fill="none" stroke="#fff" strokeWidth="1.8" opacity=".55" />;
    case 'grass':
      return <path d="M9 28l2-6 2 6M19 22l2-6 2 6M27 31l2-6 2 6" fill="none" stroke={ink} strokeWidth="1.6" opacity=".6" />;
    case 'swamp':
      return <path d="M8 24q6-4 12 0t12 0M12 31q6-3 12 0" fill="none" stroke={ink} strokeWidth="1.8" opacity=".6" />;
    default:
      return <path d="M8 30l8-12 6 8 4-5 6 9z" fill={ink} opacity=".7" />;
  }
}

/** 땅 한 칸 (왕관 수만큼 작은 왕관) */
export function TerrainCell({ half, size = 40, ghost }: { half: Half; size?: number; ghost?: boolean }) {
  const tr = TERRAIN[half.t];
  return (
    <svg className={`dt-cell-svg ${ghost ? 'ghost' : ''}`} width={size} height={size} viewBox="0 0 40 40" aria-label={`${tr.name}${half.crowns ? ` 왕관 ${half.crowns}` : ''}`} data-cbl={tr.short}>
      <rect x="0.5" y="0.5" width="39" height="39" rx="4" fill={tr.fill} />
      <Pattern t={half.t} />
      {Array.from({ length: half.crowns }, (_, i) => (
        <path key={i} transform={`translate(${4 + i * 11} 3)`} d="M0 8l2-6 3 3 2-4 2 4 3-3 2 6z" fill="#ffd54a" stroke="#6b4a00" strokeWidth="0.8" />
      ))}
    </svg>
  );
}

export function Castle({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-label="성">
      <rect x="0.5" y="0.5" width="39" height="39" rx="4" fill="#f4ece0" stroke="#c9bfa8" />
      <path d="M8 32V16h4v4h4v-6h8v6h4v-4h4v16z" fill="#8a6a3a" />
      <path d="M17 32v-6h6v6" fill="#4a3a22" />
    </svg>
  );
}

/** 도미노 한 장: 두 칸 + 번호 */
export function DominoView({ d, size = 36, vertical }: { d: Domino; size?: number; vertical?: boolean }) {
  return (
    <span className={`dt-domino ${vertical ? 'v' : ''}`} aria-label={`${d.id}번 도미노: ${TERRAIN[d.a.t].name} ${d.a.crowns ? `왕관${d.a.crowns}` : ''} · ${TERRAIN[d.b.t].name} ${d.b.crowns ? `왕관${d.b.crowns}` : ''}`}>
      <TerrainCell half={d.a} size={size} />
      <TerrainCell half={d.b} size={size} />
      <b className="dt-id">{d.id}</b>
    </span>
  );
}

export function Logo({ size = 48 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden>
      <rect width="64" height="64" rx="14" fill="#2b3a22" />
      {[
        [10, 10, '#e5c24a'],
        [25, 10, '#e5c24a'],
        [40, 10, '#2f7a3a'],
        [10, 25, '#3b7be0'],
        [25, 25, '#f4ece0'],
        [40, 25, '#2f7a3a'],
        [10, 40, '#3b7be0'],
        [25, 40, '#8ccf5a'],
        [40, 40, '#6b6f78'],
      ].map(([x, y, f], i) => (
        <rect key={i} x={x as number} y={y as number} width="14" height="14" rx="2" fill={f as string} />
      ))}
    </svg>
  );
}
