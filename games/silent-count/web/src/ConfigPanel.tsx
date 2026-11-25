import { GameConfig, LIMITS, PRESETS } from '@bg/silent-count-engine';
import { PresetChips, configFields } from '@bg/ui';
import type { ConfigPanelProps } from '@bg/web';

export function ConfigPanel({ config: c, isHost, set }: ConfigPanelProps<GameConfig>) {
  const f = configFields({ config: c, set, isHost, limits: LIMITS });
  return (
    <>
      <PresetChips presets={PRESETS} config={c} isHost={isHost} onPick={(p) => set(p)} />
      <h3>단계</h3>
      {f.num('levels', '몇 단계까지', { fmt: (v) => (v ? `${v}단계` : '인원에 맞춰'), hint: '2명 12 · 3명 10 · 4명 이상 8단계' })}
      {f.bool('rewards', '단계 보상', '2·5·8단계를 깨면 수리검, 3·6·9단계를 깨면 생명')}
      <h3>도움</h3>
      {f.num('lives', '생명', { fmt: (v) => (v ? `${v}개` : '인원 수만큼') })}
      {f.num('stars', '수리검', { fmt: (v) => `${v}개`, hint: '모두 동의하면 각자 가장 낮은 카드를 버려요' })}
    </>
  );
}
