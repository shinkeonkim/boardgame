import { GameConfig, LIMITS, PRESETS, catsFor } from '@bg/yacht-engine';
import { PresetChips, configFields } from '@bg/ui';
import type { ConfigPanelProps } from '@bg/web';
import { CAT_INFO } from './theme';

export function ConfigPanel({ config: c, isHost, set }: ConfigPanelProps<GameConfig>) {
  const f = configFields({ config: c, set, isHost, limits: LIMITS });
  return (
    <>
      <PresetChips presets={PRESETS} config={c} isHost={isHost} onPick={(p) => set(p)} />
      <p className="small muted">
        칸: {catsFor(c).map((x) => CAT_INFO[x].name).join(' · ')}
      </p>

      <h3>족보</h3>
      {f.choice('scoring', '족보', [
        { value: 'yacht', label: '기본 요트', hint: '12칸 · 포카드·풀하우스는 주사위 합 · 스트레이트 15/30' },
        { value: 'extended', label: '확장', hint: '트리플 추가 · 풀하우스 25 · 스트레이트 30/40 · 요트를 또 내면 +100' },
      ])}
      {f.num('bonusAt', '보너스 기준', { step: 1, fmt: (v) => `위쪽 ${v}점`, hint: '1~6 칸 합이 이 점수 이상이면 보너스 (각 눈 3개씩이면 63)' })}
      {f.num('bonus', '보너스 점수', { step: 5, fmt: (v) => `+${v}` })}

      <h3>굴리기</h3>
      {f.num('rolls', '한 차례에 굴리기', { fmt: (v) => `${v}번`, hint: '많을수록 원하는 족보를 만들기 쉬워요' })}

      <h3>진행</h3>
      {f.choice('mode', '진행', [
        { value: 'turns', label: '한 명씩', hint: '다른 사람 굴리는 걸 함께 보며' },
        { value: 'together', label: '모두 동시에', hint: '각자 자기 점수표를 한꺼번에 — 많이 모였을 때 빨라요' },
      ])}
      {f.num('rounds', '게임 수', { fmt: (v) => `${v}게임`, hint: '게임마다 점수표를 새로, 점수는 합산' })}
      {f.num('turnTimerSec', '차례 제한시간', { step: 5, fmt: (v) => (v ? `${v}초` : '없음'), hint: '시간이 지나면 지금 가장 점수가 높은 칸에 적어요' })}
    </>
  );
}
