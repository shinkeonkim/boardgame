import { GameConfig, LIMITS, PRESETS } from '@bg/five-stones-engine';
import { PresetChips, configFields } from '@bg/ui';
import type { ConfigPanelProps } from '@bg/web';

export function ConfigPanel({ config: c, isHost, set }: ConfigPanelProps<GameConfig>) {
  const f = configFields({ config: c, set, isHost, limits: LIMITS });
  return (
    <>
      <PresetChips presets={PRESETS} config={c} isHost={isHost} onPick={(p) => set(p)} />
      <h3>판</h3>
      <div className="cfg-row">
        <div className="grow">
          <div>판 크기</div>
          <div className="muted small">13줄은 빨리, 19줄은 넓게</div>
        </div>
        <div className="seg" role="radiogroup" aria-label="판 크기">
          {([13, 15, 19] as const).map((n) => (
            <button key={n} type="button" role="radio" aria-checked={c.size === n} className={`btn tiny ${c.size === n ? 'primary' : 'ghost'}`} disabled={!isHost} onClick={() => set({ size: n })}>
              {n}줄
            </button>
          ))}
        </div>
      </div>
      {f.bool('exactFive', '딱 다섯만 승리', '여섯 이상 이어진 줄(장목)은 이긴 것으로 치지 않아요')}
      <h3>진행</h3>
      {f.num('rounds', '판 수', { fmt: (v) => `${v}판 (흑백 번갈아)`, hint: '과반을 먼저 이기면 끝' })}
      {f.num('turnTimerSec', '차례 제한시간', { step: 5, fmt: (v) => (v ? `${v}초` : '없음') })}
    </>
  );
}
