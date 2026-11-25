import { CSSProperties } from 'react';
import type { Clue, GameConfig } from '@bg/flare-signals-engine';

export const COLORS = [
  { name: '빨강', short: '빨', hex: '#e0483c' },
  { name: '노랑', short: '노', hex: '#e6b422', ink: '#3a2a00' },
  { name: '초록', short: '초', hex: '#2fa865' },
  { name: '파랑', short: '파', hex: '#3b7be0' },
  { name: '보라', short: '보', hex: '#9b5ad6' },
  { name: '주황', short: '주', hex: '#ef7d2a' },
];
export const RAINBOW = 'conic-gradient(from 30deg, #e0483c, #e6b422, #2fa865, #3b7be0, #9b5ad6, #e0483c)';

export const colorName = (c: GameConfig, color: number) => (color === 5 && c.sixth === 'rainbow' ? '무지개' : COLORS[color]?.name ?? '?');
export const colorStyle = (c: GameConfig, color: number): CSSProperties =>
  color === 5 && c.sixth === 'rainbow'
    ? { ['--fc' as string]: '#d46ab8', ['--fbg' as string]: RAINBOW }
    : { ['--fc' as string]: COLORS[color].hex, ...((COLORS[color] as { ink?: string }).ink ? { ['--fink' as string]: (COLORS[color] as { ink?: string }).ink } : {}) };

/** 불꽃 카드 (색·숫자를 아는 카드) */
export function FlareCard({
  c,
  color,
  value,
  size = 'md',
  className = '',
  onClick,
  title,
  children,
}: {
  c: GameConfig;
  color: number;
  value: number;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  onClick?: () => void;
  title?: string;
  children?: React.ReactNode;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag className={`fcard pc ${size} ${color === 5 && c.sixth === 'rainbow' ? 'rainbow' : ''} ${className}`} data-cbl={color === 5 && c.sixth === 'rainbow' ? '무' : COLORS[color]?.short} style={colorStyle(c, color)} onClick={onClick} title={title} aria-label={`${colorName(c, color)} ${value}`}>
      <span className="fcard-num pc-num">{value}</span>
      <Burst value={value} color={color === 5 && c.sixth === 'rainbow' ? '#d46ab8' : COLORS[color].hex} rainbow={color === 5 && c.sixth === 'rainbow'} />
      {children}
    </Tag>
  );
}

/** 숫자만큼 퍼지는 불꽃 무늬 */
/**
 * 카드 그림: 밤하늘 + 도시 지붕선 + 그 색 불꽃. 숫자가 클수록 불꽃이 크고 겹이 많아진다 (1 = 작은 한 송이, 5 = 하늘 가득).
 * 무지개 카드는 여러 색 불꽃.
 */
const SKYLINE = 'M0 84 V70 h5 v-4 h4 v6 h5 v-9 h3 v-3 h3 v12 h6 v-6 h5 v8 h4 v-11 h4 v4 h5 v-6 h4 v9 h5 v-5 h3 V84 Z';
function Burst({ value, color, rainbow }: { value: number; color: string; rainbow: boolean }) {
  const cx = 30;
  const cy = 30;
  const rays = 10 + value * 4;
  const len = 8 + value * 3.4;
  const palette = rainbow ? ['#e0483c', '#e6b422', '#2fa865', '#3b7be0', '#9b5ad6'] : [color];
  // 별: 자리 고정 (카드마다 같은 하늘)
  const stars = [[8, 8], [50, 6], [44, 18], [12, 22], [54, 30], [6, 40], [20, 12], [36, 6]];
  return (
    <svg className="fcard-burst" viewBox="0 0 60 84" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id={`fs-sky-${value}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0e1230" />
          <stop offset="1" stopColor="#262a5a" />
        </linearGradient>
      </defs>
      <rect width="60" height="84" fill={`url(#fs-sky-${value})`} />
      <rect width="60" height="84" style={{ fill: rainbow ? '#9b5ad6' : color }} opacity="0.16" />
      {stars.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 0.7 : 0.45} fill="#fff" opacity="0.7" />
      ))}
      {/* 빛 번짐 */}
      <circle cx={cx} cy={cy} r={len * 1.1} style={{ fill: palette[0] }} opacity="0.18" />
      {/* 불꽃 줄기 (겹: 숫자가 클수록 많음) */}
      {Array.from({ length: Math.min(value, 3) }, (_, ring) =>
        Array.from({ length: rays }, (_, i) => {
          const a = (i / rays) * Math.PI * 2 + ring * 0.13;
          const r1 = 3 + ring * 2;
          const r2 = len * (1 - ring * 0.22);
          const col = palette[(i + ring) % palette.length];
          return (
            <g key={`${ring}-${i}`}>
              <line x1={cx + Math.cos(a) * r1} y1={cy + Math.sin(a) * r1} x2={cx + Math.cos(a) * r2} y2={cy + Math.sin(a) * r2} style={{ stroke: col }} strokeWidth={ring ? 0.7 : 1.1} strokeLinecap="round" opacity={ring ? 0.75 : 0.95} />
              {ring === 0 && <circle cx={cx + Math.cos(a) * (r2 + 1.6)} cy={cy + Math.sin(a) * (r2 + 1.6)} r="0.9" fill="#fff8d8" />}
            </g>
          );
        }),
      )}
      <circle cx={cx} cy={cy} r={2 + value * 0.5} fill="#fff8e0" />
      {/* 올라간 자국 */}
      <path d={`M${cx} 70 Q${cx - 2} 55 ${cx} ${cy + len + 4}`} stroke="#ffe6a8" strokeWidth="0.6" strokeDasharray="1.2 1.6" fill="none" opacity="0.6" />
      <path d={SKYLINE} fill="#0a0c1c" />
      {[[9, 74], [16, 70], [29, 73], [44, 72], [52, 75]].map(([x, y], i) => (
        <rect key={i} x={x} y={y} width="1.4" height="1.6" fill="#f6d27a" opacity="0.8" />
      ))}
    </svg>
  );
}

/** 내 카드 (뒷면 + 받은 힌트 표시) */
/** 아무 힌트도 없는 내 카드는 뒷면 무늬로 */
const knownColorIsNull = (clue: Clue, show: boolean) => !(show && clue.colors.length);

export function MysteryCard({
  c,
  clue,
  show,
  size = 'md',
  className = '',
  onClick,
  selected,
  label,
}: {
  c: GameConfig;
  clue: Clue;
  show: boolean;
  size?: 'sm' | 'md';
  className?: string;
  onClick?: () => void;
  selected?: boolean;
  label?: string;
}) {
  const knownColor = show && clue.colors.length ? (clue.colors.length > 1 && c.sixth === 'rainbow' ? 5 : clue.colors[0]) : null;
  const style = knownColor !== null ? colorStyle(c, knownColor) : undefined;
  return (
    <button className={`fcard pc mystery ${knownColorIsNull(clue, show) ? 'back' : ''} ${size} ${knownColor !== null ? 'tinted' : ''} ${selected ? 'selected' : ''} ${className}`} style={style} onClick={onClick} aria-label={label}>
      <span className="fcard-num">{show && clue.value !== null ? clue.value : '?'}</span>
      {show && clue.touched && <span className={`clue-flag ${clue.focus && !clue.focusOnChop && clue.value !== 5 ? 'play' : 'keep'}`} aria-hidden />}
      {show && (clue.notColors.length > 0 || clue.notValues.length > 0) && (
        <span className="not-list" aria-hidden>
          {clue.notColors.map((k) => (
            <i key={`c${k}`} style={{ background: COLORS[k].hex }} />
          ))}
          {clue.notValues.map((v) => (
            <b key={`v${v}`}>{v}</b>
          ))}
        </span>
      )}
    </button>
  );
}

/** 받은 힌트 작은 표시 (남의 카드 아래) */
export function ClueMarks({ c, clue }: { c: GameConfig; clue: Clue }) {
  if (!clue.touched) return <span className="clue-marks empty" />;
  return (
    <span className="clue-marks">
      {clue.colors.map((k) => (
        <i key={k} style={{ background: COLORS[k].hex }} title={`${colorName(c, k)} 힌트`} />
      ))}
      {clue.value !== null && <b>{clue.value}</b>}
    </span>
  );
}

export function Logo({ size = 48 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden>
      <rect width="64" height="64" rx="14" fill="#141628" />
      {COLORS.slice(0, 5).map((col, i) => {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        return <line key={i} x1={32 + Math.cos(a) * 6} y1={28 + Math.sin(a) * 6} x2={32 + Math.cos(a) * 20} y2={28 + Math.sin(a) * 20} stroke={col.hex} strokeWidth="4" strokeLinecap="round" />;
      })}
      <circle cx="32" cy="28" r="4" fill="#fff4c2" />
      <rect x="30.5" y="44" width="3" height="12" rx="1.5" fill="#fff4c2" opacity=".6" />
    </svg>
  );
}

export const RATING = (s: number, max: number) => {
  const r = s / max;
  if (r >= 1) return '완벽한 밤하늘이에요! 🎆';
  if (r >= 0.84) return '대단해요! 다들 손발이 척척 ✨';
  if (r >= 0.64) return '멋진 불꽃놀이였어요 🎇';
  if (r >= 0.44) return '괜찮았어요. 다음엔 더 크게!';
  if (r >= 0.2) return '조금 아쉬워요';
  return '불꽃이 금방 꺼졌어요… 다시 해 봐요';
};
