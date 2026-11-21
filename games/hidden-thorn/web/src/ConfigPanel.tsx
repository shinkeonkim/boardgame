import { GameConfig, LIMITS, PRESETS } from '@bg/hidden-thorn-engine';
import { PresetChips, configFields } from '@bg/ui';
import type { ConfigPanelProps } from '@bg/web';
import { DiscView } from './theme';

export function ConfigPanel({ config: c, isHost, set }: ConfigPanelProps<GameConfig>) {
  const f = configFields({ config: c, set, isHost, limits: LIMITS });
  return (
    <>
      <PresetChips presets={PRESETS} config={c} isHost={isHost} onPick={(p) => set(p)} />
      <div className="ht-preview" aria-hidden>
        {Array.from({ length: c.roses }, (_, i) => (
          <DiscView key={`r${i}`} disc="rose" size={26} />
        ))}
        {Array.from({ length: c.thorns }, (_, i) => (
          <DiscView key={`t${i}`} disc="thorn" size={26} />
        ))}
      </div>
      <h3>원판</h3>
      {f.num('roses', '장미', { fmt: (v) => `${v}개`, hint: '원작 3개' })}
      {f.num('thorns', '가시', { fmt: (v) => `${v}개`, hint: '원작 1개 · 2개면 함정이 많아져요' })}
      <h3>규칙</h3>
      {f.num('winPoints', '우승까지 성공', { fmt: (v) => `${v}번`, hint: '원작 2번 · 원판을 모두 잃은 사람은 탈락' })}
      {f.bool('chooseOwnLoss', '자기 가시면 잃을 원판 고르기', '원작: 내 가시에 찔렸으면 내가 골라요')}
      {f.bool('randomLoss', '남의 가시면 무작위로 잃기', '원작: 가시 주인이 무작위로 하나를 가져가요')}
      <h3>진행</h3>
      {f.num('rounds', '게임 수', { fmt: (v) => `${v}게임` })}
      {f.num('turnTimerSec', '차례 제한시간', { step: 5, fmt: (v) => (v ? `${v}초` : '없음') })}
    </>
  );
}
