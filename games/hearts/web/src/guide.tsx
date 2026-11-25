import { type GuideDef } from '@bg/web/guide-kit';
import { PlayingCard } from '@bg/ui';
import { Logo } from './theme';

export const guide: GuideDef = {
  subtitle: '하트 · 점수를 피하는 트릭 게임',
  icon: <Logo size={28} />,
  sections: [
    {
      id: 'goal',
      title: '목표',
      content: (
        <>
          <p>
            트릭을 가져가면 그 안의 <b>하트는 1점</b>, <b>스페이드 Q 는 13점</b>이에요. 점수는 <b>적을수록 좋아요</b>. 누가 목표 점수(기본 100점)에 닿으면 끝나고, 가장 낮은 사람이 이겨요.
          </p>
          <div className="g-row center">
            <PlayingCard card={{ id: 'a', suit: 1, rank: 7 }} size="sm" />
            <PlayingCard card={{ id: 'b', suit: 0, rank: 12 }} size="sm" />
          </div>
        </>
      ),
    },
    {
      id: 'pass',
      title: '건네기',
      content: (
        <ol className="g-steps">
          <li>판이 시작되면 카드 3장을 골라 건네요: 왼쪽 → 오른쪽 → 맞은편 → 안 건넴 순서로 돌아가요.</li>
          <li>모두 고르면 한꺼번에 건네지고, 받은 카드에는 잠깐 표시가 붙어요.</li>
        </ol>
      ),
    },
    {
      id: 'play',
      title: '트릭',
      content: (
        <ul className="g-list">
          <li>가장 낮은 클로버를 가진 사람이 그 카드로 시작해요.</li>
          <li>
            처음 낸 무늬가 있으면 <b>반드시 그 무늬</b>를 내요. 없으면 아무 카드나 버릴 수 있어요.
          </li>
          <li>처음 낸 무늬 중 가장 높은 카드(A가 제일 높음)를 낸 사람이 트릭을 가져가고, 다음 트릭을 시작해요.</li>
          <li>하트는 누가 버리기 전까지 먼저 낼 수 없어요. 첫 트릭에는 하트·스페이드 Q 를 버릴 수 없어요.</li>
          <li>낼 수 있는 카드만 밝게 보여요. 폰에서는 한 번 누르면 들리고, 한 번 더 누르면 내요.</li>
        </ul>
      ),
    },
    {
      id: 'moon',
      title: '문 쏘기',
      content: (
        <p>
          하트 13장과 스페이드 Q 를 <b>혼자 모두</b> 먹으면, 나는 0점이고 다른 사람이 모두 26점을 받아요. 위험하지만 한 방이에요.
        </p>
      ),
    },
  ],
};
