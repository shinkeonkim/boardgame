import { GameConfig, LIMITS, PRESETS } from '@bg/one-word-engine';
import { PresetChips, configFields } from '@bg/ui';
import type { ConfigPanelProps } from '@bg/web';

export function ConfigPanel({ config: c, isHost, set }: ConfigPanelProps<GameConfig>) {
  const f = configFields({ config: c, set, isHost, limits: LIMITS });
  return (
    <>
      <PresetChips presets={PRESETS} config={c} isHost={isHost} onPick={(p) => set(p)} />

      <h3>단어</h3>
      {f.num('cards', '카드 수', { fmt: (v) => `${v}장`, hint: '맞혀야 할 단어 수' })}
      {f.choice('pack', '단어 묶음', [
        { value: 'all', label: '모든 단어' },
        { value: 'nature', label: '자연·동물' },
        { value: 'daily', label: '일상·음식' },
        { value: 'fantasy', label: '모험·상상' },
      ])}

      <h3>힌트</h3>
      {f.choice('dupes', '지워지는 힌트', [
        { value: 'similar', label: '비슷한 것도', hint: '바다·바닷가처럼 한쪽이 다른 쪽을 품거나 모양이 비슷하면' },
        { value: 'exact', label: '똑같은 것만', hint: '글자가 완전히 같을 때만' },
      ])}
      {f.bool('wrongCostsNext', '틀리면 다음 카드도 잃기', '모르면 넘기는 게 나을 때가 있어요')}

      <h3>시간</h3>
      {f.num('clueSec', '힌트 쓰는 시간', { step: 10, fmt: (v) => (v ? `${v}초` : '없음') })}
      {f.num('guessSec', '맞히는 시간', { step: 10, fmt: (v) => (v ? `${v}초` : '없음') })}
      {f.num('rounds', '게임 수', { fmt: (v) => `${v}게임` })}
    </>
  );
}
