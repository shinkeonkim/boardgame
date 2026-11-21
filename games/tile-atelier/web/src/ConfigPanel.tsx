import { GameConfig, LIMITS, PRESETS, factoriesFor } from '@bg/tile-atelier-engine';
import { PresetChips, SegmentedControl, configFields } from '@bg/ui';
import type { ConfigPanelProps } from '@bg/web';
import { TileView } from './theme';

const FLOORS: Record<string, number[]> = {
  classic: [-1, -1, -2, -2, -2, -3, -3],
  soft: [-1, -1, -1, -1, -2, -2, -2],
  hard: [-1, -2, -2, -3, -3, -4, -4],
};

export function ConfigPanel({ view, config: c, isHost, set }: ConfigPanelProps<GameConfig>) {
  const f = configFields({ config: c, set, isHost, limits: LIMITS });
  const players = Math.max(2, view.lobby.playerCount);
  const floorKey = Object.entries(FLOORS).find(([, v]) => v.join() === c.floor.join())?.[0] ?? 'classic';
  return (
    <>
      <PresetChips presets={PRESETS} config={c} isHost={isHost} onPick={(p) => set(p)} />
      <div className="ta-preview" aria-hidden>
        {Array.from({ length: c.colors }, (_, i) => (
          <TileView key={i} color={i} size={22} />
        ))}
        <span className="small muted">
          × {c.tilesPerColor}장 · 공장 {factoriesFor(c, players)}개
        </span>
      </div>
      <h3>타일</h3>
      {f.num('colors', '색 (= 벽 크기)', { fmt: (v) => `${v}색 · ${v}×${v}`, hint: '원작 5색' })}
      {f.num('tilesPerColor', '색마다 타일', { fmt: (v) => `${v}장`, hint: '원작 20장' })}
      {f.num('factories', '공장', { fmt: (v) => (v ? `${v}개` : `자동 (${factoriesFor({ ...c, factories: 0 }, players)}개)`), hint: '자동: 인원 × 2 + 1' })}
      {f.num('perFactory', '공장마다 타일', { fmt: (v) => `${v}장`, hint: '원작 4장' })}
      <h3>벽·점수</h3>
      {f.bool('freeWall', '자유 벽', '정해진 무늬 대신, 같은 줄·칸에 같은 색만 없으면 어디든 (원작 뒷면)')}
      <div className="cfg-row choice">
        <div className="grow">
          <div>바닥 감점</div>
          <div className="muted small">{c.floor.join(' ')}</div>
        </div>
        {isHost && (
          <SegmentedControl
            value={floorKey}
            options={[
              { value: 'soft', label: '약하게' },
              { value: 'classic', label: '원작' },
              { value: 'hard', label: '세게' },
            ]}
            onChange={(k) => set({ floor: FLOORS[k] })}
          />
        )}
      </div>
      {f.num('rowBonus', '가로줄 보너스', { fmt: (v) => `+${v}` })}
      {f.num('colBonus', '세로줄 보너스', { fmt: (v) => `+${v}` })}
      {f.num('colorBonus', '한 색 모두 보너스', { fmt: (v) => `+${v}` })}
      <h3>끝내기</h3>
      {f.num('maxRounds', '판 수 제한', { fmt: (v) => (v ? `${v}번 채우기 뒤 끝` : '가로줄 완성까지 (원작)') })}
      {f.num('rounds', '게임 수', { fmt: (v) => `${v}게임` })}
      {f.num('turnTimerSec', '차례 제한시간', { step: 15, fmt: (v) => (v ? `${v}초` : '없음') })}
    </>
  );
}
