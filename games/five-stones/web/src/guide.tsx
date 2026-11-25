import { type GuideDef } from '@bg/web/guide-kit';
import { Logo, StoneView } from './theme';

export const guide: GuideDef = {
  subtitle: '오목 · 다섯을 먼저 잇기',
  icon: <Logo size={28} />,
  sections: [
    {
      id: 'goal',
      title: '목표',
      content: (
        <>
          <p>
            흑과 백이 번갈아 빈 교차점에 돌을 하나씩 놓아요. 가로·세로·대각선 어느 쪽이든 <b>내 돌 다섯 개를 먼저 한 줄로</b> 이으면 이겨요.
          </p>
          <div className="g-row center">
            {[0, 0, 0, 0, 0].map((s, i) => (
              <StoneView key={i} stone={s as 0} size={30} />
            ))}
          </div>
        </>
      ),
    },
    {
      id: 'turn',
      title: '두는 법',
      content: (
        <ol className="g-steps">
          <li>흑이 먼저 둬요. 여러 판을 하면 판마다 흑백을 바꿔요.</li>
          <li>컴퓨터: 놓을 곳에 마우스를 올리면 흐린 돌이 보이고, 누르면 놓여요.</li>
          <li>폰: 한 번 누르면 미리 보이고, 같은 곳을 한 번 더 누르면 놓여요 (잘못 누르는 걸 막아요).</li>
          <li>방금 둔 돌에는 작은 점이 찍혀요.</li>
        </ol>
      ),
    },
    {
      id: 'tips',
      title: '이기는 요령',
      content: (
        <ul className="g-list">
          <li>
            <b>열린 셋</b>(양쪽이 빈 세 개)은 곧 열린 넷이 돼요. 상대의 열린 셋은 바로 막아요.
          </li>
          <li>
            <b>열린 넷</b>은 양쪽 끝 중 하나만 막을 수 있어서 거의 이긴 거예요.
          </li>
          <li>한 수로 두 갈래(넷과 셋, 셋과 셋)를 동시에 만들면 상대가 다 막을 수 없어요.</li>
        </ul>
      ),
    },
    {
      id: 'custom',
      title: '바꿀 수 있는 규칙',
      content: (
        <ul className="g-list">
          <li>판 크기 13 · 15 · 19줄</li>
          <li>딱 다섯만 승리: 여섯 이상(장목)은 이긴 것으로 치지 않아요</li>
          <li>판 수 1~7판 (흑백 번갈아, 과반을 먼저 이기면 끝)</li>
        </ul>
      ),
    },
  ],
};
