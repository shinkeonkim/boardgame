import { GameConfig, LIMITS, PRESETS, SPIES, rolesFor } from '@bg/secret-mission-engine';
import { PresetChips, configFields } from '@bg/ui';
import type { ConfigPanelProps } from '@bg/web';
import { ROLE_INFO } from './theme';

export function ConfigPanel({ view, config: c, isHost, set }: ConfigPanelProps<GameConfig>) {
  const f = configFields({ config: c, set, isHost, limits: LIMITS });
  const players = Math.min(10, Math.max(5, view.lobby.playerCount));
  const roles = rolesFor(c, players);
  return (
    <>
      <PresetChips presets={PRESETS} config={c} isHost={isHost} onPick={(p) => set(p)} />
      <p className="small muted">
        {players}명: {roles.map((r) => ROLE_INFO[r].name).join(' · ')} (첩자 {SPIES[players]}명)
      </p>

      <h3>특수 역할</h3>
      {f.bool('seer', '예언자 + 그림자 사냥꾼', '예언자는 첩자를 알아요. 요원이 이기면 사냥꾼이 예언자를 맞혀 역전할 수 있어요')}
      {f.bool('guard', '호위무사', '예언자 후보를 봐요', !c.seer)}
      {f.bool('falseSeer', '가짜 예언자 (첩자)', '호위무사에게 예언자처럼 보여요', !c.seer)}
      {f.bool('shadow', '숨은 우두머리 (첩자)', '예언자에게 안 보여요', !c.seer)}
      {f.bool('loner', '외톨이 첩자', '다른 첩자와 서로 몰라요')}

      <h3>투표</h3>
      {f.choice('voteReveal', '투표 공개', [
        { value: 'names', label: '누가 찬반했는지', hint: '보통 규칙 — 추리의 단서' },
        { value: 'count', label: '수만', hint: '익명 — 더 의심스럽게' },
      ])}
      {f.num('rejectLimit', '연속 부결 한도', { fmt: (v) => `${v}번`, hint: '이만큼 연속으로 부결되면 첩자 승' })}

      <h3>진행</h3>
      {f.num('rounds', '게임 수', { fmt: (v) => `${v}게임`, hint: '게임마다 역할을 새로 · 이긴 편 1점' })}
      {f.num('turnTimerSec', '차례 제한시간', { step: 10, fmt: (v) => (v ? `${v}초` : '없음'), hint: '이야기할 시간을 넉넉히 · 지나면 찬성/성공으로' })}
    </>
  );
}
