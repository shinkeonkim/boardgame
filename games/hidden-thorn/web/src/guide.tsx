import { Clip, type GuideDef } from '@bg/web/guide-kit';
import { DiscView, Logo } from './theme';

export const guide: GuideDef = {
  subtitle: '숨은 가시 · 장미 사이의 함정',
  icon: <Logo size={28} />,
  sections: [
    {
      id: 'goal',
      title: '목표',
      content: (
        <>
          <p>
            모두 장미 3개와 가시 1개를 가지고 시작해요. 「장미를 몇 장 뒤집을 수 있다」는 도전에 <b>두 번 성공</b>하거나, 마지막까지 원판이 남으면 이겨요.
          </p>
          <div className="g-row center">
            <DiscView disc="rose" size={36} />
            <DiscView disc="rose" size={36} />
            <DiscView disc="rose" size={36} />
            <DiscView disc="thorn" size={36} />
          </div>
          <Clip src="guide/play.mp4" caption="원판을 놓고, 부르고, 뒤집어요" />
        </>
      ),
    },
    {
      id: 'place',
      title: '원판 놓기',
      content: (
        <ol className="g-steps">
          <li>판이 시작되면 모두 동시에 원판 1장을 내 앞에 몰래 놓아요.</li>
          <li>그다음 차례대로: 원판을 <b>한 장 더 놓거나</b>, <b>도전</b>을 시작해요.</li>
          <li>남에게는 원판의 뒷면만 보여요. 내 원판은 나만 알아요.</li>
        </ol>
      ),
    },
    {
      id: 'bid',
      title: '도전 — 부르기',
      content: (
        <ul className="g-list">
          <li>「장미 N장 뒤집을게」라고 불러요 (깔린 원판 수까지).</li>
          <li>다음 사람부터 차례로 <b>더 높게 부르거나 포기</b>해요. 포기한 사람은 이번 도전에서 빠져요.</li>
          <li>모두 포기하거나 깔린 원판 수만큼 부르면, 가장 높게 부른 사람이 뒤집어요.</li>
        </ul>
      ),
    },
    {
      id: 'flip',
      title: '뒤집기',
      content: (
        <ul className="g-list">
          <li>
            <b>자기 원판부터</b> 위에서 모두 뒤집어요 (자동). 그래서 내 더미에 가시를 깔았다면 도전에서 이기면 안 돼요!
          </li>
          <li>그다음 남은 수만큼 다른 사람 더미의 맨 위부터 하나씩 골라 뒤집어요.</li>
          <li>
            부른 만큼 모두 장미면 <b>성공</b>. 중간에 가시가 나오면 <b>실패</b>로 원판 하나를 잃어요.
          </li>
        </ul>
      ),
    },
    {
      id: 'lose',
      title: '원판 잃기',
      content: (
        <ul className="g-list">
          <li>남의 가시에 찔리면 내 원판 하나를 무작위로 잃어요 (가시를 잃을 수도).</li>
          <li>내 가시에 찔리면 잃을 원판을 내가 골라요.</li>
          <li>원판을 모두 잃으면 탈락. 실패한 사람이 다음 판을 시작해요.</li>
        </ul>
      ),
    },
    {
      id: 'tips',
      title: '눈치 요령',
      content: (
        <ul className="g-list">
          <li>높게 부르는 사람은 보통 장미만 깔았어요 — 그 사람 더미가 안전해요.</li>
          <li>가시를 깔아 두고 일부러 높게 불러 남이 도전하게 만드는 허풍도 좋아요.</li>
          <li>봇(어려움)은 누가 불렀는지 기억해 안전한 더미부터 뒤집어요.</li>
        </ul>
      ),
    },
    {
      id: 'custom',
      title: '변형',
      content: (
        <ul className="g-list">
          <li>장미 2~5개, 가시 1~2개, 우승까지 1~4번.</li>
          <li>잃는 방식: 자기 가시면 고르기 / 남의 가시면 무작위 — 둘 다 켜고 끌 수 있어요.</li>
        </ul>
      ),
    },
  ],
};
