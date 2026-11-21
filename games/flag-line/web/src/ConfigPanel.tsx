import { GameConfig, LIMITS, PRESETS, deckSize, majority } from '@bg/flag-line-engine';
import { PresetChips, configFields } from '@bg/ui';
import type { ConfigPanelProps } from '@bg/web';
import { Troop } from './theme';

export function ConfigPanel({ config: c, isHost, set }: ConfigPanelProps<GameConfig>) {
  const f = configFields({ config: c, set, isHost, limits: LIMITS });
  return (
    <>
      <PresetChips presets={PRESETS} config={c} isHost={isHost} onPick={(p) => set(p)} />
      <div className="fl-preview" aria-hidden>
        {Array.from({ length: c.colors }, (_, i) => (
          <Troop key={i} color={i} value={c.maxValue} size="xs" />
        ))}
        <span className="small muted">
          카드 {deckSize(c)}장 · 깃발 {c.flags}개
        </span>
      </div>
      <h3>전선</h3>
      {f.num('flags', '깃발', { fmt: (v) => `${v}개`, hint: '원작 9개' })}
      {f.num('size', '대형 크기', { fmt: (v) => `${v}장`, hint: '깃발 한쪽에 놓는 카드 수 · 원작 3장' })}
      {f.num('flagsToWin', '이기는 깃발 수', { fmt: (v) => (v ? `${v}개` : `과반 (${majority({ ...c, flagsToWin: 0 })}개)`) })}
      {f.num('adjacentToWin', '연속 깃발로 승리', { fmt: (v) => (v ? `연속 ${v}개` : '쓰지 않음'), hint: '원작: 나란히 3개' })}
      <h3>카드</h3>
      {f.num('colors', '색', { fmt: (v) => `${v}색`, hint: '원작 6색' })}
      {f.num('maxValue', '숫자', { fmt: (v) => `1~${v}`, hint: '원작 1~10' })}
      {f.num('handSize', '손패', { fmt: (v) => `${v}장`, hint: '원작 7장 · 4명 팀전이면 6장 추천' })}
      <h3>진행</h3>
      {f.bool('autoClaim', '확정된 깃발 자동 차지', '끄면 「차지」 버튼을 직접 눌러야 해요 (원작처럼)')}
      {f.num('rounds', '판 수', { fmt: (v) => `${v}판` })}
      {f.num('turnTimerSec', '차례 제한시간', { step: 15, fmt: (v) => (v ? `${v}초` : '없음') })}
    </>
  );
}
