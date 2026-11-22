import { GameConfig, LIMITS, PRESETS, parseCustom } from '@bg/sketch-quiz-engine';
import { PresetChips, configFields } from '@bg/ui';
import type { ConfigPanelProps } from '@bg/web';

export function ConfigPanel({ config: c, isHost, set }: ConfigPanelProps<GameConfig>) {
  const f = configFields({ config: c, set, isHost, limits: LIMITS });
  const n = parseCustom(c.customWords).length;
  return (
    <>
      <PresetChips presets={PRESETS} config={c} isHost={isHost} onPick={(p) => set(p)} />
      <h3>진행</h3>
      {f.num('rounds', '한 사람이 그리는 횟수', { fmt: (v) => `${v}번` })}
      {f.num('drawSec', '그리는 시간', { step: 10, fmt: (v) => `${v}초` })}
      {f.num('choices', '고를 단어', { fmt: (v) => (v === 1 ? '정해진 단어' : `${v}개 중`) })}
      {f.bool('hints', '초성·글자 힌트 (시간이 지나면)')}
      <h3>단어</h3>
      {f.choice('pack', '단어 묶음', [
        { value: 'all', label: '모든 단어' },
        { value: 'nature', label: '자연·동물' },
        { value: 'daily', label: '일상·음식' },
        { value: 'fantasy', label: '모험·상상' },
        { value: 'custom', label: '직접 넣기' },
      ])}
      {c.pack === 'custom' && (
        <label className="field">
          <span>
            단어 목록 <span className="muted small">(쉼표·줄바꿈으로 구분 · 지금 {n}개)</span>
          </span>
          <textarea rows={4} value={c.customWords} disabled={!isHost} onChange={(e) => set({ customWords: e.target.value })} placeholder="예: 고양이, 우산, 눈사람, 자전거, 무지개" />
        </label>
      )}
      <p className="small muted">봇은 그림을 못 그려서 차례를 넘기고, 맞히기만 해요 (힌트로 짐작).</p>
    </>
  );
}
