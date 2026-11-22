import { GameConfig, LIMITS, PRESETS } from '@bg/one-card-engine';
import { PresetChips, configFields } from '@bg/ui';
import type { ConfigPanelProps } from '@bg/web';

export function ConfigPanel({ config: c, isHost, set }: ConfigPanelProps<GameConfig>) {
  const f = configFields({ config: c, set, isHost, limits: LIMITS });
  return (
    <>
      <PresetChips presets={PRESETS} config={c} isHost={isHost} onPick={(p) => set(p)} />

      <h3>카드</h3>
      {f.num('deal', '처음 카드', { fmt: (v) => `${v}장` })}
      {f.bool('jokers', '조커', '흑백 +5 · 컬러 +7 · 조커 다음엔 아무 카드나')}
      {f.bool('attacks', '공격 카드', '2 → +2 · A → +3 · ♠A → +5 (같거나 센 공격으로 막아요)')}
      {f.bool('seven', '7 — 무늬 바꾸기')}
      {f.bool('jack', 'J — 건너뛰기')}
      {f.bool('queen', 'Q — 방향 바꾸기', '둘이면 한 번 더')}
      {f.bool('king', 'K — 한 장 더')}

      <h3>원카드 외치기</h3>
      {f.bool('call', '원카드 외치기', '한 장 남으면 먼저 누르는 사람이 이겨요')}
      {f.num('callSec', '외치기 시간', { fmt: (v) => `${v}초` })}
      {f.num('callPenalty', '잡히면', { fmt: (v) => `${v}장 추가` })}

      <h3>진행</h3>
      {f.num('bankrupt', '파산', { fmt: (v) => (v ? `${v}장 넘으면` : '없음') })}
      {f.choice('until', '판 끝', [
        { value: 'first', label: '한 명이 다 내면', hint: '남은 카드만큼 감점' },
        { value: 'last', label: '끝까지 순위', hint: '나간 순서대로 점수' },
      ])}
      {f.num('rounds', '판 수', { fmt: (v) => `${v}판` })}
      {f.num('turnTimerSec', '차례 제한시간', { step: 5, fmt: (v) => (v ? `${v}초` : '없음'), hint: '지나면 낼 수 있는 첫 카드, 없으면 가져오기' })}
    </>
  );
}
