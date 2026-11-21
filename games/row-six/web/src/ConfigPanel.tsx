import { CLASSIC, GameConfig, LIMITS, PRESETS, cardsNeeded } from '@bg/row-six-engine';
import { PresetChips, configFields } from '@bg/ui';
import type { ConfigPanelProps } from '@bg/web';
import { NumberCard } from './theme';

export function ConfigPanel({ view, config: c, isHost, set }: ConfigPanelProps<GameConfig>) {
  const f = configFields({ config: c, set, isHost, limits: LIMITS });
  const players = Math.max(2, view.lobby.playerCount);
  const need = cardsNeeded(c, players);
  return (
    <>
      <PresetChips presets={PRESETS} config={c} isHost={isHost} onPick={(p) => set(p)} />
      <div className="rs-preview" aria-hidden>
        {[c.maxCard > 54 ? 55 : 11, 10, 5, 7].map((n) => (
          <NumberCard key={n} n={n} flat={c.penalty === 'flat'} size="sm" />
        ))}
        <span className="small muted">
          {players}명 · 카드 {need}장 사용 / 1~{c.maxCard}
        </span>
      </div>

      <h3>카드</h3>
      {f.num('maxCard', '카드 범위', { fmt: (v) => `1~${v}`, hint: `원작 1~104 · 지금 인원이면 ${need}장이 필요해요` })}
      {isHost && c.maxCard !== need && (
        <button className="btn ghost small-btn" onClick={() => set({ maxCard: need })}>
          인원에 맞추기 (1~{need}) — 모든 카드가 나와 수 싸움이 돼요
        </button>
      )}
      {f.num('handSize', '손패', { fmt: (v) => `${v}장`, hint: `원작 ${CLASSIC.handSize}장 · 한 판에 이만큼 골라요` })}
      {f.choice('penalty', '벌점', [
        { value: 'classic', label: '원작', hint: '5의 배수 2 · 10의 배수 3 · 11·22… 5 · 55는 7 · 나머지 1' },
        { value: 'flat', label: '모두 1점', hint: '가져간 카드 장수가 곧 벌점이에요' },
      ])}

      <h3>줄</h3>
      {f.num('rows', '줄 수', { fmt: (v) => `${v}줄`, hint: '원작 4줄' })}
      {f.num('rowLimit', '한 줄 길이', { fmt: (v) => `${v}장 → ${v + 1}번째가 가져감`, hint: '원작 5장' })}
      {f.choice('lowCard', '가장 작은 카드를 냈을 때', [
        { value: 'choose', label: '줄 고르기', hint: '원작: 가져갈 줄을 직접 골라요' },
        { value: 'fewest', label: '자동', hint: '벌점이 가장 적은 줄을 자동으로 가져가요' },
      ])}

      <h3>끝내기</h3>
      {f.choice('endMode', '끝내는 방법', [
        { value: 'target', label: '목표 벌점', hint: '누군가 목표 벌점에 닿으면 그 판이 끝나고 게임 끝 (원작 66)' },
        { value: 'rounds', label: '판 수', hint: '정한 판 수만큼 하고 끝' },
      ])}
      {c.endMode === 'target' ? f.num('target', '목표 벌점', { step: 2, fmt: (v) => `${v}점` }) : null}
      {f.num('rounds', c.endMode === 'target' ? '최대 판 수' : '판 수', { fmt: (v) => `${v}판` })}

      <h3>진행</h3>
      {f.bool('allowChange', '공개 전에 바꾸기', '모두 고르기 전까지 고른 카드를 바꿀 수 있어요')}
      {f.bool('openPenalties', '벌점 공개', '가져간 벌점을 모두에게 보여 줘요 (원작은 뒤집어 둬요)')}
      {f.num('turnTimerSec', '고르는 시간', { step: 5, fmt: (v) => (v ? `${v}초` : '없음'), hint: '시간이 지나면 안전한 카드를 대신 골라요' })}
      {f.bool('teams', '2명씩 팀', '4·6·8·10명일 때 · 옆자리 두 사람의 벌점을 더해요', players < 4 || players % 2 === 1)}
    </>
  );
}
