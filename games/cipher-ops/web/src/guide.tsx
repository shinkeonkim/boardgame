import { CLASSIC, layout } from '@bg/cipher-ops-engine';
import { Icon, iconize } from '@bg/ui';
import { Clip, type GuideDef } from '@bg/web/guide-kit';
import { Logo, TEAMS } from './theme';

const l = layout(CLASSIC);
const Card = ({ w, k, open }: { w: string; k: 'red' | 'blue' | 'neutral' | 'assassin' | 'unknown'; open?: boolean }) => (
  <span className={`co-card ${k} ${open ? 'open' : k !== 'unknown' ? 'hinted' : ''}`}>
    <span className="co-word">{w}</span>
    {k === 'assassin' && <span className="co-skull"><Icon name="skull" /></span>}
  </span>
);

export const guide: GuideDef = {
  subtitle: '암호 작전 · 두 팀 단어 연상',
  icon: <Logo size={28} />,
  sections: [
    {
      id: 'goal',
      title: '목표',
      content: (
        <>
          <p>
            {iconize(TEAMS[0].icon)} 빨강 팀과 {iconize(TEAMS[1].icon)} 파랑 팀이 겨뤄요. 보드의 단어 {l.total}개 중 <b>우리 팀 단어를 먼저 모두 찾으면</b> 이겨요.
          </p>
          <p>
            어느 단어가 우리 팀 것인지는 <b>팀장만</b> 알아요. 팀장은 한 단어 힌트로 알려 주고, 요원들이 맞혀요.
          </p>
          <Clip src="guide/play.mp4" caption="팀장이 힌트를 보내면 요원이 단어를 골라요" />
        </>
      ),
    },
    {
      id: 'roles',
      title: '팀과 역할',
      content: (
        <ul className="g-list">
          <li>대기실 순서대로 1·3·5…번째가 빨강 팀, 2·4·6…번째가 파랑 팀이에요. 방장이 순서를 바꿔 팀을 정해요.</li>
          <li>
            각 팀 첫 번째 사람이 <b><Icon name="spy" /> 팀장</b>, 나머지는 <b>요원</b>. 「판마다 팀장 돌아가며」를 켜면 판마다 바뀌어요.
          </li>
          <li>사람이 모자라면 봇을 넣어요. 봇도 팀장·요원을 모두 할 수 있어요.</li>
        </ul>
      ),
    },
    {
      id: 'map',
      title: '정답 지도',
      content: (
        <>
          <div className="g-row center co-g-row">
            <Card w="고래" k="red" />
            <Card w="로켓" k="blue" />
            <Card w="우산" k="neutral" />
            <Card w="유령" k="assassin" />
          </div>
          <ul className="g-list">
            <li>
              먼저 하는 팀 {l.first}장, 나중 팀 {l.second}장, 중립 {l.neutral}장, 암살자 {l.assassins}장이에요.
            </li>
            <li>팀장 화면에서는 카드에 색이 옅게 칠해져 보이고, 요원 화면에서는 모두 같은 색이에요.</li>
          </ul>
        </>
      ),
    },
    {
      id: 'clue',
      title: '팀장의 힌트: 한 단어 + 숫자',
      content: (
        <>
          <p>
            예: 우리 단어가 「고래·상어·문어」라면 <b>「바다 3」</b>. 숫자는 그 힌트에 해당하는 우리 단어 수예요.
          </p>
          <ul className="g-list">
            <li>띄어쓰기 없는 한 단어만. 보드에 있는 단어나 그 단어를 포함하는 말은 쓸 수 없어요 (화면이 바로 알려 줘요).</li>
            <li>
              <b>0</b> = 「이 단어와 관계있는 건 우리 것이 아니야」(제한 없이 고름), <b>∞</b> = 지난 힌트까지 마음껏.
            </li>
            <li>팀장은 힌트를 보낸 뒤 말로 더 알려 주면 안 돼요. 표정 이모트로만!</li>
          </ul>
        </>
      ),
    },
    {
      id: 'guess',
      title: '요원이 고르기',
      content: (
        <ol className="g-steps">
          <li>단어를 한 번 누르면 우리 팀원에게 「이거 같아」 표시가 보여요. 함께 의논해요.</li>
          <li>
            같은 단어를 <b>한 번 더</b> 누르면 공개돼요.
          </li>
          <li>
            우리 단어면 계속 고를 수 있어요(원작: 숫자+1번까지). <b>중립이나 상대 단어</b>면 차례가 넘어가요.
          </li>
          <li>
            <b><Icon name="skull" /> 암살자</b>를 고르면 그 팀은 바로 져요.
          </li>
          <li>언제든 「이번 차례 마치기」로 멈출 수 있어요.</li>
        </ol>
      ),
    },
    {
      id: 'end',
      title: '이기고 지기',
      content: (
        <ul className="g-list">
          <li>우리 단어를 모두 공개하면 승리 — 상대가 실수로 우리 단어를 열어 줘도 세요.</li>
          <li>상대가 암살자를 고르면 우리 팀 승리.</li>
          <li>여러 판이면 과반을 먼저 이긴 팀이 이겨요 (3판이면 2선승).</li>
        </ul>
      ),
    },
    {
      id: 'custom',
      title: '변형',
      content: (
        <ul className="g-list">
          <li>보드 4×4(빠르게) ~ 6×6(길게), 암살자 0~3장.</li>
          <li>단어 묶음: 모든 단어 · 자연·동물 · 일상·음식 · 모험·상상.</li>
          <li>
            <b>직접 넣은 단어</b>: 우리끼리만 아는 이름·장소를 넣으면 훨씬 재밌어요. 넣은 단어가 먼저 보드에 나와요.
          </li>
          <li>고를 수 있는 수: 숫자+1(원작) · 숫자만큼 · 틀릴 때까지.</li>
        </ul>
      ),
    },
    {
      id: 'bots',
      title: '봇과 할 때',
      content: (
        <ul className="g-list">
          <li>봇은 단어마다 붙여 둔 연상 단어(동물·바다·달콤한…)로 힌트를 주고 맞혀요. 기본 단어 묶음에서 가장 잘해요.</li>
          <li>사람이 준 힌트가 봇이 아는 연상이 아니면, 봇 요원은 무리하지 않고 차례를 마쳐요.</li>
          <li>같은 팀에 사람 요원이 있으면 봇 요원은 사람이 고를 때까지 기다려요.</li>
        </ul>
      ),
    },
  ],
};
