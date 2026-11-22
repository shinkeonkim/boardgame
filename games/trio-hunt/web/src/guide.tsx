import { Clip, type GuideDef } from '@bg/web/guide-kit';
import { Logo, TrioCard } from './theme';

export const guide: GuideDef = {
  subtitle: '셋 찾기 · 같은 숫자 세 장을 뒤집어 모으기',
  icon: <Logo size={28} />,
  sections: [
    {
      id: 'goal',
      title: '목표',
      content: (
        <>
          <div className="g-row center">
            <TrioCard n={7} />
            <TrioCard n={7} />
            <TrioCard n={7} />
          </div>
          <p>
            1~12 카드가 세 장씩 있어요. 같은 숫자 세 장을 모으면 <b>세트</b>. 세트 3개를 먼저 모으거나, <b>7 세 장</b>을 모으면 바로 이겨요.
          </p>
          <Clip src="guide/play.mp4" caption="양 끝 카드나 가운데 카드를 뒤집어 같은 숫자를 이어 가요" />
        </>
      ),
    },
    {
      id: 'turn',
      title: '내 차례',
      content: (
        <ul className="g-list">
          <li>누군가(나 포함)의 손패에서 <b>가장 작은 카드</b> 또는 <b>가장 큰 카드</b>를, 또는 가운데 카드 한 장을 뒤집어요.</li>
          <li>같은 숫자가 나오면 계속 뒤집어요. 세 장이 모이면 세트를 가져가고 차례가 끝나요.</li>
          <li>다른 숫자가 나오면 차례가 끝나고 카드는 다시 덮여요.</li>
        </ul>
      ),
    },
    {
      id: 'memory',
      title: '기억이 무기',
      content: (
        <>
          <div className="g-row center">
            <TrioCard n={4} size="sm" />
            <TrioCard n={9} size="sm" />
            <TrioCard n={null} faceDown size="sm" />
          </div>
          <ul className="g-list">
            <li>손패는 작은 숫자부터 정렬돼 있어요. 누가 무엇을 가졌는지 뒤집힌 카드로 추리해요.</li>
            <li>틀려서 덮인 카드도 잠깐 위에 보여 줘요 — 기억해 두세요!</li>
          </ul>
        </>
      ),
    },
    {
      id: 'settings',
      title: '바꿀 수 있는 규칙',
      content: (
        <ul className="g-list">
          <li>모을 세트 2~4개, 7 바로 승리 켜고 끄기</li>
          <li>가운데 카드 수 (많을수록 기억력 싸움), 판 수, 제한시간</li>
        </ul>
      ),
    },
  ],
};
