import { CLASSIC, GameConfig, LIMITS, PRESETS } from '@bg/crown-march-engine';
import { PresetChips, configFields } from '@bg/ui';
import type { ConfigPanelProps } from '@bg/web';
import { BoardPreview } from './theme';

/** 원작 비율(81칸 중 52개 ≈ 64%)로 돌 개수 추천 */
function suggestStones(open: number): number {
  return Math.min(open, Math.max(LIMITS.stones[0], Math.round((open * 52) / 80 / 2) * 2));
}

export function ConfigPanel({ view, config: c, isHost, set }: ConfigPanelProps<GameConfig>) {
  const f = configFields({ config: c, set, isHost, limits: LIMITS });
  const open = view.lobby.info.openCells ?? c.boardSize * c.boardSize - 1;
  const suggested = suggestStones(open);
  return (
    <>
      <PresetChips presets={PRESETS} config={c} isHost={isHost} onPick={(p) => set(p)} />
      <BoardPreview config={c} players={Math.max(2, view.lobby.playerCount)} />

      <h3>보드</h3>
      {f.num('boardSize', '보드 크기', { fmt: (v) => `${v}×${v}`, hint: `원작 ${CLASSIC.boardSize}×${CLASSIC.boardSize} · 3~4인은 11×11 권장` })}
      {f.num('stones', '공용 돌', { step: 2, fmt: (v) => `${v}개`, hint: `다 쓰면 판 종료 · 원작 52 · 이 보드 최대 ${open}` })}
      {isHost && Math.abs(c.stones - suggested) > open * 0.12 && (
        <button className="btn ghost small-btn" onClick={() => set({ stones: suggested })}>
          보드에 맞춰 돌 {suggested}개로
        </button>
      )}
      {f.num('holes', '막힌 칸', { hint: '무작위·대칭으로 배치되는 폐허 칸' })}

      <h3>카드</h3>
      {f.num('maxDistance', '이동 거리', { fmt: (v) => `1~${v}칸`, hint: '원작 1~3' })}
      {f.bool('diagonals', '대각선 방향 카드', '끄면 상하좌우 4방향만')}
      {f.num('cardCopies', '이동 카드 벌 수', { fmt: (v) => `${v}벌`, hint: '3~4인은 2벌 권장' })}
      {f.num('handLimit', '손패 상한', { fmt: (v) => `${v}장` })}
      {f.num('heroes', '기사 카드', { fmt: (v) => `1인 ${v}장`, hint: '상대 돌을 내 색으로 뒤집는 카드' })}
      {f.bool('openHands', '손패 공개', '원작 규칙: 모두의 카드가 보임')}

      <h3>점수</h3>
      {f.bool('squareScoring', '영역 점수 = 칸 수²', '끄면 칸 수 그대로 (큰 영역의 이점이 줄어듦)')}
      {f.bool('diagonalGroups', '대각선으로 이어진 돌도 한 영역', '원작은 상하좌우만')}

      <h3>진행</h3>
      {f.num('rounds', '판 수', { fmt: (v) => `${v}판` })}
      {f.num('turnTimerSec', '턴 제한시간', { step: 15, fmt: (v) => (v ? `${v}초` : '없음'), hint: '시간이 지나면 자동으로 돌을 놓거나 카드를 가져옴' })}
      {f.bool('teams', '2:2 팀전', '4인일 때만 · 같은 팀 돌은 한 영역', view.lobby.playerCount !== 4 && !c.teams)}
    </>
  );
}
