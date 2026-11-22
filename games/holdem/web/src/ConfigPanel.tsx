import { GameConfig, LIMITS, PRESETS } from '@bg/holdem-engine';
import { PresetChips, configFields } from '@bg/ui';
import type { ConfigPanelProps } from '@bg/web';

export function ConfigPanel({ config: c, isHost, set }: ConfigPanelProps<GameConfig>) {
  const f = configFields({ config: c, set, isHost, limits: LIMITS });
  return (
    <>
      <PresetChips presets={PRESETS} config={c} isHost={isHost} onPick={(p) => set(p)} />
      <p className="small muted">돈이 오가지 않는 칩 게임이에요. 칩은 게임이 끝나면 사라져요.</p>
      <h3>칩과 블라인드</h3>
      {f.num('startChips', '처음 칩', { step: 100, fmt: (v) => `${v}` })}
      {f.num('smallBlind', '스몰 블라인드', { step: 5, fmt: (v) => `${v} / ${v * 2}` })}
      {f.num('blindUp', '블라인드 올림', { step: 5, fmt: (v) => (v ? `${v}핸드마다 ×2` : '그대로') })}
      <h3>베팅</h3>
      {f.choice('limit', '베팅 상한', [
        { value: 'no-limit', label: '노 리밋', hint: '언제든 올인까지' },
        { value: 'pot', label: '팟 리밋', hint: '한 번에 팟만큼까지' },
      ])}
      <h3>진행</h3>
      {f.num('maxHands', '핸드 수', { step: 5, fmt: (v) => (v ? `${v}핸드 뒤 칩 순위` : '한 명 남을 때까지') })}
      {f.num('turnTimerSec', '차례 제한시간', { step: 5, fmt: (v) => (v ? `${v}초` : '없음'), hint: '지나면 체크, 낼 칩이 있으면 접기' })}
    </>
  );
}
