import { ACTION_DEFS, ActionKind, CLASSIC, ROLE_DEFS, ROLES } from '@bg/court-intrigue-engine';
import { Clip, type GuideDef } from '@bg/web/guide-kit';
import { Logo, RoleCard } from './theme';

export const guide: GuideDef = {
  subtitle: '궁정 음모 · 허풍과 도전',
  icon: <Logo size={28} />,
  sections: [
    {
      id: 'goal',
      title: '목표',
      content: (
        <>
          <p>
            모두 카드 2장(영향력)과 금화 {CLASSIC.startCoins}개로 시작해요. 카드를 모두 잃으면 궁정에서 쫓겨나요. <b>마지막까지 남은 사람</b>이 이겨요.
          </p>
          <Clip src="guide/play.mp4" caption="행동을 고르면 다른 사람이 도전하거나 막을 수 있어요" />
        </>
      ),
    },
    {
      id: 'roles',
      title: '역할 5가지',
      content: (
        <div className="sl-guide-cards">
          {ROLES.map((r) => (
            <div key={r} className="sl-guide-card">
              <RoleCard role={r} size="sm" />
              <div className="small">
                <b>{ROLE_DEFS[r].name}</b>
                <div>{ROLE_DEFS[r].action !== '—' ? ROLE_DEFS[r].action : '행동 없음'}</div>
                <div className="muted">{ROLE_DEFS[r].block !== '—' ? `🚫 ${ROLE_DEFS[r].block}` : ''}</div>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'actions',
      title: '내 차례 — 행동 하나',
      content: (
        <ul className="g-list">
          {(Object.keys(ACTION_DEFS) as ActionKind[]).map((a) => (
            <li key={a}>
              <b>{ACTION_DEFS[a].name}</b> — {ACTION_DEFS[a].text}
            </li>
          ))}
          <li>
            금화가 <b>{CLASSIC.mustCoup}개 이상</b>이면 반드시 쿠데타를 해야 해요.
          </li>
        </ul>
      ),
    },
    {
      id: 'bluff',
      title: '허풍과 도전',
      content: (
        <ul className="g-list">
          <li>
            역할 행동(세금·암살·약탈·교환)은 <b>그 카드가 없어도</b> 할 수 있어요. 「나는 재무관이야」라고 주장하는 거예요.
          </li>
          <li>
            다른 사람은 <b>「거짓말!」 도전</b>할 수 있어요.
            <ul>
              <li>진짜였으면 → 도전한 사람이 카드 하나를 잃고, 주장한 사람은 그 카드를 더미에 섞고 새 카드를 받아요.</li>
              <li>거짓이었으면 → 주장한 사람이 카드 하나를 잃고 행동은 취소돼요 (암살 금화는 돌려받아요).</li>
            </ul>
          </li>
          <li>도전할 사람이 없으면 몇 초 뒤 자동으로 넘어가요 (방장이 시간을 정해요).</li>
        </ul>
      ),
    },
    {
      id: 'block',
      title: '막기',
      content: (
        <ul className="g-list">
          <li>원조는 누구나 「재무관」이라고 주장해 막을 수 있어요.</li>
          <li>암살은 대상이 「호위 기사」로, 약탈은 대상이 「약탈자」나 「외교관」으로 막아요.</li>
          <li>막기도 주장이라 도전받을 수 있어요. 막기가 거짓으로 들키면 행동이 그대로 돼요.</li>
        </ul>
      ),
    },
    {
      id: 'lose',
      title: '카드 잃기',
      content: (
        <ul className="g-list">
          <li>카드를 잃을 때는 둘 중 어느 것을 공개할지 내가 골라요. 공개된 카드는 모두가 봐요.</li>
          <li>공개된 카드가 많아질수록 「그 역할은 이제 남은 게 없는데?」 추리가 가능해져요.</li>
        </ul>
      ),
    },
    {
      id: 'custom',
      title: '변형',
      content: (
        <ul className="g-list">
          <li>5~6명이면 역할을 4장씩(20장)으로.</li>
          <li>시작 금화·쿠데타 비용·반드시 쿠데타·암살 비용·약탈량을 바꿔 판의 속도를 조절해요.</li>
          <li>도전·막기 대기 시간: 5~40초.</li>
        </ul>
      ),
    },
    {
      id: 'screen',
      title: '화면 사용법',
      content: (
        <ul className="g-list">
          <li>행동 버튼에 필요한 역할이 적혀 있어요. 그 카드가 없으면 「허풍」 표시가 붙어요.</li>
          <li>도전·막기 창에서는 「도전!」·「막기」·「통과」 버튼이 떠요. 이미 통과한 사람은 ✓.</li>
          <li>봇은 공개된 카드를 세서 거짓말 확률을 계산해요. 어려움은 허풍도 섞어요.</li>
        </ul>
      ),
    },
  ],
};
