import { Clip, type GuideDef } from '@bg/web/guide-kit';
import { FlagIcon, Logo, Troop } from './theme';

const Row = ({ cards, label }: { cards: [number, number][]; label: string }) => (
  <div className="fl-g-row">
    {cards.map(([c, v], i) => (
      <Troop key={i} color={c} value={v} size="xs" />
    ))}
    <span className="small">{label}</span>
  </div>
);

export const guide: GuideDef = {
  subtitle: '깃발 전선 · 카드 대형으로 겨루는 진지전',
  icon: <Logo size={28} />,
  sections: [
    {
      id: 'goal',
      title: '목표',
      content: (
        <>
          <p>
            두 사람(편) 사이에 깃발 9개가 있어요. 깃발마다 내 쪽에 카드 3장으로 대형을 만들어 상대보다 강하면 그 깃발을 차지해요. <b>깃발 5개</b> 또는 <b>나란히 3개</b>를 먼저 가지면 승리.
          </p>
          <Clip src="guide/play.mp4" caption="카드를 고르고 깃발을 눌러 놓아요" />
        </>
      ),
    },
    {
      id: 'turn',
      title: '내 차례',
      content: (
        <ol className="g-steps">
          <li>손패(7장)에서 1장을 골라 깃발 하나의 <b>내 쪽</b>에 놓아요. 한쪽에 3장까지.</li>
          <li>더미에서 1장을 뽑아요.</li>
          <li>상대가 남은 카드로 <b>절대 이길 수 없는</b> 깃발은 차지해요 (자동 또는 「차지」 버튼).</li>
        </ol>
      ),
    },
    {
      id: 'formations',
      title: '대형 (강한 순)',
      content: (
        <>
          <Row cards={[[3, 4], [3, 5], [3, 6]]} label="쐐기 — 같은 색 연속" />
          <Row cards={[[0, 7], [2, 7], [4, 7]]} label="방진 — 같은 숫자" />
          <Row cards={[[1, 2], [1, 6], [1, 9]]} label="대대 — 같은 색" />
          <Row cards={[[0, 5], [3, 6], [2, 7]]} label="산개 — 연속 숫자" />
          <Row cards={[[0, 1], [5, 4], [2, 10]]} label="무리 — 아무거나" />
          <p className="small muted">같은 대형이면 숫자 합이 큰 쪽, 그것도 같으면 먼저 완성한 쪽이 이겨요.</p>
        </>
      ),
    },
    {
      id: 'claim',
      title: '깃발 차지하기',
      content: (
        <ul className="g-list">
          <li>내 대형이 완성되었고, 상대 쪽이 덜 놓였더라도 <b>보드에 나오지 않은 카드</b>로 만들 수 있는 어떤 대형도 내 것을 못 넘으면 바로 차지할 수 있어요.</li>
          <li>
            그래서 카드를 놓는 순서가 중요해요. 상대가 필요한 카드를 먼저 써 버리면 상대의 가능성이 사라져요.
          </li>
          <li>
            <FlagIcon owner={0} size={16} /> 차지한 깃발은 색이 바뀌고 더 이상 카드를 놓을 수 없어요.
          </li>
        </ul>
      ),
    },
    {
      id: 'teams',
      title: '2:2 팀전',
      content: (
        <ul className="g-list">
          <li>4명이면 1·3번째가 한 편, 2·4번째가 한 편이에요. 같은 편은 같은 쪽에 놓고 각자 손패를 가져요.</li>
          <li>차례는 번갈아: 빨강 → 파랑 → 빨강 → 파랑.</li>
        </ul>
      ),
    },
    {
      id: 'custom',
      title: '변형',
      content: (
        <ul className="g-list">
          <li>깃발 5~11개, 대형 2~4장, 색 4~6, 숫자 1~8 ~ 1~12, 손패 5~9장.</li>
          <li>이기는 깃발 수, 연속 깃발 조건을 바꾸거나 끌 수 있어요.</li>
          <li>「자동 차지」를 끄면 원작처럼 직접 「차지」를 눌러야 해요.</li>
        </ul>
      ),
    },
  ],
};
