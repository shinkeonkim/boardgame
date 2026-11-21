import { useEffect, useState } from 'react';
import { GameConfig, LIMITS, PACKS, PRESETS, layout, parseCustom, wordPool } from '@bg/cipher-ops-engine';
import { PresetChips, configFields } from '@bg/ui';
import type { ConfigPanelProps } from '@bg/web';
import { TEAMS } from './theme';

export function ConfigPanel({ view, config: c, isHost, set }: ConfigPanelProps<GameConfig>) {
  const f = configFields({ config: c, set, isHost, limits: LIMITS });
  const l = layout(c);
  const [words, setWords] = useState(c.customWords);
  useEffect(() => setWords(c.customWords), [c.customWords]);
  const players = view.lobby.playerCount;
  const red = Math.ceil(players / 2);
  const blue = Math.floor(players / 2);
  return (
    <>
      <PresetChips presets={PRESETS} config={c} isHost={isHost} onPick={(p) => set({ ...p, customWords: c.customWords })} />
      <div className="co-preview small" aria-hidden>
        <span className="red">
          {TEAMS[0].icon} {red}명
        </span>
        <span className="blue">
          {TEAMS[1].icon} {blue}명
        </span>
        <span className="muted">· 각 팀 첫 번째 사람이 팀장 {c.rotateSpymaster ? '(판마다 돌아가요)' : ''}</span>
      </div>

      <h3>보드</h3>
      {f.num('size', '보드 크기', { fmt: (v) => `${v}×${v}`, hint: `원작 5×5 · 지금은 팀 카드 ${l.first}·${l.second}장, 중립 ${l.neutral}장` })}
      {f.num('assassins', '암살자', { fmt: (v) => `${v}장`, hint: '고르는 순간 그 팀이 져요 · 원작 1장' })}

      <h3>단어</h3>
      {f.choice(
        'pack',
        '단어 묶음',
        Object.entries(PACKS).map(([value, p]) => ({ value, label: p.label })),
        `지금 쓸 수 있는 단어 ${wordPool(c).length}개`,
      )}
      <label className="cfg-row co-words">
        <div className="grow">
          <div>직접 넣은 단어</div>
          <div className="muted small">쉼표나 줄바꿈으로 구분 · 넣은 단어가 먼저 보드에 나와요 ({parseCustom(words).length}개)</div>
          <textarea value={words} disabled={!isHost} rows={3} maxLength={3000} placeholder="예: 우리집 강아지 이름, 회사 근처 식당…" onChange={(e) => setWords(e.target.value)} onBlur={() => isHost && words !== c.customWords && set({ customWords: words })} />
        </div>
      </label>

      <h3>규칙</h3>
      {f.choice('guessLimit', '한 힌트에 고를 수 있는 수', [
        { value: 'plusOne', label: '숫자+1', hint: '원작: 지난 힌트 몫까지 하나 더' },
        { value: 'exact', label: '숫자만큼', hint: '조금 더 빡빡하게' },
        { value: 'unlimited', label: '틀릴 때까지', hint: '맞히는 동안 계속' },
      ])}
      {f.bool('rotateSpymaster', '판마다 팀장 돌아가며', '팀 안에서 차례로 팀장을 맡아요')}
      {f.num('rounds', '판 수', { fmt: (v) => `${v}판`, hint: '과반을 먼저 이긴 팀이 승리' })}
      {f.num('turnTimerSec', '차례 제한시간', { step: 15, fmt: (v) => (v ? `${v}초` : '없음'), hint: '시간이 지나면 팀장은 차례를 넘기고, 요원은 그만 골라요' })}
    </>
  );
}
