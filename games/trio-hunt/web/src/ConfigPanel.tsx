import { GameConfig, LIMITS, PRESETS, splitFor } from '@bg/trio-hunt-engine';
import { PresetChips, configFields } from '@bg/ui';
import type { ConfigPanelProps } from '@bg/web';

export function ConfigPanel({ view, config: c, isHost, set }: ConfigPanelProps<GameConfig>) {
  const f = configFields({ config: c, set, isHost, limits: LIMITS });
  const players = Math.min(6, Math.max(3, view.lobby.playerCount));
  const s = splitFor(c, players);
  return (
    <>
      <PresetChips presets={PRESETS} config={c} isHost={isHost} onPick={(p) => set(p)} />
      <p className="small muted">
        {players}명: 손패 {s.hand}장씩 · 가운데 {s.middle}장 (카드 1~12 × 3장)
      </p>
      <h3>승리</h3>
      {f.num('goal', '모을 세트', { fmt: (v) => `${v}개` })}
      {f.bool('sevenWins', '7 세 장이면 바로 승리')}
      <h3>카드</h3>
      {f.num('middle', '가운데 카드', { fmt: (v) => (v ? `${v}장` : '인원에 맞춰'), hint: '많을수록 기억력 싸움' })}
      <h3>진행</h3>
      {f.num('rounds', '판 수', { fmt: (v) => `${v}판`, hint: '이긴 사람 +3, 세트마다 +1' })}
      {f.num('turnTimerSec', '차례 제한시간', { step: 5, fmt: (v) => (v ? `${v}초` : '없음') })}
    </>
  );
}
