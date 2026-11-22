import { Clip, type GuideDef } from '@bg/web/guide-kit';
import { ClueNote, Logo, WordCard } from './theme';

export const guide: GuideDef = {
  subtitle: '한 단어 · 겹치지 않는 힌트로 함께 맞히기',
  icon: <Logo size={28} />,
  sections: [
    {
      id: 'goal',
      title: '목표',
      content: (
        <>
          <p>
            모두 한 팀이에요. 차례로 한 명이 <b>맞히는 사람</b>이 되고, 나머지는 단어를 보고 <b>힌트 한 단어</b>씩 써요. 13장 중 몇 장을 맞힐까요?
          </p>
          <Clip src="guide/play.mp4" caption="힌트를 모두 쓰면 겹친 힌트는 지워지고, 남은 힌트로 맞혀요" />
        </>
      ),
    },
    {
      id: 'clue',
      title: '힌트 쓰기',
      content: (
        <>
          <div className="g-row center">
            <WordCard word="고래" size="md" />
          </div>
          <ul className="g-list">
            <li>띄어쓰기 없는 한 단어. 서로의 힌트는 볼 수 없어요.</li>
            <li>
              <b>다른 사람과 같거나 비슷한 힌트는 지워져요</b> (바다·바닷가). 정답을 품은 힌트도요.
            </li>
            <li>너무 뻔한 힌트는 남과 겹치기 쉬워요!</li>
          </ul>
        </>
      ),
    },
    {
      id: 'erase',
      title: '지워지는 힌트',
      content: (
        <div className="g-row center">
          <ClueNote text="바다" seatColor="#e0483c" state="erased" />
          <ClueNote text="바다" seatColor="#3b7be0" state="erased" />
          <ClueNote text="분수" seatColor="#2fa865" state="shown" />
          <ClueNote text="큰" seatColor="#e6b422" state="shown" />
        </div>
      ),
    },
    {
      id: 'guess',
      title: '맞히기',
      content: (
        <ul className="g-list">
          <li>맞히는 사람은 남은 힌트만 보고 한 번 답해요.</li>
          <li>맞히면 1점. 틀리면 그 카드와 다음 카드까지 잃어요. 모르면 넘기면 그 카드만 잃어요.</li>
        </ul>
      ),
    },
    {
      id: 'settings',
      title: '바꿀 수 있는 규칙',
      content: (
        <ul className="g-list">
          <li>카드 5~20장, 단어 묶음(모든 단어·자연·일상·모험)</li>
          <li>지워지는 힌트: 비슷한 것도 / 똑같은 것만</li>
          <li>틀리면 다음 카드도 잃기, 힌트·맞히기 시간</li>
        </ul>
      ),
    },
  ],
};
