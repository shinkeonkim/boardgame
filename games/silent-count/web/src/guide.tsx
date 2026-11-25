import { type GuideDef } from '@bg/web/guide-kit';
import { Logo, NumCard } from './theme';

export const guide: GuideDef = {
  subtitle: '침묵의 숫자 · 말없이 맞추는 실시간 협력',
  icon: <Logo size={28} />,
  sections: [
    {
      id: 'goal',
      title: '목표',
      content: (
        <>
          <p>
            단계마다 1~100 카드를 단계 수만큼 받아요. 모두의 카드를 <b>작은 순서대로</b> 가운데에 내면 단계 통과. 마지막 단계까지 가면 모두 함께 이겨요.
          </p>
          <div className="g-row center">
            <NumCard n={7} size="sm" />
            <NumCard n={23} size="sm" />
            <NumCard n={58} size="sm" />
            <NumCard n={91} size="sm" />
          </div>
        </>
      ),
    },
    {
      id: 'play',
      title: '내는 법',
      content: (
        <ul className="g-list">
          <li>
            <b>차례가 없어요.</b> 누구든 「지금이다」 싶을 때 「내기」를 누르면 내 가장 낮은 카드가 나가요.
          </li>
          <li>숫자를 말·손짓으로 알려 주면 안 돼요. 오래 기다린 시간이 곧 「내 숫자가 크다」는 신호예요.</li>
          <li>누가 낸 카드보다 작은 카드를 다른 사람이 쥐고 있었다면 생명을 하나 잃고, 그 작은 카드들은 모두 버려요.</li>
        </ul>
      ),
    },
    {
      id: 'star',
      title: '수리검 · 보상',
      content: (
        <ul className="g-list">
          <li>막막하면 「수리검 쓰자」를 눌러요. 카드를 가진 사람이 모두 누르면 각자 가장 낮은 카드를 한 장씩 버려요 (모두에게 공개).</li>
          <li>2·5·8단계를 깨면 수리검, 3·6·9단계를 깨면 생명을 하나 더 받아요.</li>
        </ul>
      ),
    },
  ],
};
