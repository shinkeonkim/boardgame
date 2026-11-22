import { Clip, type GuideDef } from '@bg/web/guide-kit';
import { Logo, SAMPLE, Sketch } from './theme';

export const guide: GuideDef = {
  subtitle: '그림 퀴즈 · 그리고 맞히는 파티 게임',
  icon: <Logo size={28} />,
  sections: [
    {
      id: 'goal',
      title: '목표',
      content: (
        <>
          <div className="g-row center" style={{ maxWidth: 260, margin: '0 auto' }}>
            <Sketch strokes={SAMPLE} />
          </div>
          <p>
            차례대로 한 명이 단어를 <b>그림으로</b> 그리고, 나머지는 채팅으로 <b>맞혀요</b>. 모두 한 번씩(또는 설정한 만큼) 그리면 점수가 가장 높은 사람이 이겨요.
          </p>
          <Clip src="guide/play.mp4" caption="단어를 고르고 그리면, 다른 사람이 답을 적어 맞혀요" />
        </>
      ),
    },
    {
      id: 'draw',
      title: '그리는 사람',
      content: (
        <ul className="g-list">
          <li>보기 중 하나를 골라 제한시간 안에 그려요. 색·굵기·지우개·되돌리기를 쓸 수 있어요.</li>
          <li>글자나 숫자를 쓰면 반칙이에요!</li>
          <li>맞힌 사람마다 +3점, 모두 맞히면 +2점 더. 너무 어려우면 넘길 수 있어요.</li>
        </ul>
      ),
    },
    {
      id: 'guess',
      title: '맞히는 사람',
      content: (
        <ul className="g-list">
          <li>답을 적고 Enter. 틀린 답은 모두에게 보여요 — 힌트가 되기도 해요.</li>
          <li>먼저 맞힐수록 점수가 커요: 10 · 8 · 6 · 5 · 4 · 3…</li>
          <li>한 글자만 틀리면 「아깝다!」라고 알려 줘요. 정답을 품은 말은 가려져요.</li>
          <li>시간이 지나면 <b>초성</b>, 더 지나면 <b>한 글자</b>가 힌트로 나와요.</li>
        </ul>
      ),
    },
    {
      id: 'settings',
      title: '바꿀 수 있는 규칙',
      content: (
        <ul className="g-list">
          <li>그리는 횟수, 그리는 시간, 고를 단어 수, 힌트 켜고 끄기</li>
          <li>단어 묶음 — 방장이 우리끼리 단어를 직접 넣을 수도 있어요</li>
        </ul>
      ),
    },
  ],
};
