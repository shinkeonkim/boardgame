import { type GuideDef } from '@bg/web/guide-kit';
import { DECK } from '@bg/go-stop-engine';
import { HwatuCard, Logo } from './theme';

const card = (id: string) => DECK.find((c) => c.id === id)!;

export const guide: GuideDef = {
  subtitle: '고스톱 · 같은 달 맞추기',
  icon: <Logo size={28} />,
  sections: [
    {
      id: 'cards',
      title: '카드',
      content: (
        <>
          <p>
            열두 달 × 4장. 같은 달끼리 짝이 돼요. 종류는 <b>광</b>, <b>열끗</b>(동물·새), <b>띠</b>, <b>피</b>(쌍피는 2장으로 쳐요).
          </p>
          <div className="g-row center">
            {['1-0', '2-0', '1-1', '6-1', '11-1', '3-2'].map((id) => (
              <HwatuCard key={id} card={card(id)} w={34} />
            ))}
          </div>
        </>
      ),
    },
    {
      id: 'turn',
      title: '차례',
      content: (
        <ol className="g-steps">
          <li>손패 한 장을 내요. 바닥에 같은 달이 있으면 같이 먹어요 (두 장이면 하나를 골라요).</li>
          <li>더미에서 한 장을 뒤집어 같은 달이 있으면 또 먹어요.</li>
          <li>쪽(낸 카드를 뒤집어 바로 먹음) · 따닥 · 싹쓸이면 상대 피를 뺏어요. 뻑이면 세 장이 바닥에 남아요.</li>
        </ol>
      ),
    },
    {
      id: 'score',
      title: '고? 스톱?',
      content: (
        <ul className="g-list">
          <li>광 3장 3점 · 고도리 5점 · 홍단·청단·초단 3점 · 열끗·띠 5장, 피 10장부터 1점씩.</li>
          <li>2명은 7점, 3명은 3점이 나면 「고」(계속, +1점, 3고부터 두 배) 또는 「스톱」(판 끝, 점수를 받아요).</li>
          <li>아무도 못 나고 카드가 떨어지면 나가리.</li>
        </ul>
      ),
    },
  ],
};
