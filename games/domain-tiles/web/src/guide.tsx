import { type GuideDef } from '@bg/web/guide-kit';
import { DominoView, Logo } from './theme';

export const guide: GuideDef = {
  subtitle: '영지 도미노 · 땅을 이어 왕국 짓기',
  icon: <Logo size={28} />,
  sections: [
    {
      id: 'goal',
      title: '목표',
      content: (
        <>
          <p>
            땅 도미노로 내 왕국을 지어요. 끝나면 <b>같은 땅으로 이어진 구역마다 칸 수 × 왕관 수</b>가 점수예요. 왕관이 없는 구역은 아무리 커도 0점!
          </p>
          <div className="g-row center">
            <DominoView d={{ id: 12, a: { t: 'water', crowns: 1 }, b: { t: 'water', crowns: 0 } }} size={30} />
            <DominoView d={{ id: 44, a: { t: 'wheat', crowns: 0 }, b: { t: 'mine', crowns: 2 } }} size={30} />
          </div>
        </>
      ),
    },
    {
      id: 'turn',
      title: '차례',
      content: (
        <ol className="g-steps">
          <li>지금 줄에서 내가 고른 도미노를 왕국에 놓아요.</li>
          <li>그다음 다음 줄에서 도미노 하나를 골라요. 번호가 작을수록 다음에 먼저 둬요 (대신 왕관이 적어요).</li>
          <li>지금 줄의 도미노를 위에서부터 차례로 — 줄이 끝나면 다음 줄이 지금 줄이 돼요.</li>
        </ol>
      ),
    },
    {
      id: 'place',
      title: '놓는 법',
      content: (
        <ul className="g-list">
          <li>한 칸 이상이 성이나 같은 땅에 닿아야 해요 (성은 어떤 땅과도 닿을 수 있어요).</li>
          <li>왕국은 5×5 를 넘을 수 없어요. 놓을 곳이 없으면 버려요.</li>
          <li>화면: 먼저 놓을 칸을 누르고 → 이어 놓을 옆 칸을 눌러요. 「반대로」를 누르면 뒤 칸부터 놓아요.</li>
        </ul>
      ),
    },
  ],
};
