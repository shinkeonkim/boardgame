import { GameConfig, LIMITS, PRESETS } from '@bg/bluff-dice-engine';
import { PresetChips, configFields } from '@bg/ui';
import type { ConfigPanelProps } from '@bg/web';
import { Die } from './theme';

export function ConfigPanel({ view, config: c, isHost, set }: ConfigPanelProps<GameConfig>) {
  const f = configFields({ config: c, set, isHost, limits: LIMITS });
  const players = Math.max(2, view.lobby.playerCount);
  return (
    <>
      <PresetChips presets={PRESETS} config={c} isHost={isHost} onPick={(p) => set(p)} />
      <div className="bd-preview" aria-hidden>
        {Array.from({ length: Math.min(c.dice, 8) }, (_, i) => (
          <Die key={i} face={(i % c.faces) + 1} size={22} />
        ))}
        <span className="small muted">
          × {players}명 = 주사위 {c.dice * players}개
        </span>
      </div>

      <h3>주사위</h3>
      {f.num('dice', '처음 주사위', { fmt: (v) => `${v}개`, hint: '보통 5개' })}
      {f.num('faces', '면 수', { fmt: (v) => `${v}면`, hint: '보통 6면 · 4면이면 짧고 8면이면 예측이 어려워요' })}
      {f.bool('wildOnes', '1은 와일드', '1은 어떤 숫자로도 세요')}
      {f.bool('aceBids', '1에 걸기 (페루 규칙)', '1로 바꾸면 개수 절반부터, 1에서 돌아오면 두 배+1부터', !c.wildOnes)}

      <h3>외치기</h3>
      {f.bool('exactCall', '「딱 맞다!」', '정확히 맞으면 주사위 하나를 되찾고, 틀리면 하나 잃어요')}
      {f.num('maxDice', '되찾을 수 있는 최대', { fmt: (v) => `${v}개`, hint: '딱 맞다로 늘어날 수 있는 한도' })}
      {f.bool('palifico', '팔리피코', '주사위가 1개가 된 사람이 처음 시작하는 판은 숫자 고정 · 와일드 없음')}
      {f.choice('penalty', '진 사람', [
        { value: 'die', label: '1개 잃기', hint: '보통 규칙' },
        { value: 'diff', label: '차이만큼', hint: '틀린 개수만큼 잃어 빠르게 끝나요' },
      ])}

      <h3>진행</h3>
      {f.num('rounds', '게임 수', { fmt: (v) => `${v}게임`, hint: '과반을 먼저 이긴 사람이 우승' })}
      {f.num('turnTimerSec', '차례 제한시간', { step: 5, fmt: (v) => (v ? `${v}초` : '없음'), hint: '시간이 지나면 가장 낮게 걸거나, 너무 높으면 거짓말을 외쳐요' })}
    </>
  );
}
