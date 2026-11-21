import { GameConfig, LIMITS, PRESETS, ROLES } from '@bg/court-intrigue-engine';
import { PresetChips, configFields } from '@bg/ui';
import type { ConfigPanelProps } from '@bg/web';
import { RoleCard } from './theme';

export function ConfigPanel({ config: c, isHost, set }: ConfigPanelProps<GameConfig>) {
  const f = configFields({ config: c, set, isHost, limits: LIMITS });
  return (
    <>
      <PresetChips presets={PRESETS} config={c} isHost={isHost} onPick={(p) => set(p)} />
      <div className="ci-preview" aria-hidden>
        {ROLES.map((r) => (
          <RoleCard key={r} role={r} size="xs" />
        ))}
        <span className="small muted">× {c.copies}장씩</span>
      </div>
      <h3>카드·금화</h3>
      {f.num('copies', '역할마다 장수', { fmt: (v) => `${v}장`, hint: '원작 3장 · 5~6명이면 4장을 추천해요' })}
      {f.num('startCoins', '시작 금화', { fmt: (v) => `${v}개` })}
      {f.bool('twoPlayerHandicap', '2명: 선 플레이어 금화 1개 덜', '먼저 하는 사람의 이점을 줄여요')}
      <h3>행동</h3>
      {f.num('coupCost', '쿠데타 비용', { fmt: (v) => `금화 ${v}`, hint: '원작 7' })}
      {f.num('mustCoup', '반드시 쿠데타', { fmt: (v) => `금화 ${v}개 이상`, hint: '원작 10' })}
      {f.num('assassinCost', '암살 비용', { fmt: (v) => `금화 ${v}`, hint: '원작 3' })}
      {f.num('stealAmount', '약탈', { fmt: (v) => `금화 ${v}개`, hint: '원작 2' })}
      <h3>시간</h3>
      {f.num('reactionSec', '도전·막기 대기', { step: 1, fmt: (v) => `${v}초`, hint: '이 시간이 지나면 남은 사람은 자동으로 통과해요' })}
      {f.num('turnTimerSec', '행동 고르기 제한시간', { step: 5, fmt: (v) => (v ? `${v}초` : '없음'), hint: '시간이 지나면 소득을 받아요' })}
      {f.num('rounds', '판 수', { fmt: (v) => `${v}판` })}
    </>
  );
}
