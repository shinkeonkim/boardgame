import { GROUPS, GameConfig, LIMITS, PRESETS, deckCopies, handSizeFor, oneDeck } from '@bg/pass-the-plate-engine';
import { PresetChips, Toggle, configFields } from '@bg/ui';
import type { ConfigPanelProps } from '@bg/web';
import { DishCard } from './theme';

const SAMPLE: Record<string, Parameters<typeof DishCard>[0]['dish']> = { maki: 'maki2', tempura: 'tempura', sashimi: 'sashimi', dumpling: 'dumpling', nigiri: 'salmon', wasabi: 'wasabi', chopsticks: 'chopsticks', pudding: 'pudding' };

export function ConfigPanel({ view, config: c, isHost, set }: ConfigPanelProps<GameConfig>) {
  const f = configFields({ config: c, set, isHost, limits: LIMITS });
  const players = Math.max(2, view.lobby.playerCount);
  return (
    <>
      <PresetChips presets={PRESETS} config={c} isHost={isHost} onPick={(p) => set(p)} />
      <h3>메뉴</h3>
      <p className="small muted">
        요리 {oneDeck(c).length}장{deckCopies(c, players) > 1 ? ` × ${deckCopies(c, players)}벌 (인원이 많아 두 벌 이상 섞어요)` : ''}
      </p>
      <div className="pp-menu">
        {GROUPS.map((g) => (
          <div key={g.id} className={`pp-menu-item ${c.menu[g.id] ? '' : 'off'}`}>
            <DishCard dish={SAMPLE[g.id]} size="xs" />
            <Toggle label={g.name} checked={c.menu[g.id]} disabled={!isHost || (g.id === 'wasabi' && !c.menu.nigiri)} onChange={(on) => set({ menu: { ...c.menu, [g.id]: on } })} />
          </div>
        ))}
      </div>
      <h3>진행</h3>
      {f.num('rounds', '판 수', { fmt: (v) => `${v}판`, hint: '원작 3판 · 푸딩은 마지막에 계산' })}
      {f.num('handSize', '손패', { fmt: (v) => (v ? `${v}장` : `자동 (${handSizeFor({ ...c, handSize: 0 }, players)}장)`), hint: '자동: 2명 10 · 3명 9 · 4명 8 · 5명 7 · 6~8명 6' })}
      {f.choice('pass', '넘기는 방향', [
        { value: 'left', label: '늘 왼쪽', hint: '원작' },
        { value: 'alternate', label: '판마다 바꾸기', hint: '1판 왼쪽 → 2판 오른쪽 → …' },
      ])}
      {f.bool('allowChange', '공개 전에 바꾸기', '모두 고르기 전까지 고른 접시를 바꿀 수 있어요')}
      {f.bool('showTableaus', '남이 먹은 접시 보기', '원작처럼 모두 공개 (끄면 내 것만)')}
      {f.num('turnTimerSec', '고르는 시간', { step: 5, fmt: (v) => (v ? `${v}초` : '없음'), hint: '시간이 지나면 첫 접시를 골라요' })}
    </>
  );
}
