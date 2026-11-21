import { ReactNode } from 'react';
import { SegmentedControl, Stepper, Toggle } from './components';

/**
 * 로비 규칙 설정 패널을 짧게 쓰기 위한 도우미.
 *   const f = configFields({ config, set, isHost, limits: LIMITS });
 *   f.num('boardSize', '보드 크기', { fmt: (v) => `${v}×${v}` });  f.bool('teams', '2:2 팀전');
 */
type NumKey<C> = { [K in keyof C]: C[K] extends number ? K : never }[keyof C];
type BoolKey<C> = { [K in keyof C]: C[K] extends boolean ? K : never }[keyof C];

export function configFields<C extends object>({
  config,
  set,
  isHost,
  limits,
}: {
  config: C;
  set: (patch: Partial<C>) => void;
  isHost: boolean;
  limits: Partial<Record<keyof C, readonly [number, number]>>;
}) {
  return {
    num(key: NumKey<C>, label: ReactNode, opts: { step?: number; fmt?: (v: number) => ReactNode; hint?: ReactNode } = {}) {
      const [lo, hi] = limits[key] ?? [0, 99];
      return (
        <Stepper
          key={String(key)}
          label={label}
          hint={opts.hint}
          value={config[key] as number}
          min={lo}
          max={hi}
          step={opts.step}
          format={opts.fmt}
          disabled={!isHost}
          onChange={(v) => set({ [key]: v } as Partial<C>)}
        />
      );
    },
    /** 여러 값 중 하나 (예: 벌점 방식) — 짧은 이름이면 가로 버튼, 설명은 아래 */
    choice<K extends keyof C>(key: K, label: ReactNode, options: { value: C[K] & string; label: ReactNode; hint?: ReactNode }[], hint?: ReactNode) {
      const cur = options.find((o) => o.value === config[key]);
      return (
        <div key={String(key)} className={`cfg-row choice ${!isHost ? 'disabled' : ''}`}>
          <div className="grow">
            <div>{label}</div>
            {(cur?.hint ?? hint) && <div className="muted small">{cur?.hint ?? hint}</div>}
          </div>
          {isHost ? (
            <SegmentedControl value={config[key] as C[K] & string} options={options} onChange={(v) => set({ [key]: v } as Partial<C>)} label={typeof label === 'string' ? label : undefined} />
          ) : (
            <b className="small">{cur?.label}</b>
          )}
        </div>
      );
    },
    bool(key: BoolKey<C>, label: ReactNode, hint?: ReactNode, disabled = false) {
      return <Toggle key={String(key)} label={label} hint={hint} checked={config[key] as boolean} disabled={!isHost || disabled} onChange={(v) => set({ [key]: v } as Partial<C>)} />;
    },
  };
}

/** 프리셋 칩 묶음: 지금 설정과 똑같은 프리셋은 켜진 상태로 */
export function PresetChips<C>({ presets, config, isHost, onPick }: { presets: { id: string; label: string; description: string; config: C }[]; config: C; isHost: boolean; onPick: (c: C) => void }) {
  const active = presets.find((p) => JSON.stringify(p.config) === JSON.stringify(config))?.id;
  return (
    <div className="presets">
      {presets.map((p) => (
        <button key={p.id} className={`chip ${active === p.id ? 'on' : ''}`} disabled={!isHost} onClick={() => onPick(p.config)} title={p.description}>
          {p.label}
        </button>
      ))}
    </div>
  );
}
