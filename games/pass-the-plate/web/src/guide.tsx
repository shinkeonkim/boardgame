import { DISH, Dish } from '@bg/pass-the-plate-engine';
import { Icon } from '@bg/ui';
import { Clip, type GuideDef } from '@bg/web/guide-kit';
import { DishCard, Logo } from './theme';

const ALL = Object.keys(DISH) as Dish[];

export const guide: GuideDef = {
  subtitle: '접시 돌리기 · 동시에 고르는 요리 모으기',
  icon: <Logo size={28} />,
  sections: [
    {
      id: 'goal',
      title: '목표',
      content: (
        <>
          <p>3판 동안 요리 접시를 모아 점수를 내요. 세트를 완성하고, 김밥 줄 수 경쟁에서 이기고, 마지막에 푸딩을 챙기면 1등!</p>
          <Clip src="guide/play.mp4" caption="한 접시를 고르면 모두 동시에 공개되고 손패가 옆으로 넘어가요" />
        </>
      ),
    },
    {
      id: 'turn',
      title: '한 번 고르기',
      content: (
        <ol className="g-steps">
          <li>손에 든 접시 중 1장을 몰래 골라요. 모두 동시에.</li>
          <li>모두 고르면 공개되어 내 앞에 놓여요.</li>
          <li>
            남은 손패는 <b>옆 사람에게 넘기고</b>, 옆 사람의 손패를 받아요.
          </li>
          <li>손패가 다 떨어지면 판 끝 — 점수를 계산하고 앞의 접시는 치워요 (푸딩만 남아요).</li>
        </ol>
      ),
    },
    {
      id: 'dishes',
      title: '요리와 점수',
      content: (
        <div className="sl-guide-cards">
          {ALL.filter((d) => d !== 'maki1' && d !== 'maki3').map((d) => (
            <div key={d} className="sl-guide-card">
              <DishCard dish={d} size="sm" />
              <div className="small">
                <b>{d === 'maki2' ? '김밥 (1·2·3줄)' : DISH[d].name}</b>
                <div>{DISH[d].hint}</div>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'special',
      title: '겨자·젓가락',
      content: (
        <ul className="g-list">
          <li>
            <b>겨자</b>를 먼저 깔아 두면 다음에 먹는 <b>초밥 점수가 3배</b>예요 (겨자 하나에 초밥 하나).
          </li>
          <li>
            <b>젓가락</b>을 먹어 두면 나중 차례에 <b>2장을 한 번에</b> 고를 수 있어요. 쓴 젓가락은 손패에 넣어 다음 사람에게 넘겨요.
          </li>
        </ul>
      ),
    },
    {
      id: 'end',
      title: '게임 끝',
      content: (
        <ul className="g-list">
          <li>3판 점수를 더하고, 마지막에 푸딩: 가장 많이 모은 사람 +6, 가장 적은 사람 −6 (2명이면 감점 없음). 동점이면 나눠요.</li>
          <li>합계가 가장 높은 사람이 이겨요.</li>
        </ul>
      ),
    },
    {
      id: 'custom',
      title: '메뉴 바꾸기',
      content: (
        <ul className="g-list">
          <li>방장이 요리 묶음을 켜고 끌 수 있어요 — 처음 하는 사람과는 젓가락·겨자를 빼요.</li>
          <li>판 수 1~5, 손패 장수, 넘기는 방향(판마다 바꾸기)을 바꿀 수 있어요.</li>
          <li>6~8명이면 요리를 두 벌 이상 섞어요 (자동).</li>
        </ul>
      ),
    },
    {
      id: 'screen',
      title: '화면 사용법',
      content: (
        <ul className="g-list">
          <li>접시를 누르면 바로 골라져요. 공개 전에는 다른 접시로 바꿀 수 있어요.</li>
          <li>젓가락이 있으면 「<Icon name="chopsticks" /> 젓가락으로 2장」을 켜고 두 접시를 차례로 눌러요.</li>
          <li>「내가 먹은 접시」 옆 점수는 이번 판 지금까지(김밥은 지금 순위 기준)예요.</li>
          <li>오른쪽 목록에서 다른 사람이 무엇을 모으는지 보고 가로챌 수 있어요 — 어려움 봇이 그렇게 해요.</li>
        </ul>
      ),
    },
  ],
};
