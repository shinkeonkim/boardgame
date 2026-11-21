import { ReactNode, useEffect, useRef, useState } from 'react';
import { ThemeChoice, useTheme } from './theme';

/*
 * 공용 컴포넌트. 모두 base.css / overlay.css 의 클래스를 쓴다 — 클래스만 직접 써도 같은 모양이다.
 * 목록과 쓰임새는 packages/ui/README.md, 실제 모습은 포털의 /design 페이지.
 */

const THEME_OPTIONS: { value: ThemeChoice; icon: string; label: string }[] = [
  { value: 'light', icon: '☀️', label: '라이트' },
  { value: 'dark', icon: '🌙', label: '다크' },
  { value: 'system', icon: '💻', label: '시스템' },
];

/** 테마 전환. variant="segmented"(메인 화면, 세 가지 다 보임) | "icon"(게임 상단 바, 눌러서 라이트↔다크) */
export function ThemeToggle({ variant = 'segmented', className = '' }: { variant?: 'segmented' | 'icon'; className?: string }) {
  const [choice, set, shown] = useTheme();
  if (variant === 'icon') {
    const next = shown === 'dark' ? 'light' : 'dark';
    return (
      <button className={`btn ghost tiny theme-icon ${className}`} onClick={() => set(next)} aria-label={`${next === 'dark' ? '다크' : '라이트'} 모드로`} title="테마 바꾸기">
        {shown === 'dark' ? '🌙' : '☀️'}
      </button>
    );
  }
  return (
    <div className={`segmented theme-toggle ${className}`} role="radiogroup" aria-label="화면 테마">
      {THEME_OPTIONS.map((o) => (
        <button key={o.value} role="radio" aria-checked={choice === o.value} className={choice === o.value ? 'on' : ''} onClick={() => set(o.value)} title={o.label}>
          <span aria-hidden>{o.icon}</span>
          <span className="seg-label">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

/** 두 가지 이상 중 하나 고르기 (탭처럼 보이는 버튼 묶음) */
export function SegmentedControl<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: ReactNode }[]; onChange: (v: T) => void; label?: string }) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} role="radio" aria-checked={value === o.value} className={value === o.value ? 'on' : ''} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** 두 번 눌러 확인하는 버튼 (브라우저 confirm 대화상자 대신 인라인 확인, 4초 뒤 원래대로) */
export function ConfirmButton({ label, warning, onConfirm, small }: { label: string; warning: string; onConfirm: () => void; small?: boolean }) {
  const [confirming, setConfirming] = useState(false);
  useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(() => setConfirming(false), 4000);
    return () => clearTimeout(t);
  }, [confirming]);
  return confirming ? (
    <span className="confirm-close">
      <span className="small">{warning}</span>
      <button className={`btn danger ${small ? 'tiny' : ''}`} onClick={onConfirm}>
        {label}
      </button>
      <button className={`btn ghost ${small ? 'tiny' : ''}`} onClick={() => setConfirming(false)}>
        취소
      </button>
    </span>
  ) : (
    <button className={`btn ghost ${small ? 'tiny' : ''}`} onClick={() => setConfirming(true)}>
      {label}
    </button>
  );
}

/** 숫자 설정 한 줄: 라벨 + − 값 + */
export function Stepper({
  label,
  hint,
  value,
  min,
  max,
  step = 1,
  disabled,
  format,
  onChange,
}: {
  label: ReactNode;
  hint?: ReactNode;
  value: number;
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
  format?: (v: number) => ReactNode;
  onChange: (v: number) => void;
}) {
  const name = typeof label === 'string' ? label : '값';
  return (
    <div className="cfg-row">
      <div className="grow">
        <div>{label}</div>
        {hint && <div className="muted small">{hint}</div>}
      </div>
      <div className="stepper">
        <button disabled={disabled || value <= min} onClick={() => onChange(Math.max(min, value - step))} aria-label={`${name} 줄이기`}>
          −
        </button>
        <span>{format ? format(value) : value}</span>
        <button disabled={disabled || value >= max} onClick={() => onChange(Math.min(max, value + step))} aria-label={`${name} 늘리기`}>
          +
        </button>
      </div>
    </div>
  );
}

/** 켜고 끄는 설정 한 줄 */
export function Toggle({ label, hint, checked, disabled, onChange }: { label: ReactNode; hint?: ReactNode; checked: boolean; disabled?: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className={`cfg-row toggle ${disabled ? 'disabled' : ''}`}>
      <div className="grow">
        <div>{label}</div>
        {hint && <div className="muted small">{hint}</div>}
      </div>
      <input type="checkbox" role="switch" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

/** 안내 상자 (로비 공지 등) */
export function Notice({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`notice ${className}`}>{children}</div>;
}

/** 눈에 띄는 경고 띠 (남은 돌·남은 덱 등). critical이면 빨간색·깜빡임 */
export function AlertBanner({ icon = '⏳', title, children, sub, critical, compactKey }: { icon?: ReactNode; title: ReactNode; children?: ReactNode; sub?: ReactNode; critical?: boolean; compactKey?: string | number }) {
  return (
    <div className={`side-alert ${critical ? 'critical' : ''}`} role="status" key={compactKey}>
      <span className="sa-icon" aria-hidden>
        {icon}
      </span>
      <span>
        <b>{title}</b>
        {children}
        {sub && <span className="sa-sub">{sub}</span>}
      </span>
    </div>
  );
}

/** 모달: 바깥 누르기·Esc로 닫힘, 열려 있는 동안 뒤 페이지 스크롤 잠금 */
export function Modal({ onClose, label, className = '', children }: { onClose: () => void; label: string; className?: string; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    box.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  return (
    <div className="g-overlay" role="dialog" aria-modal="true" aria-label={label} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`g-sheet ${className}`} ref={box} tabIndex={-1}>
        {children}
      </div>
    </div>
  );
}

/** 1초마다 다시 그리며 마감까지 남은 초 (렌더 시점 기준으로 계산 — 새 턴 직후 1초 더 크게 보이지 않게) */
export function useCountdown(deadline: number | null) {
  const [, tick] = useState(0);
  useEffect(() => {
    if (!deadline) return;
    const t = setInterval(() => tick((n) => n + 1), 250);
    return () => clearInterval(t);
  }, [deadline]);
  return deadline ? Math.max(0, Math.ceil((deadline - Date.now()) / 1000)) : null;
}
