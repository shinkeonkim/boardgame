import { GameConfig, LIMITS, PRESETS } from '@bg/go-stop-engine';
import { PresetChips, configFields } from '@bg/ui';
import type { ConfigPanelProps } from '@bg/web';

export function ConfigPanel({ config: c, isHost, set }: ConfigPanelProps<GameConfig>) {
  const f = configFields({ config: c, set, isHost, limits: LIMITS });
  return (
    <>
      <PresetChips presets={PRESETS} config={c} isHost={isHost} onPick={(p) => set(p)} />
      <h3>점수</h3>
      {f.num('goAt', '고/스톱 점수', { fmt: (v) => (v ? `${v}점` : '인원에 맞춰 (2명 7 · 3명 3)') })}
      {f.bool('bak', '피박·광박', '이긴 사람이 피 10장↑인데 진 사람 피가 5장 이하, 또는 광 3장↑인데 진 사람 광이 없으면 두 배')}
      {f.bool('steal', '피 뺏기', '쪽·따닥·싹쓸이 때 상대마다 피 한 장')}
      <h3>진행</h3>
      {f.num('rounds', '판 수', { fmt: (v) => `${v}판` })}
      {f.num('turnTimerSec', '차례 제한시간', { step: 5, fmt: (v) => (v ? `${v}초` : '없음') })}
    </>
  );
}
