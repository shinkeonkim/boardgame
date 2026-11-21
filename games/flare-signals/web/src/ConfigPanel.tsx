import { GameConfig, LIMITS, PRESETS, deckSize, handSizeFor, maxScore } from '@bg/flare-signals-engine';
import { PresetChips, configFields } from '@bg/ui';
import type { ConfigPanelProps } from '@bg/web';
import { FlareCard } from './theme';

export function ConfigPanel({ view, config: c, isHost, set }: ConfigPanelProps<GameConfig>) {
  const f = configFields({ config: c, set, isHost, limits: LIMITS });
  const players = Math.max(2, view.lobby.playerCount);
  return (
    <>
      <PresetChips presets={PRESETS} config={c} isHost={isHost} onPick={(p) => set(p)} />
      <div className="fs-preview" aria-hidden>
        {Array.from({ length: c.colors }, (_, i) => (
          <FlareCard key={i} c={c} color={i} value={5} size="xs" />
        ))}
        <span className="small muted">
          카드 {deckSize(c)}장 · 만점 {maxScore(c)}
        </span>
      </div>

      <h3>카드</h3>
      {f.choice('colors' as never, '색', [
        { value: 5 as never, label: '5색', hint: '원작 · 25점 만점' },
        { value: 6 as never, label: '6색', hint: '30점 만점 · 여섯째 색을 골라요' },
      ])}
      {c.colors === 6 &&
        f.choice('sixth', '여섯째 색', [
          { value: 'plain', label: '보통 색', hint: '주황: 다른 색과 똑같이' },
          { value: 'rainbow', label: '무지개', hint: '모든 색 힌트에 함께 가리켜져요 (무지개 자체로는 힌트 못 줌)' },
        ])}
      {c.colors === 6 &&
        f.choice('sixthCount', '여섯째 색 장수', [
          { value: 'full', label: '10장', hint: '1×3 · 2·3·4×2 · 5×1' },
          { value: 'single', label: '5장', hint: '숫자마다 한 장 — 모두 마지막 한 장이라 버리면 끝' },
        ])}
      {f.num('handSize', '손패', { fmt: (v) => (v ? `${v}장` : `자동 (${handSizeFor({ ...c, handSize: 0 }, players)}장)`), hint: '자동: 2~3명 5장 · 4~5명 4장 · 6명 3장' })}

      <h3>토큰</h3>
      {f.num('hints', '힌트 토큰', { fmt: (v) => `${v}개`, hint: '원작 8개 · 버리거나 5를 완성하면 돌아와요' })}
      {f.num('fuses', '실수 허용', { fmt: (v) => `${v}번`, hint: '원작 3번 · 이만큼 틀리면 실패' })}
      {f.choice('bombScore', '실패했을 때', [
        { value: 'zero', label: '0점', hint: '최근 원작 규칙' },
        { value: 'keep', label: '쌓은 만큼', hint: '연습할 때 좋아요' },
      ])}

      <h3>힌트</h3>
      {f.bool('emptyHints', '없는 카드 힌트 허용', '「빨강은 하나도 없어요」 같은 힌트를 줄 수 있어요')}
      {f.bool('showClues', '받은 힌트를 카드에 표시', '끄면 기억으로만 해요 (기억력 도전)')}
      {f.bool('showPossibilities', '가능성 계산 기본으로 켜기', '내 카드가 될 수 있는 카드와 남은 장수를 보여 줘요', !c.showClues)}

      <h3>진행</h3>
      {f.bool('lastRound', '덱이 바닥나면 한 바퀴 더', '원작: 마지막 카드를 뽑은 사람까지 모두 한 번씩 더')}
      {f.num('rounds', '판 수', { fmt: (v) => `${v}판`, hint: '여러 판 점수를 더해요' })}
      {f.num('turnTimerSec', '턴 제한시간', { step: 15, fmt: (v) => (v ? `${v}초` : '없음'), hint: '시간이 지나면 버릴 차례 카드를 버리거나 힌트를 줘요' })}
    </>
  );
}
