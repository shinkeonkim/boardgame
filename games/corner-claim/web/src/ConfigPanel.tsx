import { GameConfig, LIMITS, PIECES, PRESETS } from '@bg/corner-claim-engine';
import { PresetChips, configFields } from '@bg/ui';
import type { ConfigPanelProps } from '@bg/web';
import { PieceIcon } from './theme';

export function ConfigPanel({ view, config: c, isHost, set }: ConfigPanelProps<GameConfig>) {
  const f = configFields({ config: c, set, isHost, limits: LIMITS });
  const players = Math.max(2, view.lobby.playerCount);
  return (
    <>
      <PresetChips presets={PRESETS} config={c} isHost={isHost} onPick={(p) => set(p)} />
      <div className="cc-preview" aria-hidden>
        {PIECES.filter((p) => (c.pieceSet === 'small' ? p.size <= 4 : c.pieceSet === 'medium' ? p.size <= 4 || ['I5', 'L5', 'P5', 'T5', 'U5', 'X5'].includes(p.id) : true)).map((p, i) => (
          <PieceIcon key={p.id} cells={p.orients[0]} color={i % 4} size={6} />
        ))}
      </div>
      <h3>판</h3>
      {f.choice('mode', '방식', [
        { value: 'classic', label: '4색', hint: players === 2 ? '2명이면 한 사람이 두 색씩' : players === 3 ? '3명이면 넷째 색을 돌아가며' : '한 사람 한 색, 네 귀퉁이에서' },
        { value: 'duo', label: '둘이서', hint: '2명 전용 · 가운데 가까운 두 점에서 시작' },
      ])}
      {f.num('size', '판 크기', { fmt: (v) => `${v}×${v}`, hint: c.mode === 'duo' ? '둘이서는 14×14' : '원작 20×20 · 작을수록 빡빡해요' })}
      {f.choice('pieceSet', '조각', [
        { value: 'full', label: '21개', hint: '1칸부터 5칸까지 모두 (89칸)' },
        { value: 'medium', label: '15개', hint: '5칸 조각 일부만' },
        { value: 'small', label: '9개', hint: '1~4칸만 · 빠른 판' },
      ])}
      <h3>점수</h3>
      {f.choice('scoring', '점수 방식', [
        { value: 'advanced', label: '보너스 있음', hint: '남은 칸 −1 · 다 놓으면 +15 · 마지막이 1칸이면 +5 더' },
        { value: 'basic', label: '단순', hint: '남은 칸 −1만' },
      ])}
      <h3>진행</h3>
      {f.num('rounds', '판 수', { fmt: (v) => `${v}판` })}
      {f.num('turnTimerSec', '차례 제한시간', { step: 15, fmt: (v) => (v ? `${v}초` : '없음'), hint: '시간이 지나면 가장 큰 조각을 첫 자리에' })}
    </>
  );
}
