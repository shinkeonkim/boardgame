import { CARDS, NOBLES } from '@bg/gem-guild-engine';
import { Clip, type GuideDef } from '@bg/web/guide-kit';
import { DevCardView, GEM_INFO, GemToken, Logo, NobleView } from './theme';

export const guide: GuideDef = {
  subtitle: '보석 상단 · 보석으로 카드를, 카드로 더 많은 카드를',
  icon: <Logo size={28} />,
  sections: [
    {
      id: 'goal',
      title: '목표',
      content: (
        <>
          <p>
            보석으로 개발 카드를 사서 점수를 모아요. 누군가 <b>15점</b>에 닿으면 그 바퀴까지 하고, 점수가 가장 높은 사람이 이겨요 (같으면 카드를 덜 산 쪽).
          </p>
          <Clip src="guide/play.mp4" caption="보석을 고르고, 카드를 사거나 예약해요" />
        </>
      ),
    },
    {
      id: 'gems',
      title: '보석',
      content: (
        <>
          <div className="g-row center">
            {GEM_INFO.map((_, i) => (
              <GemToken key={i} gem={i} size={30} />
            ))}
          </div>
          <p className="small">다이아몬드·사파이어·에메랄드·루비·오닉스 5색 + 황금(조커). 황금은 카드를 예약할 때만 받아요.</p>
        </>
      ),
    },
    {
      id: 'turn',
      title: '내 차례 — 넷 중 하나',
      content: (
        <ol className="g-steps">
          <li>
            <b>서로 다른 색 보석 3개</b>를 가져와요.
          </li>
          <li>
            <b>같은 색 2개</b> — 그 색이 4개 이상 남았을 때만.
          </li>
          <li>
            <b>카드 예약</b> — 시장 카드나 더미 맨 위를 내 손에 두고 황금 1개를 받아요 (3장까지).
          </li>
          <li>
            <b>카드 사기</b> — 시장이나 예약한 카드를 보석으로 사요. 모자란 만큼 황금으로 대신.
          </li>
        </ol>
      ),
    },
    {
      id: 'cards',
      title: '개발 카드와 보너스',
      content: (
        <>
          <div className="g-row center">
            <DevCardView card={CARDS.find((c) => c.tier === 1)!} />
            <DevCardView card={CARDS.find((c) => c.tier === 2)!} />
            <DevCardView card={CARDS.find((c) => c.tier === 3)!} />
          </div>
          <ul className="g-list">
            <li>왼쪽 위 숫자는 점수, 오른쪽 위 보석은 <b>보너스</b>예요. 아래 동그라미가 가격.</li>
            <li>
              산 카드의 보너스는 그 색 보석 <b>1개를 영원히 할인</b>해 줘요. 보너스가 많아지면 공짜로 살 수도 있어요.
            </li>
            <li>1단계(싸고 점수 적음) · 2단계 · 3단계(비싸고 점수 큼). 시장에 단계마다 4장씩 펼쳐져요.</li>
          </ul>
        </>
      ),
    },
    {
      id: 'nobles',
      title: '귀족',
      content: (
        <>
          <div className="g-row center">
            <NobleView noble={NOBLES[0]} />
            <NobleView noble={NOBLES[5]} />
          </div>
          <p className="small">귀족이 원하는 만큼 <b>카드 보너스</b>를 모으면 차례가 끝날 때 귀족이 찾아와요 (+3점, 행동을 쓰지 않음). 여럿이면 하나를 골라요.</p>
        </>
      ),
    },
    {
      id: 'limits',
      title: '한도',
      content: (
        <ul className="g-list">
          <li>보석은 황금 포함 10개까지. 넘으면 차례 끝에 골라서 버려요.</li>
          <li>예약은 3장까지. 남이 노리는 카드를 예약해 막을 수도 있어요.</li>
        </ul>
      ),
    },
    {
      id: 'custom',
      title: '변형',
      content: (
        <ul className="g-list">
          <li>목표 점수 8~25, 귀족 수(또는 없음), 보석 수·황금·한도, 시장 카드 수, 예약 한도를 바꿀 수 있어요.</li>
          <li>카드 90장과 귀족 10명은 이 사이트에서 직접 설계한 세트예요.</li>
        </ul>
      ),
    },
    {
      id: 'screen',
      title: '화면 사용법',
      content: (
        <ul className="g-list">
          <li>보석 은행에서 색을 누르면 골라져요. 같은 색을 한 번 더 누르면 2개. 「가져오기」로 확정.</li>
          <li>카드를 누르면 「사기」·「예약하기」가 떠요. 지금 살 수 있는 카드는 초록 테두리.</li>
          <li>「내 상단」의 +숫자가 카드 보너스(영구 할인)예요.</li>
        </ul>
      ),
    },
  ],
};
