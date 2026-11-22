import { Clip, type GuideDef } from '@bg/web/guide-kit';
import { PlayingCard } from '@bg/ui';
import { Logo } from './theme';

const C = (suit: number, rank: number) => ({ id: `${suit}-${rank}`, suit, rank });

export const guide: GuideDef = {
  subtitle: '홀덤 · 손패 2장과 바닥 5장으로 겨루는 칩 게임',
  icon: <Logo size={28} />,
  sections: [
    {
      id: 'goal',
      title: '목표',
      content: (
        <>
          <p>
            모두 같은 칩으로 시작해요. 핸드마다 베팅하고, <b>가장 좋은 패</b>를 가졌거나 <b>다른 사람이 모두 접으면</b> 팟을 가져가요. 칩을 다 잃으면 탈락, 마지막까지 남으면 우승!
          </p>
          <p className="small muted">돈이 오가지 않는 친목용 칩 게임이에요.</p>
          <Clip src="guide/play.mp4" caption="접기·체크·콜·레이즈를 고르고, 바닥 카드가 깔리면 또 베팅해요" />
        </>
      ),
    },
    {
      id: 'hand',
      title: '한 핸드',
      content: (
        <ul className="g-list">
          <li>딜러(D) 왼쪽 두 사람이 스몰·빅 블라인드를 내요. 모두 2장씩 받아요.</li>
          <li>프리플랍 → 플랍(바닥 3장) → 턴(1장) → 리버(1장). 바닥이 깔릴 때마다 베팅해요.</li>
          <li>마지막까지 남은 사람끼리 패를 공개(쇼다운)해 가장 좋은 패가 이겨요.</li>
        </ul>
      ),
    },
    {
      id: 'bet',
      title: '베팅',
      content: (
        <ul className="g-list">
          <li><b>체크</b>: 낼 칩이 없을 때 넘기기 · <b>콜</b>: 앞사람만큼 내기 · <b>레이즈</b>: 더 올리기 · <b>접기</b>: 이번 핸드 포기</li>
          <li>레이즈는 직전 레이즈만큼 이상 올려야 해요. 칩이 모자라면 가진 만큼 올인.</li>
          <li>올인한 사람은 자기가 낸 만큼까지의 팟(메인 팟)만 이길 수 있고, 나머지는 사이드 팟이 돼요.</li>
        </ul>
      ),
    },
    {
      id: 'ranks',
      title: '족보',
      content: (
        <>
          <div className="g-row center">
            {[C(0, 1), C(0, 13), C(0, 12), C(0, 11), C(0, 10)].map((x) => (
              <PlayingCard key={x.id} card={x} size="sm" />
            ))}
          </div>
          <ul className="g-list">
            <li>스트레이트 플러시 &gt; 포카드 &gt; 풀 하우스 &gt; 플러시 &gt; 스트레이트 &gt; 트리플 &gt; 투 페어 &gt; 원 페어 &gt; 하이 카드</li>
            <li>손패 2장 + 바닥 5장 중 가장 좋은 5장으로 겨뤄요. 화면에 지금 내 족보가 보여요.</li>
          </ul>
        </>
      ),
    },
    {
      id: 'settings',
      title: '바꿀 수 있는 규칙',
      content: (
        <ul className="g-list">
          <li>처음 칩, 블라인드, 블라인드 올림 주기</li>
          <li>노 리밋 / 팟 리밋, 핸드 수(칩 순위) 또는 한 명 남을 때까지, 제한시간</li>
        </ul>
      ),
    },
  ],
};
