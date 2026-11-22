import { Clip, type GuideDef } from '@bg/web/guide-kit';
import { Icon } from '@bg/ui';
import { Logo, RoleCard, TokenCard } from './theme';

export const guide: GuideDef = {
  subtitle: '비밀 원정대 · 숨은 첩자 찾기',
  icon: <Logo size={28} />,
  sections: [
    {
      id: 'goal',
      title: '목표',
      content: (
        <>
          <div className="g-row center">
            <RoleCard role="agent" size="sm" />
            <RoleCard role="spy" size="sm" />
          </div>
          <p>
            비밀 역할을 받아요. <b>요원</b>은 원정 5번 중 3번 성공, <b>첩자</b>는 3번 실패시키면 이겨요. 첩자는 서로를 알지만 요원은 누가 첩자인지 몰라요.
          </p>
          <Clip src="guide/play.mp4" caption="대장이 원정대를 고르고, 모두 투표한 뒤, 원정대만 몰래 카드를 내요" />
        </>
      ),
    },
    {
      id: 'round',
      title: '한 번의 원정',
      content: (
        <ul className="g-list">
          <li>
            <b>대장</b>(<Icon name="crown" />)이 정해진 수만큼 원정대를 골라요. 이야기하며 설득하세요.
          </li>
          <li>모두 동시에 찬성·반대. 과반이 찬성하면 출발, 아니면 대장이 다음 사람에게 넘어가요.</li>
          <li>
            연속으로 <b>5번 부결</b>되면 첩자가 이겨요.
          </li>
        </ul>
      ),
    },
    {
      id: 'mission',
      title: '원정 카드',
      content: (
        <>
          <div className="g-row center">
            <TokenCard kind="success" />
            <TokenCard kind="fail" />
          </div>
          <ul className="g-list">
            <li>원정대만 몰래 카드를 내요. 요원은 성공만, 첩자는 성공이나 실패를 골라요.</li>
            <li>실패 카드가 1장이라도 있으면 실패 (7명 이상 4번째 원정은 2장이 필요). 누가 냈는지는 아무도 몰라요.</li>
          </ul>
        </>
      ),
    },
    {
      id: 'roles',
      title: '특수 역할 (설정)',
      content: (
        <>
          <div className="g-row center">
            <RoleCard role="seer" size="sm" />
            <RoleCard role="hunter" size="sm" />
          </div>
          <ul className="g-list">
            <li>
              <b>예언자</b>: 첩자를 알아요. 요원이 3번 성공해도 <b>그림자 사냥꾼</b>이 예언자를 맞히면 첩자 승.
            </li>
            <li>
              <b>호위무사</b>: 예언자 후보가 보여요. <b>가짜 예언자</b>(첩자)가 함께 보여 헷갈려요.
            </li>
            <li>
              <b>숨은 우두머리</b>: 예언자에게 안 보이는 첩자. <b>외톨이 첩자</b>: 다른 첩자와 서로 몰라요.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: 'sizes',
      title: '인원별',
      content: (
        <ul className="g-list">
          <li>5명: 첩자 2 · 원정대 2-3-2-3-3</li>
          <li>6명: 첩자 2 · 2-3-4-3-4</li>
          <li>7명: 첩자 3 · 2-3-3-4-4 (4번째는 실패 2장)</li>
          <li>8~10명: 첩자 3·3·4 · 3-4-4-5-5 (4번째는 실패 2장)</li>
          <li>5명보다 적으면 봇으로 채워요.</li>
        </ul>
      ),
    },
    {
      id: 'tips',
      title: '요령',
      content: (
        <ul className="g-list">
          <li>실패한 원정대에 있던 사람, 그 원정대에 찬성한 사람을 기억하세요 (오른쪽 기록).</li>
          <li>첩자라면: 너무 일찍 실패를 내면 들켜요.</li>
          <li>이 게임은 대화가 반이에요 — 같은 방에서, 또는 통화하며 하세요.</li>
        </ul>
      ),
    },
    {
      id: 'screen',
      title: '화면 사용법',
      content: (
        <ul className="g-list">
          <li>원탁: 대장 <Icon name="crown" />, 원정대 파란 배지, 투표 후 찬성/반대 공개. 내가 아는 첩자·예언자 후보는 나에게만 표시.</li>
          <li>내 역할 카드는 눌러서 가릴 수 있어요 (옆 사람이 볼 때).</li>
          <li>오른쪽: 원정대 기록 — 누가 고르고 누가 찬성했는지.</li>
        </ul>
      ),
    },
  ],
};
