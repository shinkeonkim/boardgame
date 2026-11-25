import { GameConfig, LIMITS, PRESETS } from '@bg/hearts-engine';
import { PresetChips, configFields } from '@bg/ui';
import type { ConfigPanelProps } from '@bg/web';

export function ConfigPanel({ config: c, isHost, set }: ConfigPanelProps<GameConfig>) {
  const f = configFields({ config: c, set, isHost, limits: LIMITS });
  return (
    <>
      <PresetChips presets={PRESETS} config={c} isHost={isHost} onPick={(p) => set(p)} />
      <h3>끝내기</h3>
      {f.num('target', '목표 점수', { step: 10, fmt: (v) => `${v}점`, hint: '누가 이 점수에 닿으면 끝 · 가장 낮은 사람이 승리' })}
      <h3>규칙</h3>
      {f.bool('passing', '판마다 3장 건네기', '왼쪽 → 오른쪽 → (맞은편) → 안 건넴 순서로 돌아가요')}
      {f.bool('shootMoon', '문 쏘기', '하트 13장과 스페이드 Q 를 혼자 먹으면 나머지가 모두 26점')}
      {f.bool('jackBonus', '다이아 J -10', '다이아 J 를 먹으면 10점을 빼 줘요')}
      <h3>진행</h3>
      {f.num('turnTimerSec', '차례 제한시간', { step: 5, fmt: (v) => (v ? `${v}초` : '없음') })}
    </>
  );
}
