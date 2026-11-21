import { Clip, type GuideDef } from '@bg/web/guide-kit';
import { Cup, Die, Logo } from './theme';

export const guide: GuideDef = {
  subtitle: '허풍 주사위 · 컵 속 주사위 눈치 싸움',
  icon: <Logo size={28} />,
  sections: [
    {
      id: 'goal',
      title: '목표',
      content: (
        <>
          <p>
            모두 주사위 5개를 컵에 넣고 굴려요. 내 주사위는 나만 봐요. 호가가 틀린 쪽이 주사위를 하나씩 잃고, <b>마지막까지 주사위가 남은 사람</b>이 이겨요.
          </p>
          <Clip src="guide/play.mp4" caption="숫자와 개수를 골라 걸고, 거짓말이면 모두의 주사위를 공개해 세요" />
        </>
      ),
    },
    {
      id: 'bid',
      title: '호가 부르기',
      content: (
        <>
          <div className="g-row">
            <span className="g-note">
              「<b>4가 4개 이상</b>」 = 모든 사람의 주사위를 합치면 4가 적어도 4개는 있다는 뜻이에요.
            </span>
          </div>
          <ul className="g-list">
            <li>다음 사람은 더 높게 걸어야 해요: 개수를 늘리거나, 같은 개수면 더 큰 숫자.</li>
            <li>예: 「4가 4개」 다음에는 「5가 4개」, 「6이 4개」, 「2가 5개」… 가능.</li>
            <li>내 주사위를 보고 어림해요. 주사위가 많을수록 큰 개수도 그럴듯해요.</li>
          </ul>
        </>
      ),
    },
    {
      id: 'call',
      title: '「거짓말!」과 「딱 맞다!」',
      content: (
        <>
          <div className="g-row center">
            <Cup seat={1} count={3} />
            <span>→</span>
            <Die face={4} size={30} hit />
            <Die face={1} size={30} hit wild />
            <Die face={6} size={30} />
          </div>
          <ul className="g-list">
            <li>
              <b>거짓말!</b>: 방금 호가가 틀렸다고 생각하면 외쳐요. 모두의 주사위를 공개해 세어요.
              <ul>
                <li>실제로 그 이상 있으면 → 외친 사람이 하나 잃어요.</li>
                <li>모자라면 → 호가를 부른 사람이 하나 잃어요.</li>
              </ul>
            </li>
            <li>
              <b>딱 맞다!</b>: 호가가 정확히 그 개수라고 생각하면. 맞으면 주사위 하나를 되찾고, 틀리면 하나 잃어요.
            </li>
            <li>진 사람이 다음 판을 시작해요. 모두 다시 굴려요.</li>
          </ul>
        </>
      ),
    },
    {
      id: 'wild',
      title: '1은 와일드',
      content: (
        <ul className="g-list">
          <li>
            <Die face={1} size={18} /> 은 어떤 숫자로도 세요. 「4가 4개」라면 4와 1을 모두 더해요.
          </li>
          <li>
            <b>페루 규칙</b>: 1 자체에 걸 수도 있어요. 1로 바꿀 땐 개수를 <b>절반(올림)</b>부터, 1에서 다른 숫자로 돌아올 땐 <b>두 배+1</b>부터.
          </li>
          <li>첫 호가는 1에 걸 수 없어요.</li>
        </ul>
      ),
    },
    {
      id: 'end',
      title: '탈락과 우승',
      content: (
        <ul className="g-list">
          <li>주사위를 모두 잃으면 탈락 — 남은 사람의 승부를 구경해요.</li>
          <li>마지막 한 명이 그 게임 우승. 여러 게임이면 과반을 먼저 이긴 사람이 최종 우승이에요.</li>
        </ul>
      ),
    },
    {
      id: 'custom',
      title: '변형',
      content: (
        <ul className="g-list">
          <li>처음 주사위 1~8개, 4~8면 주사위.</li>
          <li>
            <b>팔리피코</b>: 주사위가 1개가 된 사람이 처음 시작하는 판은 숫자를 바꿀 수 없고 1이 와일드가 아니에요.
          </li>
          <li>진 사람이 틀린 개수만큼 잃는 「차이만큼」 규칙으로 빠르게.</li>
          <li>처음 하는 사람과는 「단순 규칙」 (와일드 없음).</li>
        </ul>
      ),
    },
    {
      id: 'screen',
      title: '화면 사용법',
      content: (
        <ul className="g-list">
          <li>숫자 버튼 아래 작은 숫자가 지금 걸 수 있는 최소 개수예요. − + 로 개수를 맞추고 「걸기」.</li>
          <li>고른 숫자와 같은 내 주사위(와일드 포함)가 빛나요.</li>
          <li>공개 화면에서는 센 주사위가 강조되고, 진 사람이 「주사위 굴리기」로 다음 판을 시작해요.</li>
          <li>봇은 남은 주사위로 확률을 계산해요. 어려움은 남의 호가도 읽어요.</li>
        </ul>
      ),
    },
  ],
};
