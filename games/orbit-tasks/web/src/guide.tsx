import { type GuideDef } from '@bg/web/guide-kit';
import { Logo, SignalMark, SpaceCard } from './theme';

export const guide: GuideDef = {
  subtitle: '궤도 임무 · 말없이 하는 협력 트릭 게임',
  icon: <Logo size={28} />,
  sections: [
    {
      id: 'goal',
      title: '목표',
      content: (
        <>
          <p>
            모두 한 팀이에요. 임무마다 공개되는 <b>과제 카드</b>를 각자 맡고, 맡은 사람이 그 카드가 든 트릭을 가져가면 과제 성공. 과제를 모두 해내면 임무 성공이에요.
          </p>
          <div className="g-row center">
            <SpaceCard card={{ id: 'a', suit: 1, rank: 7 }} size="sm" />
            <SpaceCard card={{ id: 'b', suit: 4, rank: 4 }} size="sm" />
          </div>
        </>
      ),
    },
    {
      id: 'draft',
      title: '과제 고르기',
      content: (
        <ol className="g-steps">
          <li>로켓 4를 가진 사람이 대장이에요. 대장부터 차례로 과제를 하나씩 맡아요.</li>
          <li>내가 그 색의 높은 카드나 로켓을 가졌다면 맡기 좋아요.</li>
          <li>순서 번호가 붙은 과제는 1번부터 차례로 해내야 해요.</li>
        </ol>
      ),
    },
    {
      id: 'play',
      title: '트릭',
      content: (
        <ul className="g-list">
          <li>대장이 먼저 내요. 처음 낸 색이 있으면 그 색을 내야 해요.</li>
          <li>
            처음 낸 색 중 가장 높은 숫자가 가져가요. <b>로켓</b>은 어느 색이든 이기는 으뜸이에요.
          </li>
          <li>과제 카드를 맡지 않은 사람이 가져가면 바로 임무 실패예요.</li>
        </ul>
      ),
    },
    {
      id: 'signal',
      title: '신호',
      content: (
        <>
          <p>패를 말로 알려 줄 수 없어요. 대신 임무마다 한 번, 트릭 사이에 손패 한 장을 보여 주며 이렇게만 알려요.</p>
          <div className="g-row center">
            <SignalMark kind="top" />
            <SignalMark kind="bottom" />
            <SignalMark kind="only" />
          </div>
          <p className="small muted">그 색에서 가장 높은 카드·가장 낮은 카드·하나뿐인 카드만 알릴 수 있어요. 로켓은 안 돼요.</p>
        </>
      ),
    },
  ],
};
