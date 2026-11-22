import { Clip, type GuideDef } from '@bg/web/guide-kit';
import { Logo, PlayingCard } from './theme';

const C = (suit: number, rank: number) => ({ id: `${suit}-${rank}`, suit, rank });

export const guide: GuideDef = {
  subtitle: '원카드 · 무늬나 숫자를 맞춰 먼저 다 내기',
  icon: <Logo size={28} />,
  sections: [
    {
      id: 'goal',
      title: '목표',
      content: (
        <>
          <p>
            카드를 7장씩 받아요. 버린 카드와 <b>무늬나 숫자가 같은</b> 카드를 한 장씩 내고, <b>먼저 다 내면</b> 이겨요.
          </p>
          <Clip src="guide/play.mp4" caption="낼 수 있는 카드는 위로 올라와 있어요. 없으면 1장 가져와요" />
        </>
      ),
    },
    {
      id: 'match',
      title: '낼 수 있는 카드',
      content: (
        <>
          <div className="g-row center">
            <PlayingCard card={C(1, 9)} size="sm" />
            <span>→</span>
            <PlayingCard card={C(1, 4)} size="sm" />
            <PlayingCard card={C(3, 9)} size="sm" />
          </div>
          <p>하트 9 위에는 하트(무늬) 또는 9(숫자). 낼 카드가 없으면 더미에서 1장 가져오고 차례가 넘어가요.</p>
        </>
      ),
    },
    {
      id: 'attack',
      title: '공격',
      content: (
        <>
          <div className="g-row center">
            <PlayingCard card={C(2, 2)} size="sm" />
            <PlayingCard card={C(1, 1)} size="sm" />
            <PlayingCard card={C(0, 1)} size="sm" />
            <PlayingCard card={{ id: 'J1', suit: -1, rank: 1 }} size="sm" />
          </div>
          <ul className="g-list">
            <li>2 → 다음 사람 +2장 · A → +3 · ♠A → +5 · 흑백 조커 +5 · 컬러 조커 +7.</li>
            <li>공격을 받으면 같거나 더 센 공격 카드(무늬나 숫자가 맞게, 조커는 언제나)로 막아 다음 사람에게 쌓아 넘기거나, 쌓인 만큼 받아요.</li>
          </ul>
        </>
      ),
    },
    {
      id: 'special',
      title: '특수 카드',
      content: (
        <>
          <div className="g-row center">
            <PlayingCard card={C(0, 7)} size="sm" />
            <PlayingCard card={C(1, 11)} size="sm" />
            <PlayingCard card={C(2, 12)} size="sm" />
            <PlayingCard card={C(3, 13)} size="sm" />
          </div>
          <ul className="g-list">
            <li>7: 무늬 바꾸기 · J: 다음 사람 건너뛰기 · Q: 방향 바꾸기 · K: 한 장 더.</li>
            <li>조커 다음에는 아무 카드나 낼 수 있어요.</li>
          </ul>
        </>
      ),
    },
    {
      id: 'call',
      title: '「원카드!」',
      content: (
        <ul className="g-list">
          <li>한 장이 남으면 5초 안에 「원카드!」를 눌러요.</li>
          <li>다른 사람이 먼저 「잡았다!」를 누르면 2장을 더 가져가요.</li>
        </ul>
      ),
    },
    {
      id: 'end',
      title: '점수',
      content: (
        <ul className="g-list">
          <li>누군가 다 내면 판이 끝나요. 다 낸 사람 0점, 나머지는 남은 장수만큼 감점.</li>
          <li>손에 카드가 20장이 넘으면 파산 (크게 감점).</li>
          <li>「끝까지 순위」로 하면 한 명만 남을 때까지 하고 나간 순서대로 점수.</li>
        </ul>
      ),
    },
    {
      id: 'settings',
      title: '바꿀 수 있는 규칙',
      content: (
        <ul className="g-list">
          <li>처음 카드 4~10장, 조커·공격·7·J·Q·K 하나씩 켜고 끄기</li>
          <li>원카드 외치기 시간·벌칙, 파산 기준, 판 끝 방식, 판 수, 제한시간</li>
        </ul>
      ),
    },
  ],
};
