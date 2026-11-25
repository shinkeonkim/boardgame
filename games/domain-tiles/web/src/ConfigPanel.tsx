import { GameConfig, LIMITS, PRESETS } from '@bg/domain-tiles-engine';
import { PresetChips, configFields } from '@bg/ui';
import type { ConfigPanelProps } from '@bg/web';

export function ConfigPanel({ config: c, isHost, set }: ConfigPanelProps<GameConfig>) {
  const f = configFields({ config: c, set, isHost, limits: LIMITS });
  return (
    <>
      <PresetChips presets={PRESETS} config={c} isHost={isHost} onPick={(p) => set(p)} />
      <h3>왕국</h3>
      <div className="cfg-row">
        <div className="grow">
          <div>왕국 크기</div>
          <div className="muted small">7×7 은 2명이 도미노를 모두 쓰는 큰 왕국</div>
        </div>
        <div className="seg" role="radiogroup" aria-label="왕국 크기">
          {([5, 7] as const).map((n) => (
            <button key={n} type="button" role="radio" aria-checked={c.size === n} className={`btn tiny ${c.size === n ? 'primary' : 'ghost'}`} disabled={!isHost} onClick={() => set({ size: n })}>
              {n}×{n}
            </button>
          ))}
        </div>
      </div>
      {f.bool('middle', '성이 가운데면 +10')}
      {f.bool('harmony', '꽉 채우면 +5', '버린 도미노 없이 왕국을 다 채웠을 때')}
      <h3>진행</h3>
      {f.num('rounds', '판 수', { fmt: (v) => `${v}판` })}
      {f.num('turnTimerSec', '차례 제한시간', { step: 5, fmt: (v) => (v ? `${v}초` : '없음') })}
    </>
  );
}
