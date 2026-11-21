import { CARD_DEFS, deckSpec } from '@bg/sealed-letter-engine';
import { Clip, type GuideDef } from '@bg/web/guide-kit';
import { LetterCard, Logo } from './theme';

const classic = deckSpec('classic');
const extended = deckSpec('extended');

export const guide: GuideDef = {
  subtitle: '비밀 편지 · 한 장으로 하는 추리',
  icon: <Logo size={28} />,
  sections: [
    {
      id: 'goal',
      title: '목표',
      content: (
        <>
          <p>
            궁정에 편지를 전하는 경쟁이에요. 한 판이 끝날 때 <b>혼자 살아남거나</b>, 더미가 다 떨어졌을 때 <b>가장 높은 숫자</b>를 든 사람이 인장 하나를 받아요. 인장을 먼저 모으면 우승(2명 7개 · 3명 5개 · 4명 4개).
          </p>
          <Clip src="guide/play.mp4" caption="카드를 고르고, 지목할 사람과 추측을 골라 내요" />
        </>
      ),
    },
    {
      id: 'turn',
      title: '내 차례',
      content: (
        <ol className="g-steps">
          <li>더미에서 1장을 뽑아 손에 2장이 돼요 (자동).</li>
          <li>2장 중 1장을 내고 그 카드의 효과를 써요. 낸 카드는 내 앞에 공개돼요.</li>
          <li>손에는 늘 1장만 남아요. 그 한 장을 끝까지 지켜야 해요.</li>
        </ol>
      ),
    },
    {
      id: 'cards',
      title: '카드 (원작 16장)',
      content: (
        <div className="sl-guide-cards">
          {classic.map((s) => (
            <div key={s.kind} className="sl-guide-card">
              <LetterCard kind={s.kind} value={s.value} size="sm" />
              <div>
                <b>
                  {s.value} {CARD_DEFS[s.kind].name}
                </b>{' '}
                ×{s.copies}
                <div className="small">{CARD_DEFS[s.kind].text}</div>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'rules',
      title: '꼭 알아둘 규칙',
      content: (
        <ul className="g-list">
          <li>
            <b>방패병</b>을 낸 사람은 다음 차례까지 아무도 지목할 수 없어요. 지목할 사람이 없으면 카드는 효과 없이 버려져요.
          </li>
          <li>
            <b>밀정</b>은 재상이나 사절과 함께 들고 있으면 반드시 밀정을 내야 해요. (그냥 내도 돼요 — 허풍!)
          </li>
          <li>
            <b>여왕</b>은 어떤 이유로든 버리게 되면 탈락이에요. 사절에게 지목당하는 것도 조심!
          </li>
          <li>사절은 나 자신도 지목할 수 있어요. 더미가 비었으면 처음에 몰래 빼 둔 카드를 뽑아요.</li>
          <li>2명이면 시작할 때 카드 3장을 앞면으로 빼 둬요 (모두가 보는 정보).</li>
        </ul>
      ),
    },
    {
      id: 'end',
      title: '판 끝',
      content: (
        <ul className="g-list">
          <li>한 명만 남으면 그 사람이 인장.</li>
          <li>더미가 다 떨어지면 남은 사람끼리 카드 숫자를 비교 — 높은 사람이 인장. 같으면 낸 카드 숫자 합이 큰 사람.</li>
          <li>이긴 사람이 다음 판을 먼저 시작해요.</li>
        </ul>
      ),
    },
    {
      id: 'extended',
      title: '확장 21장 (5~6명)',
      content: (
        <>
          <ul className="g-list">
            <li>
              <b>0 첩자</b> ×2 — 판이 끝날 때 살아남은 사람 중 첩자를 낸 사람이 나 혼자면 인장 +1.
            </li>
            <li>
              <b>6 서기관</b> ×2 — 2장을 더 뽑아 3장 중 1장만 남기고 2장은 더미 밑으로.
            </li>
            <li>파수꾼 6장, 재상·밀정·여왕이 7·8·9로 하나씩 올라가요.</li>
          </ul>
          <div className="g-row center">
            {extended
              .filter((s) => s.kind === 'spy' || s.kind === 'scribe')
              .map((s) => (
                <LetterCard key={s.kind} kind={s.kind} value={s.value} size="sm" />
              ))}
          </div>
        </>
      ),
    },
    {
      id: 'screen',
      title: '화면 사용법',
      content: (
        <ul className="g-list">
          <li>카드를 누르면 효과가 보이고, 지목할 사람(보호 중인 사람은 빠짐)과 파수꾼 추측을 고른 뒤 「내기」.</li>
          <li>오른쪽 목록에 각자 낸 카드가 쌓여요. 👁 표시는 점술가·결투·재상으로 내가 알게 된 카드예요.</li>
          <li>「카드 목록」을 펼치면 남은 장수를 셀 수 있어요. 봇(어려움)은 버려진 카드를 세서 추측해요.</li>
        </ul>
      ),
    },
  ],
};
