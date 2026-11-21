import { GameConfig, LIMITS, PRESETS, buildDeck, deckSpec, tokensFor } from '@bg/sealed-letter-engine';
import { PresetChips, configFields } from '@bg/ui';
import type { ConfigPanelProps } from '@bg/web';
import { LetterCard } from './theme';

export function ConfigPanel({ view, config: c, isHost, set }: ConfigPanelProps<GameConfig>) {
  const f = configFields({ config: c, set, isHost, limits: LIMITS });
  const players = Math.max(2, view.lobby.playerCount);
  return (
    <>
      <PresetChips presets={PRESETS} config={c} isHost={isHost} onPick={(p) => set(p)} />
      <div className="sl-preview" aria-hidden>
        {deckSpec(c.edition).map((s) => (
          <LetterCard key={s.kind} kind={s.kind} value={s.value} size="xs" />
        ))}
      </div>
      <h3>카드</h3>
      {f.choice('edition', '카드 구성', [
        { value: 'classic', label: '원작 16장', hint: '2~4명' },
        { value: 'extended', label: '확장 21장', hint: '첩자·서기관 추가 · 2~6명 · 재상·밀정·여왕이 7·8·9' },
      ])}
      <p className="small muted">지금 {buildDeck(c.edition).length}장</p>
      <h3>규칙</h3>
      {f.num('tokensToWin', '우승 인장', { fmt: (v) => (v ? `${v}개` : `자동 (${tokensFor({ ...c, tokensToWin: 0 }, players)}개)`), hint: '자동: 2명 7 · 3명 5 · 4명 4 · 5~6명 3' })}
      {f.bool('twoPlayerReveal', '2명이면 3장 공개로 빼기', '원작: 둘이 할 때 카드 3장을 앞면으로 빼 둬요')}
      {f.bool('guardNoGuard', '파수꾼으로 파수꾼 지목 금지', '원작 규칙')}
      {f.bool('winnerStarts', '이긴 사람이 다음 판 먼저', '끄면 무작위')}
      {f.num('turnTimerSec', '차례 제한시간', { step: 5, fmt: (v) => (v ? `${v}초` : '없음') })}
    </>
  );
}
