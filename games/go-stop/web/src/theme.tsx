import type { HCard } from '@bg/go-stop-engine';
import { MONTH_NAMES } from '@bg/go-stop-engine';
import { HwatuArt } from './hwatu-art';

const RIBBON: Record<NonNullable<HCard['ribbon']>, { fill: string; text: string }> = {
  red: { fill: '#c8323c', text: '홍단' },
  blue: { fill: '#2f5fb0', text: '청단' },
  grass: { fill: '#c8323c', text: '초단' },
  plain: { fill: '#c8323c', text: '' },
};

export const KIND_NAME: Record<HCard['kind'], string> = { gwang: '광', animal: '열끗', ribbon: '띠', pi: '피', double: '쌍피' };

/** 화투 한 장 */
export function HwatuCard({ card, w = 48, dim, glow, onClick, title }: { card: HCard; w?: number; dim?: boolean; glow?: boolean; onClick?: () => void; title?: string }) {
  const r = card.ribbon ? RIBBON[card.ribbon] : null;
  const label = `${card.month}월 ${MONTH_NAMES[card.month]} ${KIND_NAME[card.kind]}${card.bird ? '(새)' : ''}${r?.text ? ` ${r.text}` : ''}`;
  const body = (
    <svg viewBox="0 0 80 128" width={w} height={w * 1.6} aria-hidden>
      <rect x="0.5" y="0.5" width="79" height="127" rx="7" fill="#5e1214" />
      <rect x="3" y="3" width="74" height="122" rx="4.5" fill="#fffaf0" />
      <svg x="4" y="4" width="72" height="120" viewBox="4 4 72 120" overflow="hidden">
        <HwatuArt card={card} />
      </svg>
    </svg>
  );
  const cls = `gs-card ${dim ? 'dim' : ''} ${glow ? 'glow' : ''}`;
  return onClick ? (
    <button type="button" className={cls} onClick={onClick} aria-label={title ?? label} title={label}>
      {body}
    </button>
  ) : (
    <span className={cls} role="img" aria-label={label} title={label}>
      {body}
    </span>
  );
}

/** 뒷면: 전통 화투처럼 무늬 없는 진한 빨강 */
export function HwatuBack({ w = 30 }: { w?: number }) {
  return (
    <svg className="gs-back" viewBox="0 0 40 64" width={w} height={w * 1.6} aria-hidden>
      <rect x="0.5" y="0.5" width="39" height="63" rx="3.5" fill="#b3191f" stroke="#5e1214" strokeWidth="1" />
      <rect x="2.5" y="2.5" width="35" height="59" rx="2.4" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />
    </svg>
  );
}

export function Logo({ size = 48 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden>
      <rect width="64" height="64" rx="14" fill="#7a1f1f" />
      <rect x="12" y="14" width="22" height="34" rx="3" fill="#fbf4e4" transform="rotate(-10 23 31)" />
      <rect x="30" y="14" width="22" height="34" rx="3" fill="#fbf4e4" transform="rotate(8 41 31)" />
      <circle cx="42" cy="24" r="6" fill="#d64545" transform="rotate(8 41 31)" />
      <path d="M20 40l4-14 4 14z" fill="#2f7a3a" transform="rotate(-10 23 31)" />
    </svg>
  );
}
