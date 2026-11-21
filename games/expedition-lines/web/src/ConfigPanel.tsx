import { CLASSIC, GameConfig, LIMITS, PRESETS, autoCost } from '@bg/expedition-lines-engine';
import { PresetChips, configFields } from '@bg/ui';
import type { ConfigPanelProps } from '@bg/web';
import { Glyph, SUITS, suitVars } from './theme';

export function ConfigPanel({ view, config: c, isHost, set }: ConfigPanelProps<GameConfig>) {
  const f = configFields({ config: c, set, isHost, limits: LIMITS });
  const suggested = autoCost(c.minValue, c.maxValue);
  return (
    <>
      <PresetChips presets={PRESETS} config={c} isHost={isHost} onPick={(p) => set(p)} />
      <div className="suit-strip">
        {Array.from({ length: c.colors }, (_, i) => (
          <span key={i} className="suit-dot" style={suitVars(i)}>
            <Glyph color={i} size={14} /> {SUITS[i].name}
          </span>
        ))}
      </div>

      <h3>카드 구성</h3>
      {f.num('colors', '탐험대(색) 수', { hint: `원작 ${CLASSIC.colors} · 롱게임 6` })}
      {f.num('minValue', '가장 작은 숫자')}
      {f.num('maxValue', '가장 큰 숫자')}
      {f.num('wagersPerColor', '색당 투자 카드')}
      {f.num('deckCopies', '덱 배수', { fmt: (v) => `${v}벌`, hint: '3~4인용. 2벌 이상이면 같은 숫자 허용을 권장' })}
      {f.num('handSize', '손패')}

      <h3>점수</h3>
      {f.num('expeditionCost', '탐험대 비용', { hint: suggested !== c.expeditionCost ? `숫자 범위 기준 권장값 ${suggested}` : '원작 20' })}
      {isHost && suggested !== c.expeditionCost && (
        <button className="btn ghost small-btn" onClick={() => set({ expeditionCost: suggested })}>
          비용을 권장값 {suggested}로 맞추기
        </button>
      )}
      {f.num('bonusThreshold', '보너스 기준 장수', { fmt: (v) => `${v}장 이상` })}
      {f.num('bonusPoints', '보너스 점수', { step: 5 })}
      {f.bool('bonusMultiplied', '보너스에도 투자 배수 적용', '원작은 적용 안 함')}

      <h3>진행</h3>
      {f.num('rounds', '판 수', { fmt: (v) => `${v}판` })}
      {f.num('turnTimerSec', '턴 제한시간', { step: 15, fmt: (v) => (v ? `${v}초` : '없음'), hint: '시간이 지나면 자동으로 버리고 덱에서 뽑음' })}
      {f.bool('allowEqual', '같은 숫자 이어 놓기 허용')}
      {f.bool('forbidRedrawDiscard', '방금 버린 카드 다시 줍기 금지', '원작 규칙')}
      {f.bool('showDeckCount', '남은 덱 장수 공개')}
      {f.bool('revealDiscards', '버림 더미 펼쳐보기', '원작은 맨 위 카드만 보임')}
      {f.bool('showScorePreview', '현재 점수 미리보기')}
      {f.bool('teams', '2:2 팀전', '4인일 때만', view.lobby.playerCount !== 4 && !c.teams)}
    </>
  );
}
