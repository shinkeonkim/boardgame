import { GameConfig, LIMITS, PRESETS } from '@bg/orbit-tasks-engine';
import { PresetChips, configFields } from '@bg/ui';
import type { ConfigPanelProps } from '@bg/web';

export function ConfigPanel({ config: c, isHost, set }: ConfigPanelProps<GameConfig>) {
  const f = configFields({ config: c, set, isHost, limits: LIMITS });
  return (
    <>
      <PresetChips presets={PRESETS} config={c} isHost={isHost} onPick={(p) => set(p)} />
      <h3>임무</h3>
      {f.num('tasks', '첫 임무 과제 수', { fmt: (v) => `${v}개` })}
      {f.bool('climb', '성공하면 과제 +1', '끄면 같은 과제 수로 계속 도전')}
      {f.num('ordered', '순서 표시', { fmt: (v) => (v ? `${v}개` : '없음'), hint: '표시된 과제는 1번부터 차례로 해내야 해요' })}
      {f.bool('signals', '신호', '임무마다 한 번, 손패 한 장을 가장 높음·낮음·하나뿐으로 알려요')}
      <h3>진행</h3>
      {f.num('attempts', '도전 횟수', { fmt: (v) => `${v}번` })}
      {f.num('turnTimerSec', '차례 제한시간', { step: 5, fmt: (v) => (v ? `${v}초` : '없음') })}
    </>
  );
}
