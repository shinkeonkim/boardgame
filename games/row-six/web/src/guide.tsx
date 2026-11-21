import { CLASSIC, penaltyOf, targetRow } from '@bg/row-six-engine';
import { Clip, type GuideDef } from '@bg/web/guide-kit';
import { Logo, NumberCard, Penalty } from './theme';

/* 게임 방법 — 실제 카드 그림으로 예시를 그리고, 어느 줄로 가는지·벌점은 엔진 함수로 계산해 틀릴 수 없게 */

function Row({ cards, mark, label, extra }: { cards: number[]; mark?: number; label?: string; extra?: number }) {
  return (
    <div className="g-rs-row">
      {label && <span className="g-rs-label">{label}</span>}
      {cards.map((n) => (
        <NumberCard key={n} n={n} size="xs" className={n === mark ? 'fresh' : ''} />
      ))}
      {extra !== undefined && <NumberCard n={extra} size="xs" className="ghost" />}
    </div>
  );
}

const EX_ROWS = [[12, 18], [33], [47, 50, 51], [70]];
const EX_CARD = 49;
const EX_TARGET = targetRow(EX_ROWS, EX_CARD);

const FULL = [21, 25, 30, 34, 40];
const FULL_PEN = FULL.reduce((a, n) => a + penaltyOf(CLASSIC, n), 0);

let TOTAL = 0;
for (let n = 1; n <= 104; n++) TOTAL += penaltyOf(CLASSIC, n);

export const guide: GuideDef = {
  subtitle: '여섯째 줄 · 동시에 고르는 숫자 카드',
  icon: <Logo size={28} />,
  sections: [
    {
      id: 'goal',
      title: '목표',
      content: (
        <>
          <p>
            모두 동시에 숫자 카드를 한 장씩 내서 가운데 줄에 붙여요. 줄의 <b>6번째</b>가 되거나 어디에도 못 붙는 카드를 내면 줄을 통째로 <b>벌점</b>으로 가져가요.
          </p>
          <p>
            <b>벌점이 가장 적은 사람이 이겨요.</b> 원작 규칙에선 누군가 66점이 넘으면 그 판에서 끝나요.
          </p>
          <Clip src="guide/play.mp4" caption="모두 고르면 공개되고, 작은 카드부터 줄에 붙어요" />
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
              <NumberCard n={7} size="sm" />
              <NumberCard n={55} size="sm" />
            </span>
            <b>숫자 카드 1~104</b>
            <span>숫자가 모두 달라요. 위쪽 마름모 개수가 그 카드의 벌점이에요.</span>
          </div>
          <div className="g-part">
            <span className="g-part-art">
              <Row cards={[8, 15]} />
            </span>
            <b>줄 4개</b>
            <span>판을 시작할 때 카드 한 장씩 깔고 시작해요. 한 줄에 5장까지 놓여요.</span>
          </div>
          <div className="g-part">
            <span className="g-part-art">
              <Penalty v={0} />
            </span>
            <b>손패 10장</b>
            <span>한 판에 10번 골라요. 손패는 나만 보여요.</span>
          </div>
        </div>
      ),
    },
    {
      id: 'turn',
      title: '한 번 고르기',
      content: (
        <ol className="g-steps">
          <li>
            모두 손에서 카드 <b>한 장</b>을 몰래 골라요. 다른 사람은 내가 <b>골랐는지만</b> 보여요.
          </li>
          <li>
            모두 고르면 한꺼번에 공개돼요. 그리고 <b>작은 카드부터</b> 차례로 줄에 붙어요.
          </li>
          <li>고른 카드는 공개 전에 바꿀 수 있어요 (설정으로 끌 수 있어요).</li>
        </ol>
      ),
    },
    {
      id: 'place',
      title: '어느 줄에 붙을까',
      content: (
        <>
          <p>
            카드는 <b>끝 숫자가 내 카드보다 작은 줄 중에서 가장 가까운 줄</b> 뒤에 붙어요. 고를 수 없고 자동으로 정해져요.
          </p>
          <div className="g-row">
            <div className="g-rs-rows">
              {EX_ROWS.map((r, i) => (
                <Row key={i} cards={r} label={`${i + 1}`} extra={i === EX_TARGET ? EX_CARD : undefined} />
              ))}
            </div>
            <div className="g-note">
              <NumberCard n={EX_CARD} size="sm" />
              <span>
                <b>{EX_CARD}</b>는 끝이 18·33·51·70인 줄 중 {EX_CARD}보다 작으면서 가장 가까운 <b>{EX_ROWS[EX_TARGET].at(-1)}</b> 뒤, {EX_TARGET + 1}번 줄로 가요.
              </span>
            </div>
          </div>
        </>
      ),
    },
    {
      id: 'sixth',
      title: '6번째 카드 — 줄을 가져가요',
      content: (
        <>
          <p>
            카드가 붙을 줄에 이미 5장이 있으면, 그 카드를 낸 사람이 <b>5장을 모두 가져가고</b> 내 카드가 그 줄의 새 첫 카드가 돼요.
          </p>
          <div className="g-row">
            <Row cards={FULL} extra={44} />
            <div className="g-note">
              <span>
                <b>44</b>가 이 줄의 6번째 → 앞의 다섯 장을 가져가요. 벌점 = {FULL.map((n) => penaltyOf(CLASSIC, n)).join(' + ')} = <b>{FULL_PEN}점</b>
              </span>
            </div>
          </div>
          <p className="small muted">같은 차례에 나보다 작은 카드가 먼저 그 줄을 채울 수도 있어요. 그래서 "몇 번째가 될지"를 눈치로 읽어야 해요.</p>
        </>
      ),
    },
    {
      id: 'low',
      title: '어디에도 못 붙는 작은 카드',
      content: (
        <>
          <p>
            내 카드가 <b>모든 줄의 끝보다 작으면</b> 붙을 곳이 없어요. 이때는 <b>줄 하나를 골라</b> 통째로 가져가고, 내 카드가 그 줄의 첫 카드가 돼요.
          </p>
          <p>다른 사람 카드는 내가 고를 때까지 기다려요. 벌점이 가벼운 줄을 고르는 게 보통이지만, 일부러 남에게 위험한 줄을 남길 수도 있어요.</p>
          <p className="small muted">「작은 카드: 자동」 설정이면 가장 가벼운 줄을 자동으로 가져가요.</p>
        </>
      ),
    },
    {
      id: 'score',
      title: '벌점',
      content: (
        <>
          <div className="g-row center">
            {[3, 15, 30, 44, 55].map((n) => (
              <span key={n} className="g-rs-pen">
                <NumberCard n={n} size="sm" />
                <span className="small">{penaltyOf(CLASSIC, n)}점</span>
              </span>
            ))}
          </div>
          <ul className="g-list">
            <li>5로 끝나는 수 2점 · 10의 배수 3점 · 11·22·33… 같은 숫자 두 자리 5점 · 55는 7점 · 나머지 1점</li>
            <li>1~104 벌점을 모두 더하면 {TOTAL}점이에요.</li>
            <li>「모두 1점」 설정이면 가져간 카드 장수가 곧 벌점이에요.</li>
          </ul>
        </>
      ),
    },
    {
      id: 'end',
      title: '판 끝과 승리',
      content: (
        <ul className="g-list">
          <li>손패 10장을 모두 내면 한 판이 끝나고 가져간 카드의 벌점을 더해요.</li>
          <li>
            <b>목표 벌점(원작 66점)</b>을 넘은 사람이 생기면 그 판에서 게임 끝. 아니면 새로 나눠 다음 판.
          </li>
          <li>
            끝났을 때 <b>누적 벌점이 가장 적은 사람</b>이 이겨요. 「판 수」 설정이면 정한 판만큼 하고 끝나요.
          </li>
          <li>팀전(4·6·8·10명)은 옆자리 두 사람의 벌점을 더해서 비교해요.</li>
        </ul>
      ),
    },
    {
      id: 'custom',
      title: '인원과 변형',
      content: (
        <ul className="g-list">
          <li>
            <b>2~10명.</b> 인원이 적으면 「인원에 맞추기」로 카드 범위를 줄여 보세요(인원×10+4장). 모든 카드가 나와서 남은 카드를 세는 수 싸움이 돼요.
          </li>
          <li>줄 수(3~6)·한 줄 길이(3~7)·손패(5~12장)로 판의 긴장감을 조절해요. 줄이 짧을수록 자주 가져가요.</li>
          <li>처음 하는 사람이 있으면 「처음 하는 사람」 프리셋: 벌점 모두 1점, 작은 카드는 자동.</li>
          <li>
            <b>봇</b>: 대기실에서 빈자리에 넣어요. 쉬움은 자주 실수하고, 어려움은 남은 카드를 세며 위험을 계산해요.
          </li>
        </ul>
      ),
    },
    {
      id: 'screen',
      title: '화면 사용법',
      content: (
        <ul className="g-list">
          <li>내 카드를 누르면 바로 골라져요. 카드에 마우스를 올리거나 고르면 <b>지금 줄 기준으로 어디로 갈지</b>와 위험(빨간 테두리)이 보여요.</li>
          <li>오른쪽 플레이어 목록에서 누가 골랐는지(✓) 보여요. 끊긴 사람이 있으면 20초 뒤 「대신 진행」을 누를 수 있어요.</li>
          <li>줄을 골라야 할 때는 줄을 누르거나 숫자 키 1~{CLASSIC.rows}를 눌러요.</li>
          <li>공개된 카드는 줄 아래 「이번 공개」에 놓인 순서대로 보이고, 새로 놓인 카드는 낸 사람 색으로 반짝여요.</li>
        </ul>
      ),
    },
  ],
};
