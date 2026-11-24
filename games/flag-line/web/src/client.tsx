import { iconize } from '@bg/ui';
import { BASE_EMOTES } from '@bg/core';
import { EXTRA_EMOTES, GameConfig, GameView } from '@bg/flag-line-engine';
import type { GameClient } from '@bg/web';
import { meta } from '../../meta';
import { ConfigPanel } from './ConfigPanel';
import { Cover } from './cover';
import { Demo } from './Demo';
import { Game } from './Game';
import { guide } from './guide';
import { Logo } from './theme';

export const client: GameClient<GameView, GameConfig> = {
  id: 'flag-line',
  title: 'Flag Line',
  subtitle: '깃발 전선 · 2명(또는 2:2)이 하는 포커 같은 진지전',
  original: meta.original,
  logo: <Logo />,
  lead: (
    <>
      아홉 깃발을 사이에 두고 카드를 3장씩 놓아 <b>대형</b>을 만들어요.
      <br />
      더 강한 대형으로 깃발을 차지하고 — <b>5개</b> 또는 <b>나란히 3개</b>면 승리!
    </>
  ),
  chips: ['⚔️ 2명 · 2:2 팀전', '🃏 포커 같은 대형', '🚩 확정되면 자동 차지', '🤖 계산하는 봇'],
  Demo,
  emotes: [...BASE_EMOTES, ...EXTRA_EMOTES],
  ConfigPanel,
  Game: Game as GameClient<GameView, GameConfig>['Game'],
  seatBadge: (i) => <span className={`fl-seat side${i % 2}`}>{iconize(i % 2 ? '🔵' : '🔴')}</span>,
  seatLabel: (i) => (i % 2 ? '파랑 편' : '빨강 편'),
  guide,
  accent: meta.accent,
  Cover,
};
