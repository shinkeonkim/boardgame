import { CLASSIC, tileCount } from '@bg/number-vault-engine';
import { Clip, type GuideDef } from '@bg/web/guide-kit';
import { Logo, TileView } from './theme';

const T = (n: number | null, color: 0 | 1, revealed = false) => ({ n, color, revealed });

export const guide: GuideDef = {
  subtitle: '숫자 금고 · 순서로 추리하기',
  icon: <Logo size={28} />,
  sections: [
    {
      id: 'goal',
      title: '목표',
      content: (
        <>
          <p>
            모두 숫자 타일을 몇 장씩 가려 놓고 시작해요. 다른 사람의 가려진 타일 숫자를 맞혀 하나씩 공개하고, <b>내 타일이 모두 공개되면 탈락</b>이에요. 마지막까지 남은 사람이 이겨요.
          </p>
          <Clip src="guide/play.mp4" caption="타일을 가져오고, 남의 가려진 타일을 골라 숫자를 맞혀요" />
        </>
      ),
    },
    {
      id: 'tiles',
      title: '타일과 순서',
      content: (
        <>
          <div className="g-row center">
            <TileView t={T(2, 0, true)} size="md" />
            <TileView t={T(5, 0, true)} size="md" />
            <TileView t={T(5, 1, true)} size="md" />
            <TileView t={T(9, 1, true)} size="md" />
          </div>
          <ul className="g-list">
            <li>
              검정·하양 0~11 각 12장, 모두 {tileCount(CLASSIC)}장. 2~3명은 4장, 4명은 3장으로 시작해요.
            </li>
            <li>
              타일은 늘 <b>왼쪽부터 오름차순</b>으로 놓여요. 같은 숫자면 <b>검정이 왼쪽</b>. 화면이 자동으로 정렬해 줘요.
            </li>
            <li>
              남에게는 타일의 <b>색만</b> 보여요. 그래서 색과 위치가 큰 단서예요.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: 'turn',
      title: '내 차례',
      content: (
        <ol className="g-steps">
          <li>
            <b>타일 1장 가져오기</b> — 검정이나 하양을 골라요 (더미가 비었으면 건너뛰어요).
          </li>
          <li>
            <b>맞히기</b> — 다른 사람의 가려진 타일 하나를 고르고 숫자를 말해요.
          </li>
          <li>
            <b>맞으면</b> 그 타일이 공개되고, 더 맞히거나 멈출 수 있어요. 멈추면 가져온 타일을 가려진 채 내 줄에 넣어요.
          </li>
          <li>
            <b>틀리면</b> 가져온 타일이 공개된 채 내 줄에 들어가고 차례가 끝나요. 가져온 타일이 없으면 내 타일 하나를 골라 공개해요.
          </li>
        </ol>
      ),
    },
    {
      id: 'deduce',
      title: '추리하는 법',
      content: (
        <>
          <div className="g-row">
            <div className="nv-tiles">
              <TileView t={T(3, 0, true)} size="sm" />
              <TileView t={T(null, 1)} size="sm" selected />
              <TileView t={T(6, 0, true)} size="sm" />
            </div>
            <div className="g-note">
              <span>
                공개된 3(검정)과 6(검정) 사이의 하얀 타일 → <b>3, 4, 5</b> 중 하나예요 (하양 3은 검정 3보다 오른쪽이니 가능). 내가 가진 숫자와 이미 틀린 숫자를 빼면 더 좁혀져요.
              </span>
            </div>
          </div>
          <p className="small muted">틀린 추측은 타일 아래에 줄이 그어진 숫자로 남아요 (설정으로 숨길 수 있어요).</p>
        </>
      ),
    },
    {
      id: 'joker',
      title: '조커 (선택 규칙)',
      content: (
        <ul className="g-list">
          <li>「–」 조커는 순서와 상관없이 내가 고른 자리에 놓아요. 가져오면 놓을 자리를 먼저 정해요.</li>
          <li>남의 조커를 맞히려면 숫자 대신 「–」를 골라요.</li>
          <li>조커가 끼면 순서 추리가 흔들려서 훨씬 헷갈려요.</li>
        </ul>
      ),
    },
    {
      id: 'custom',
      title: '변형',
      content: (
        <ul className="g-list">
          <li>숫자 범위 0~5 ~ 0~15: 작으면 빠르고 쉬워요, 크면 5~6명도 넉넉해요.</li>
          <li>「맞히면 계속」을 끄면 한 번만 맞혀요 (덜 공격적).</li>
          <li>「가져올 색 고르기」를 끄면 무작위로 가져와요.</li>
          <li>여러 판이면 과반을 먼저 이긴 사람이 최종 우승.</li>
        </ul>
      ),
    },
    {
      id: 'screen',
      title: '화면 사용법',
      content: (
        <ul className="g-list">
          <li>다른 사람의 가려진 타일을 누르면 숫자판이 열려요. 숫자를 누르면 바로 맞혀요.</li>
          <li>숫자판에서 줄이 그어진 숫자는 이미 틀린 것, 점선 테두리는 내가 같은 색으로 가진 숫자예요.</li>
          <li>내 타일에서 눈 표시가 있는 건 남에게 가려진 타일이에요.</li>
          <li>봇은 색·순서·틀린 기록으로 후보를 좁혀서 가장 확실한 타일부터 노려요.</li>
        </ul>
      ),
    },
  ],
};
