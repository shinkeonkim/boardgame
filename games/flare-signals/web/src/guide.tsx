import { CLASSIC, deckSize } from '@bg/flare-signals-engine';
import { Clip, type GuideDef } from '@bg/web/guide-kit';
import { COLORS, FlareCard, Logo, MysteryCard } from './theme';

const c = CLASSIC;
const clue = (o: Partial<{ value: number | null; colors: number[]; notColors: number[]; notValues: number[]; focus: boolean; focusOnChop: boolean }>) => ({
  colors: [],
  notColors: [],
  value: null,
  notValues: [],
  touched: !!(o.value || o.colors?.length),
  focus: false,
  focusOnChop: false,
  at: 0,
  ...o,
});

export const guide: GuideDef = {
  subtitle: '불꽃 신호 · 함께 만드는 불꽃놀이',
  icon: <Logo size={28} />,
  sections: [
    {
      id: 'goal',
      title: '목표',
      content: (
        <>
          <p>
            모두 한 팀이에요. 색마다 <b>1 → 2 → 3 → 4 → 5</b> 순서로 카드를 쏘아 올려 불꽃놀이를 완성해요. 쌓은 숫자의 합이 점수(5색이면 25점 만점)예요.
          </p>
          <p>
            단, <b>내 카드는 나만 못 봐요.</b> 남의 카드는 다 보이니 서로 힌트를 줘서 알려 줘야 해요.
          </p>
          <Clip src="guide/play.mp4" caption="남의 카드를 눌러 힌트를 주고, 힌트 받은 카드를 쏘아 올려요" />
        </>
      ),
    },
    {
      id: 'parts',
      title: '구성',
      content: (
        <div className="g-parts">
          <div className="g-part">
            <span className="g-part-art">
              {[0, 1, 2, 3, 4].map((k) => (
                <FlareCard key={k} c={c} color={k} value={k + 1} size="xs" />
              ))}
            </span>
            <b>카드 {deckSize(c)}장</b>
            <span>5색 × (1이 3장, 2·3·4가 2장씩, 5가 1장). 5는 한 장뿐이라 버리면 그 색은 끝이에요.</span>
          </div>
          <div className="g-part">
            <span className="g-part-art">
              <i className="tok hint on big" />
              <b>× 8</b>
            </span>
            <b>힌트 토큰 8개</b>
            <span>힌트를 줄 때 하나씩 써요. 버리거나 5를 완성하면 돌아와요.</span>
          </div>
          <div className="g-part">
            <span className="g-part-art">
              <i className="tok fuse on big" />
              <b>× 3</b>
            </span>
            <b>실수 3번</b>
            <span>틀린 카드를 쏘면 하나씩. 세 번째에 불꽃놀이가 끝나요.</span>
          </div>
        </div>
      ),
    },
    {
      id: 'turn',
      title: '내 차례 — 셋 중 하나',
      content: (
        <ol className="g-steps">
          <li>
            <b>힌트 주기</b> — 한 사람을 골라 <b>색 하나</b> 또는 <b>숫자 하나</b>를 말해요. 그 사람 손에서 해당하는 카드를 <b>모두</b> 가리켜야 해요. 힌트 토큰 1개를 써요.
          </li>
          <li>
            <b>쏘아 올리기</b> — 내 카드 한 장을 내요. 그 색의 다음 숫자면 쌓이고, 아니면 실수 +1(카드는 버려져요).
          </li>
          <li>
            <b>버리기</b> — 카드 한 장을 버리고 힌트 토큰 1개를 되찾아요. 토큰이 가득이면 버릴 수 없어요.
          </li>
        </ol>
      ),
    },
    {
      id: 'hint',
      title: '힌트가 남기는 정보',
      content: (
        <>
          <div className="g-row">
            <div className="fs-g-hand">
              <MysteryCard c={c} clue={clue({ value: 1 })} show size="sm" />
              <MysteryCard c={c} clue={clue({ notValues: [1] })} show size="sm" />
              <MysteryCard c={c} clue={clue({ value: 1, colors: [0], focus: true })} show size="sm" />
            </div>
            <div className="g-note">
              <span>
                「1」 힌트를 받으면 가리킨 카드에 <b>1</b>이 적히고, 가리키지 않은 카드엔 「1 아님」이 작게 남아요. 색 힌트도 같아요. 아는 정보가 많을수록 카드 색이 칠해지고 숫자가 보여요.
              </span>
            </div>
          </div>
          <p className="small muted">「기억력 도전」 설정이면 이 표시가 없어요. 받은 힌트를 직접 기억해야 해요.</p>
        </>
      ),
    },
    {
      id: 'end',
      title: '끝과 점수',
      content: (
        <ul className="g-list">
          <li>
            모든 색을 5까지 쌓으면 <b>만점</b>으로 바로 끝.
          </li>
          <li>
            실수 3번이면 실패 — 원작은 <b>0점</b>(설정으로 「쌓은 만큼」).
          </li>
          <li>마지막 카드를 뽑으면 그 사람을 포함해 모두 한 번씩 더 하고 끝나요.</li>
          <li>
            점수 = 각 색에 쌓인 가장 큰 숫자의 합. 모두 같은 점수를 받아요.
          </li>
        </ul>
      ),
    },
    {
      id: 'tips',
      title: '잘하는 요령 (봇의 약속)',
      content: (
        <>
          <ul className="g-list">
            <li>
              <b>오래된 카드부터 버려요.</b> 왼쪽이 오래된 카드이고, 힌트를 안 받은 가장 오래된 카드에 점선(버릴 차례)이 보여요.
            </li>
            <li>
              <b>힌트의 초점</b>: 힌트로 새로 가리켜진 카드 중 가장 오른쪽(최근) 카드가 초점이에요. 초점은 보통 「지금 내도 돼」라는 뜻이에요 (카드 위 <span className="clue-flag play inline" /> 표시).
            </li>
            <li>
              초점이 <b>버릴 차례 카드</b>였거나 <b>「5」 힌트</b>면 「버리지 말고 지켜」라는 뜻이에요 (<span className="clue-flag keep inline" />).
            </li>
            <li>봇은 이 약속대로 힌트를 주고 받아요. 사람끼리도 이렇게 맞추면 훨씬 잘 돼요.</li>
          </ul>
        </>
      ),
    },
    {
      id: 'custom',
      title: '인원과 변형',
      content: (
        <ul className="g-list">
          <li>2~3명은 손패 5장, 4~5명은 4장, 6명은 3장(자동).</li>
          <li>
            <b>6색</b>: 주황을 더해 30점 만점. <b>무지개</b>: 모든 색 힌트에 함께 가리켜지는 까다로운 색이에요.
          </li>
          <li>힌트 토큰·실수 허용을 늘리거나 줄여 난이도를 바꿔요. 「처음 하는 사람」 프리셋은 실수 5번 + 가능성 계산.</li>
        </ul>
      ),
    },
    {
      id: 'screen',
      title: '화면 사용법',
      content: (
        <ul className="g-list">
          <li>
            <b>힌트</b>: 친구 카드를 누르면 그 카드의 색 힌트가, 한 번 더 누르면 숫자 힌트가 골라져요. 가리켜질 카드가 반짝이고 「힌트 주기」로 보내요. 「힌트 주기」 버튼으로 아무 색·숫자나 고를 수도 있어요.
          </li>
          <li>
            <b>내 카드</b>: 눌러서 고른 뒤 「쏘아 올리기」나 「버리기」.
          </li>
          <li>
            위 막대의 <b>가능성</b>을 켜면 내 카드가 될 수 있는 카드가 보여요 (남은 장수를 세서 계산해요).
          </li>
          <li>오른쪽 「버린 카드」 표에서 빨간 칸은 이제 쌓을 수 없는 카드, 테두리 칸은 마지막 한 장이에요.</li>
        </ul>
      ),
    },
  ],
};

export { COLORS };
