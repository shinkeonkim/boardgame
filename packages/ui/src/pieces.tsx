/**
 * 놀이 도구 키트 — 카드·칩·개수 표시를 모든 게임이 같은 품질로 그리게 한다.
 * (Expedition Lines·Crown March 카드에서 가져온 표현: 크림색 테두리 + 바깥 어두운 선 + 겹친 그림자,
 *  안쪽 테두리·모서리 어둡게·사선 광택, 모서리 숫자, 큰 세리프 숫자)
 *
 *  - 카드: 카드 요소에 class "pc"를 붙인다. (pieces.css)
 *      .pc-idx.tl / .pc-idx.br  모서리 표시 · .pc-num 가운데 큰 숫자 · .pc-art 그림 층
 *      밝은 바탕 카드는 "pc light" (테두리·광택을 어둡게)
 *  - 칩: <ChipSvg fill="#3b82c4">{가운데 그림}</ChipSvg> — 테두리 홈·안쪽 점선 고리·광택이 있는 카지노 칩
 *  - 개수: 칩 위에 숫자를 얹지 말고 <CountBadge n={3} /> (흰 바탕 진한 글자, 칩 오른쪽 아래)
 *    → 그림 위에 숫자를 겹치면 색에 따라 안 읽힌다 (실제 피드백: 보석 칩 숫자)
 */
import { CSSProperties, ReactNode } from 'react';

/** 개수 표시: 칩·더미 옆에 붙는 고대비 알약. 0이면 흐리게 */
export function CountBadge({ n, className = '', title }: { n: number | string; className?: string; title?: string }) {
  return (
    <b className={`count-badge ${n === 0 ? 'zero' : ''} ${className}`} title={title} key={String(n)}>
      {n}
    </b>
  );
}

/**
 * 카지노 칩 모양 SVG. children은 가운데(지름 약 18) 그림, viewBox 0 0 40 40 기준.
 * edge: 테두리 홈 색 (기본 흰색), ring: 안쪽 고리 색
 */
export function ChipSvg({ fill, edge = '#fff', ring, size = 40, children, className = '', style }: { fill: string; edge?: string; ring?: string; size?: number; children?: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <svg className={`chip-svg ${className}`} width={size} height={size} viewBox="0 0 40 40" style={style} aria-hidden>
      {/* 옆면(두께) */}
      <circle cx="20" cy="21.2" r="18.6" style={{ fill: `color-mix(in srgb, ${fill} 55%, black)` }} />
      <circle cx="20" cy="20" r="18.6" style={{ fill }} />
      {/* 테두리 홈 8개 */}
      <g fill={edge} opacity="0.92">
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="17.6" y="1.6" width="4.8" height="5.2" rx="1" transform={`rotate(${i * 45} 20 20)`} />
        ))}
      </g>
      {/* 안쪽 판 + 점선 고리 */}
      <circle cx="20" cy="20" r="12.6" style={{ fill: `color-mix(in srgb, ${fill} 88%, white)` }} />
      <circle cx="20" cy="20" r="12.6" fill="none" stroke={ring ?? edge} strokeWidth="1.1" strokeDasharray="2.2 1.6" opacity="0.75" />
      <circle cx="20" cy="20" r="18.6" fill="none" style={{ stroke: `color-mix(in srgb, ${fill} 60%, black)` }} strokeWidth="0.8" />
      {children}
      {/* 광택 */}
      <ellipse cx="15" cy="11" rx="9" ry="4.6" fill="#fff" opacity="0.22" transform="rotate(-25 15 11)" />
    </svg>
  );
}
