import { GameConfig, LIMITS, PRESETS, startTilesFor, tileCount } from '@bg/number-vault-engine';
import { PresetChips, configFields } from '@bg/ui';
import type { ConfigPanelProps } from '@bg/web';
import { TileView } from './theme';

export function ConfigPanel({ view, config: c, isHost, set }: ConfigPanelProps<GameConfig>) {
  const f = configFields({ config: c, set, isHost, limits: LIMITS });
  const players = Math.max(2, view.lobby.playerCount);
  return (
    <>
      <PresetChips presets={PRESETS} config={c} isHost={isHost} onPick={(p) => set(p)} />
      <div className="nv-preview" aria-hidden>
        <TileView t={{ n: 0, color: 0, revealed: true }} size="xs" />
        <TileView t={{ n: c.maxNumber, color: 1, revealed: true }} size="xs" />
        {c.jokers > 0 && <TileView t={{ n: -1, color: 0, revealed: true }} size="xs" />}
        <span className="small muted">
          타일 {tileCount(c)}장 · 한 사람 {startTilesFor(c, players)}장으로 시작
        </span>
      </div>
      <h3>타일</h3>
      {f.num('maxNumber', '숫자 범위', { fmt: (v) => `0~${v}`, hint: '원작 0~11 (색마다 12장) · 인원이 많으면 늘려요' })}
      {f.num('jokers', '조커', { fmt: (v) => `${v}장`, hint: '어느 자리에나 놓이는 「–」 타일 (원작 선택 규칙)' })}
      {f.num('startTiles', '시작 타일', { fmt: (v) => (v ? `${v}장` : `자동 (${startTilesFor({ ...c, startTiles: 0 }, players)}장)`), hint: '자동: 2~3명 4장 · 4명 이상 3장' })}
      <h3>규칙</h3>
      {f.bool('chain', '맞히면 계속', '원작: 맞히면 더 맞히거나 멈출 수 있어요. 끄면 한 번만')}
      {f.bool('chooseColor', '가져올 색 고르기', '원작: 검은 타일과 하얀 타일 중 골라 가져와요')}
      {f.bool('showMisses', '틀린 추측 기록 보이기', '끄면 누가 무엇을 틀렸는지 기억해야 해요')}
      <h3>진행</h3>
      {f.num('rounds', '판 수', { fmt: (v) => `${v}판`, hint: '과반을 먼저 이긴 사람이 우승' })}
      {f.num('turnTimerSec', '차례 제한시간', { step: 15, fmt: (v) => (v ? `${v}초` : '없음') })}
    </>
  );
}
