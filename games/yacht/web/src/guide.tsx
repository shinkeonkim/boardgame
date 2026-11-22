import { Clip, type GuideDef } from '@bg/web/guide-kit';
import { CAT_INFO, Die, Logo } from './theme';

const Row = ({ dice, held }: { dice: number[]; held?: boolean[] }) => (
  <div className="g-row center">
    {dice.map((d, i) => (
      <Die key={i} face={d} size={34} held={held?.[i]} />
    ))}
  </div>
);

export const guide: GuideDef = {
  subtitle: '요트 다이스 · 주사위 5개로 족보 채우기',
  icon: <Logo size={28} />,
  sections: [
    {
      id: 'goal',
      title: '목표',
      content: (
        <>
          <p>
            차례마다 주사위 5개를 <b>최대 3번</b> 굴려 점수표의 칸을 하나씩 채워요. 모든 칸을 채웠을 때 <b>합계가 가장 높은 사람</b>이 이겨요.
          </p>
          <Clip src="guide/play.mp4" caption="남길 주사위를 누르고 다시 굴린 뒤, 점수표에서 칸을 골라 적어요" />
        </>
      ),
    },
    {
      id: 'turn',
      title: '한 차례',
      content: (
        <>
          <Row dice={[5, 5, 2, 5, 3]} held={[true, true, false, true, false]} />
          <ul className="g-list">
            <li>「주사위 굴리기」로 5개를 굴려요.</li>
            <li>남기고 싶은 주사위를 누르면 위로 올라가요. 나머지만 다시 굴려요 (최대 3번).</li>
            <li>언제든 점수표의 빈 칸을 눌러 적으면 차례가 끝나요. 칸에 보이는 숫자가 지금 적을 점수예요.</li>
            <li>점수가 안 나는 칸이라도 하나는 꼭 채워야 해요 (0점).</li>
          </ul>
        </>
      ),
    },
    {
      id: 'upper',
      title: '위쪽: 1~6',
      content: (
        <>
          <Row dice={[4, 4, 4, 1, 6]} />
          <p>
            그 눈이 나온 주사위의 합이에요. 위 주사위를 <b>4</b> 칸에 적으면 12점. 1~6 칸의 합이 <b>63점</b>(각 눈 3개씩) 이상이면 <b>보너스 +35</b>.
          </p>
        </>
      ),
    },
    {
      id: 'lower',
      title: '아래쪽 족보',
      content: (
        <ul className="g-list">
          {(['choice', 'fourKind', 'fullHouse', 'smallStraight', 'largeStraight', 'yacht'] as const).map((c) => (
            <li key={c}>
              <b>{CAT_INFO[c].name}</b> — {CAT_INFO[c].hint}
            </li>
          ))}
          <li>기본 요트에서 포카드·풀하우스는 주사위 5개의 합, 스몰 스트레이트 15점, 라지 스트레이트 30점이에요.</li>
        </ul>
      ),
    },
    {
      id: 'yacht',
      title: '요트!',
      content: (
        <>
          <Row dice={[3, 3, 3, 3, 3]} />
          <p>
            다섯 개가 모두 같으면 <b>요트 50점</b>. 확장 족보에서는 요트 칸을 50점으로 채운 뒤 또 요트가 나오면 <b>+100</b>을 더 받아요.
          </p>
        </>
      ),
    },
    {
      id: 'tips',
      title: '요령',
      content: (
        <ul className="g-list">
          <li>초반엔 보너스를 노려 위쪽 칸에 3개 이상을 모아요.</li>
          <li>운이 나쁜 차례는 「초이스」나 쓸모없는 칸에 버려요.</li>
          <li>요트·라지 스트레이트를 0으로 버리는 건 마지막 수단.</li>
        </ul>
      ),
    },
    {
      id: 'settings',
      title: '바꿀 수 있는 규칙',
      content: (
        <ul className="g-list">
          <li>족보: 기본 요트(12칸) / 확장(트리플 추가 · 풀하우스 25 · 스트레이트 30/40 · 추가 요트 +100)</li>
          <li>굴리기 횟수 1~5번, 보너스 기준·점수</li>
          <li>진행: 한 명씩 / 모두 동시에 (각자 점수표를 한꺼번에)</li>
          <li>게임 수, 차례 제한시간 · 혼자서 연습하거나 봇과</li>
        </ul>
      ),
    },
    {
      id: 'screen',
      title: '화면 사용법',
      content: (
        <ul className="g-list">
          <li>가운데: 지금 굴리는 주사위. 내 차례면 눌러서 남기기.</li>
          <li>아래 점수표: 내 열에 적을 수 있는 점수가 점선으로 보여요. 가장 높은 칸은 진하게.</li>
          <li>보너스 줄의 막대가 위쪽 합이 63에 얼마나 가까운지 보여 줘요.</li>
        </ul>
      ),
    },
  ],
};
