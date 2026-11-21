import { CSSProperties } from 'react';
import type { Clue, GameConfig } from '@bg/flare-signals-engine';

export const COLORS = [
  { name: '빨강', short: '빨', hex: '#e0483c' },
  { name: '노랑', short: '노', hex: '#e6b422' },
  { name: '초록', short: '초', hex: '#2fa865' },
  { name: '파랑', short: '파', hex: '#3b7be0' },
  { name: '보라', short: '보', hex: '#9b5ad6' },
  { name: '주황', short: '주', hex: '#ef7d2a' },
];
export const RAINBOW = 'conic-gradient(from 30deg, #e0483c, #e6b422, #2fa865, #3b7be0, #9b5ad6, #e0483c)';

export const colorName = (c: GameConfig, color: number) => (color === 5 && c.sixth === 'rainbow' ? '무지개' : COLORS[color]?.name ?? '?');
export const colorStyle = (c: GameConfig, color: number): CSSProperties =>
  color === 5 && c.sixth === 'rainbow' ? { ['--fc' as string]: '#d46ab8', ['--fbg' as string]: RAINBOW } : { ['--fc' as string]: COLORS[color].hex };

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
    <Tag className={`fcard ${size} ${color === 5 && c.sixth === 'rainbow' ? 'rainbow' : ''} ${className}`} style={colorStyle(c, color)} onClick={onClick} title={title} aria-label={`${colorName(c, color)} ${value}`}>
      <span className="fcard-num">{value}</span>
      <Burst value={value} />
      {children}
    </Tag>
  );
}

/** 숫자만큼 퍼지는 불꽃 무늬 */
function Burst({ value }: { value: number }) {
  return (
    <svg className="fcard-burst" viewBox="0 0 40 40" aria-hidden>
      {Array.from({ length: value * 2 + 2 }, (_, i) => {
        const a = (i / (value * 2 + 2)) * Math.PI * 2;
        const r1 = 5;
        const r2 = 9 + value * 2;
        return <line key={i} x1={20 + Math.cos(a) * r1} y1={20 + Math.sin(a) * r1} x2={20 + Math.cos(a) * r2} y2={20 + Math.sin(a) * r2} />;
      })}
      <circle cx="20" cy="20" r="3" />
    </svg>
  );
}

/** 내 카드 (뒷면 + 받은 힌트 표시) */
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
    <button className={`fcard mystery ${size} ${knownColor !== null ? 'tinted' : ''} ${selected ? 'selected' : ''} ${className}`} style={style} onClick={onClick} aria-label={label}>
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
