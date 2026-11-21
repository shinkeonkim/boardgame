import { CLASSIC, tileTotal } from '@bg/number-runs-engine';
import { Clip, type GuideDef } from '@bg/web/guide-kit';
import { Logo, TileFace } from './theme';

const T = (color: number, n: number) => ({ id: `${color}-${n}`, n, color });
const Row = ({ tiles }: { tiles: { id: string; n: number; color: number }[] }) => (
  <div className="nr-set ok">
    {tiles.map((x) => (
      <TileFace key={x.id} t={x} size="sm" />
    ))}
  </div>
);

export const guide: GuideDef = {
  subtitle: '숫자 잇기 · 줄과 무리로 손 비우기',
  icon: <Logo size={28} />,
  sections: [
    {
      id: 'goal',
      title: '목표',
      content: (
        <>
          <p>
            손에 든 타일을 모두 테이블에 내려놓으면 이겨요. 타일 {tileTotal(CLASSIC)}장(4색 × 1~13 × 2벌 + 조커 2)으로 각자 {CLASSIC.handSize}장을 들고 시작해요.
          </p>
          <Clip src="guide/play.mp4" caption="타일을 골라 묶음에 옮기고 「내기」" />
        </>
      ),
    },
    {
      id: 'sets',
      title: '묶음 두 가지',
      content: (
        <>
          <div className="g-row">
            <Row tiles={[T(0, 3), T(0, 4), T(0, 5), T(0, 6)]} />
            <span className="g-note">줄: 같은 색, 연속 숫자 3장 이상</span>
          </div>
          <div className="g-row">
            <Row tiles={[T(1, 8), T(2, 8), T(3, 8)]} />
            <span className="g-note">무리: 같은 숫자, 서로 다른 색 3~4장</span>
          </div>
          <div className="g-row">
            <Row tiles={[T(0, 9), { id: 'J', n: 0, color: -1 }, T(0, 11)]} />
            <span className="g-note">☺ 조커는 아무 타일 대신</span>
          </div>
        </>
      ),
    },
    {
      id: 'turn',
      title: '내 차례',
      content: (
        <ul className="g-list">
          <li>
            타일을 <b>1장 이상</b> 테이블에 내요 — 새 묶음을 만들거나 있는 묶음에 붙여요.
          </li>
          <li>낼 게 없으면 더미에서 1장 가져오고 차례를 넘겨요.</li>
        </ul>
      ),
    },
    {
      id: 'first',
      title: '처음 등록',
      content: (
        <p>
          처음 낼 때는 <b>내 손의 타일로만</b> 만든 묶음들의 숫자 합이 {CLASSIC.initialMeld} 이상이어야 해요 (조커는 대신한 숫자로 세요). 등록 전에는 테이블의 묶음을 건드릴 수 없어요.
        </p>
      ),
    },
    {
      id: 'rearrange',
      title: '테이블 다시 짜기',
      content: (
        <ul className="g-list">
          <li>등록한 뒤에는 테이블의 묶음을 나누고, 옮기고, 합쳐도 돼요.</li>
          <li>
            단, 차례가 끝날 때 <b>테이블의 모든 묶음이 맞아야</b> 하고, 테이블에 있던 타일은 손으로 가져올 수 없어요.
          </li>
          <li>예: 빨강 3·4·5·6 줄을 3·4·5와 6으로 나누고, 내 빨강 7·8을 6 뒤에 붙여 6·7·8 줄 만들기.</li>
        </ul>
      ),
    },
    {
      id: 'end',
      title: '끝과 점수',
      content: (
        <ul className="g-list">
          <li>누군가 손을 다 비우면 끝. 다른 사람은 남은 타일 합만큼 감점(조커 30), 이긴 사람은 그 합을 모두 가져가요.</li>
          <li>더미가 바닥나고 아무도 못 내면 남은 합이 가장 적은 사람이 이겨요.</li>
        </ul>
      ),
    },
    {
      id: 'screen',
      title: '화면 사용법',
      content: (
        <ul className="g-list">
          <li>타일을 눌러 고르고(여러 장 가능), 테이블의 묶음이나 「+ 새 묶음」을 누르면 옮겨져요.</li>
          <li>틀린 묶음은 빨간 테두리와 ✕. 모두 맞으면 「내기」가 켜져요.</li>
          <li>「되돌리기」로 처음 상태로, 「손으로」로 내 타일을 다시 손에.</li>
          <li>방금 낸 타일은 노란 테두리로 보여요.</li>
        </ul>
      ),
    },
  ],
};
