import { GameConfig, LIMITS, PRESETS, tileTotal } from '@bg/number-runs-engine';
import { PresetChips, configFields } from '@bg/ui';
import type { ConfigPanelProps } from '@bg/web';
import { TileFace } from './theme';

export function ConfigPanel({ config: c, isHost, set }: ConfigPanelProps<GameConfig>) {
  const f = configFields({ config: c, set, isHost, limits: LIMITS });
  return (
    <>
      <PresetChips presets={PRESETS} config={c} isHost={isHost} onPick={(p) => set(p)} />
      <div className="nr-preview" aria-hidden>
        {Array.from({ length: c.colors }, (_, i) => (
          <TileFace key={i} t={{ id: `p${i}`, n: c.maxNumber - i, color: i }} size="sm" />
        ))}
        {c.jokers > 0 && <TileFace t={{ id: 'pj', n: 0, color: -1 }} size="sm" />}
        <span className="small muted">타일 {tileTotal(c)}장</span>
      </div>
      <h3>타일</h3>
      {f.num('colors', '색', { fmt: (v) => `${v}색`, hint: '원작 4색 · 5~6명이면 5색' })}
      {f.num('maxNumber', '숫자', { fmt: (v) => `1~${v}`, hint: '원작 1~13' })}
      {f.num('copies', '벌 수', { fmt: (v) => `${v}벌`, hint: '원작 2벌' })}
      {f.num('jokers', '조커', { fmt: (v) => `${v}장`, hint: '원작 2장 · 남으면 30점 감점' })}
      <h3>규칙</h3>
      {f.num('handSize', '처음 손패', { fmt: (v) => `${v}장`, hint: '원작 14장' })}
      {f.num('initialMeld', '처음 등록', { step: 5, fmt: (v) => (v ? `합 ${v} 이상` : '조건 없음'), hint: '원작 30 · 처음에는 내 손 타일만으로 이 합 이상을 내야 해요' })}
      <h3>진행</h3>
      {f.num('rounds', '판 수', { fmt: (v) => `${v}판`, hint: '여러 판이면 점수를 더해요' })}
      {f.num('turnTimerSec', '차례 제한시간', { step: 15, fmt: (v) => (v ? `${v}초` : '없음'), hint: '시간이 지나면 1장 가져와요' })}
    </>
  );
}
