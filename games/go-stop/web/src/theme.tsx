import type { HCard } from '@bg/go-stop-engine';
import { MONTH_NAMES } from '@bg/go-stop-engine';

/** 달마다 직접 그린 식물·풍경 (원작 화투 그림을 옮기지 않음). 40×64 좌표 */
function Motif({ month }: { month: number }) {
  switch (month) {
    case 1: // 소나무
      return (
        <g>
          <path d="M20 14l-12 16h7l-9 12h28l-9-12h7z" fill="#2f6e3a" />
          <rect x="18" y="42" width="4" height="10" fill="#6b4a2a" />
          <circle cx="31" cy="12" r="5" fill="#d64545" />
        </g>
      );
    case 2: // 매화
      return (
        <g>
          <path d="M6 54q10-20 28-34" stroke="#5a3a22" strokeWidth="3" fill="none" />
          {[[14, 40], [22, 30], [30, 22], [11, 48]].map(([x, y], i) => (
            <g key={i}>{[0, 72, 144, 216, 288].map((a) => <circle key={a} cx={x + 3.2 * Math.cos((a * Math.PI) / 180)} cy={y + 3.2 * Math.sin((a * Math.PI) / 180)} r="2.4" fill="#e05a7a" />)}</g>
          ))}
        </g>
      );
    case 3: // 벚꽃
      return (
        <g>
          {[[12, 22], [26, 18], [20, 34], [30, 40], [12, 46]].map(([x, y], i) => (
            <g key={i}>{[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx={x + 3.5 * Math.cos((a * Math.PI) / 180)} cy={y + 3.5 * Math.sin((a * Math.PI) / 180)} rx="2.8" ry="2.2" fill="#f4a6bd" />)}<circle cx={x} cy={y} r="1.4" fill="#c2405f" /></g>
          ))}
        </g>
      );
    case 4: // 등나무(검은 싸리)
      return (
        <g>
          {[10, 20, 30].map((x, i) => (
            <path key={x} d={`M${x} 8v${30 + i * 4}`} stroke="#2b2b3a" strokeWidth="2.6" strokeDasharray="4 2" />
          ))}
        </g>
      );
    case 5: // 붓꽃
      return (
        <g>
          {[10, 18, 26, 32].map((x, i) => <path key={x} d={`M${x} 56q${i % 2 ? 4 : -4}-20 0-36`} stroke="#3f7a3a" strokeWidth="2.4" fill="none" />)}
          <path d="M14 22l4-8 4 8-4 4z M24 18l4-8 4 8-4 4z" fill="#6a4ab8" />
        </g>
      );
    case 6: // 모란
      return (
        <g>
          <circle cx="20" cy="28" r="11" fill="#d23b4a" />
          <circle cx="20" cy="28" r="6" fill="#f07080" />
          <path d="M8 46q12-6 24 0" stroke="#3f7a3a" strokeWidth="3" fill="none" />
        </g>
      );
    case 7: // 홍싸리
      return (
        <g>
          {[10, 18, 26, 32].map((x, i) => (
            <g key={x}>
              <path d={`M${x} 58q-2-20 ${i % 2 ? 4 : -4}-44`} stroke="#6b3a2a" strokeWidth="1.6" fill="none" />
              {[20, 30, 40].map((y) => <circle key={y} cx={x + (i % 2 ? 2 : -2)} cy={y} r="2.2" fill="#c83c3c" />)}
            </g>
          ))}
        </g>
      );
    case 8: // 공산(달과 언덕)
      return (
        <g>
          <circle cx="20" cy="22" r="10" fill="#f6efe0" stroke="#d9c79a" />
          <path d="M0 60V40q20-14 40 0v20z" fill="#3a3f4a" />
        </g>
      );
    case 9: // 국화
      return (
        <g>
          {Array.from({ length: 12 }, (_, i) => <ellipse key={i} cx="20" cy="22" rx="2.6" ry="9" fill="#e6b820" transform={`rotate(${i * 30} 20 30)`} />)}
          <circle cx="20" cy="30" r="4" fill="#b07810" />
        </g>
      );
    case 10: // 단풍
      return (
        <g>
          {[[13, 22, -15], [27, 30, 20], [15, 42, 5]].map(([x, y, r], i) => (
            <path key={i} transform={`translate(${x} ${y}) rotate(${r})`} d="M0-8l2 5 5-2-2 5 5 1-5 3 2 4-5-2-2 5-2-5-5 2 2-4-5-3 5-1-2-5 5 2z" fill="#d6492a" />
          ))}
        </g>
      );
    case 11: // 오동
      return (
        <g>
          <path d="M20 12q14 8 10 24-10 10-20 0-4-16 10-24z" fill="#2a3a2a" />
          <path d="M20 14v30" stroke="#5a6a4a" strokeWidth="1.4" />
          <path d="M12 50h16" stroke="#8a7aa8" strokeWidth="4" strokeLinecap="round" />
        </g>
      );
    default: // 비: 버들과 빗줄기
      return (
        <g>
          {[8, 16, 24, 32].map((x) => <path key={x} d={`M${x} 8q-3 22 2 46`} stroke="#3f6a3a" strokeWidth="1.8" fill="none" />)}
          {[[6, 20], [14, 34], [28, 16], [34, 40], [20, 46]].map(([x, y], i) => <path key={i} d={`M${x} ${y}l-3 7`} stroke="#5a8ad0" strokeWidth="1.4" />)}
        </g>
      );
  }
}

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
    <svg viewBox="0 0 40 64" width={w} height={w * 1.6} aria-hidden>
      <rect x="0.5" y="0.5" width="39" height="63" rx="4" fill="#7a1f1f" />
      <rect x="2.5" y="2.5" width="35" height="59" rx="2.5" fill={card.kind === 'pi' || card.kind === 'double' ? '#fbf4e4' : '#fff8ea'} />
      <Motif month={card.month} />
      {card.kind === 'gwang' && (
        <g>
          <circle cx="31" cy="54" r="6.5" fill="#fff" stroke="#c8323c" strokeWidth="1.4" />
          <text x="31" y="57" textAnchor="middle" fontSize="8" fontWeight="900" fill="#c8323c">
            광
          </text>
        </g>
      )}
      {r && (
        <g>
          <rect x="16" y="20" width="8" height="34" rx="1" fill={r.fill} />
          {r.text && (
            <text x="20" y="30" fontSize="5.4" fontWeight="800" fill="#fff" textAnchor="middle" style={{ writingMode: 'vertical-rl' as never }}>
              {r.text.split('').map((ch, i) => (
                <tspan key={i} x="20" dy={i ? 7 : 0}>
                  {ch}
                </tspan>
              ))}
            </text>
          )}
        </g>
      )}
      {card.kind === 'animal' && (
        <g>
          {card.bird ? (
            <path d="M22 50q6-8 14-4l-5 2 3 4q-8 2-12-2z" fill="#2b2b3a" />
          ) : (
            <g fill="#8a5a2a">
              <ellipse cx="30" cy="52" rx="6" ry="4" />
              <circle cx="35" cy="47" r="3" />
            </g>
          )}
        </g>
      )}
      {card.kind === 'double' && (
        <g>
          <rect x="24" y="48" width="13" height="11" rx="2" fill="#2b2b3a" />
          <text x="30.5" y="56.5" textAnchor="middle" fontSize="7" fontWeight="900" fill="#fff">
            쌍
          </text>
        </g>
      )}
      <text x="5" y="10" fontSize="7" fontWeight="900" fill="#7a1f1f">
        {card.month}
      </text>
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

/** 뒷면 */
export function HwatuBack({ w = 30 }: { w?: number }) {
  return (
    <svg className="gs-back" viewBox="0 0 40 64" width={w} height={w * 1.6} aria-hidden>
      <rect x="0.5" y="0.5" width="39" height="63" rx="4" fill="#8e2424" />
      <rect x="4" y="4" width="32" height="56" rx="2" fill="none" stroke="#b84a4a" strokeWidth="1.2" />
      <circle cx="20" cy="32" r="7" fill="none" stroke="#b84a4a" strokeWidth="1.4" />
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
