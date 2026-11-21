import { GameConfig, LIMITS, PRESETS, gemsFor, noblesFor } from '@bg/gem-guild-engine';
import { PresetChips, configFields } from '@bg/ui';
import type { ConfigPanelProps } from '@bg/web';
import { GemToken } from './theme';

export function ConfigPanel({ view, config: c, isHost, set }: ConfigPanelProps<GameConfig>) {
  const f = configFields({ config: c, set, isHost, limits: LIMITS });
  const players = Math.max(2, view.lobby.playerCount);
  return (
    <>
      <PresetChips presets={PRESETS} config={c} isHost={isHost} onPick={(p) => set(p)} />
      <div className="gg-preview" aria-hidden>
        {[0, 1, 2, 3, 4].map((g) => (
          <GemToken key={g} gem={g} n={gemsFor(c, players)} size={28} />
        ))}
        <GemToken gem={5} n={c.gold} size={28} />
      </div>
      <h3>승리</h3>
      {f.num('winPoints', '목표 점수', { fmt: (v) => `${v}점`, hint: '원작 15점 · 닿으면 그 바퀴까지 하고 끝' })}
      {f.num('nobles', '귀족', { fmt: (v) => (v < 0 ? '없음' : v ? `${v}명` : `자동 (${noblesFor({ ...c, nobles: 0 }, players)}명)`), hint: '자동: 인원 + 1명 · 방문하면 3점' })}
      <h3>보석</h3>
      {f.num('gemsPerColor', '색마다 보석', { fmt: (v) => (v ? `${v}개` : `자동 (${gemsFor({ ...c, gemsPerColor: 0 }, players)}개)`), hint: '자동: 2명 4 · 3명 5 · 4명 7 · 5명 8 · 6명 9' })}
      {f.num('gold', '황금', { fmt: (v) => `${v}개`, hint: '예약할 때 받는 조커 · 원작 5' })}
      {f.num('tokenLimit', '보석 들기 한도', { fmt: (v) => `${v}개`, hint: '넘으면 버려요 · 원작 10' })}
      {f.num('takeTwoMin', '같은 색 2개 조건', { fmt: (v) => `${v}개 이상 남았을 때`, hint: '원작 4' })}
      <h3>카드</h3>
      {f.num('market', '단계마다 펼친 카드', { fmt: (v) => `${v}장`, hint: '원작 4' })}
      {f.num('maxReserve', '예약 한도', { fmt: (v) => (v ? `${v}장` : '예약 없음'), hint: '원작 3' })}
      <h3>진행</h3>
      {f.num('rounds', '판 수', { fmt: (v) => `${v}판`, hint: '여러 판이면 점수 합' })}
      {f.num('turnTimerSec', '차례 제한시간', { step: 15, fmt: (v) => (v ? `${v}초` : '없음') })}
    </>
  );
}
