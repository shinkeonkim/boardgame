import { BASE_EMOTES } from '@bg/core';
import { EXTRA_EMOTES, GameConfig, GameView } from '@bg/row-six-engine';
import { SeatDot } from '@bg/ui';
import type { GameClient } from '@bg/web';
import { meta } from '../../meta';
import { ConfigPanel } from './ConfigPanel';
import { Cover } from './cover';
import { Demo } from './Demo';
import { Game } from './Game';
import { guide } from './guide';
import { Logo } from './theme';

export const client: GameClient<GameView, GameConfig> = {
  id: 'row-six',
  title: 'Row Six',
  subtitle: '여섯째 줄 · 2~10명이 동시에 하는 숫자 카드 게임',
  original: meta.original,
  logo: <Logo />,
  lead: (
    <>
      모두 <b>동시에</b> 숫자 카드 한 장을 고르고, 작은 카드부터 줄에 붙여요.
      <br />
      줄의 <b>6번째</b>가 되는 사람은 그 줄을 몽땅 가져가요. 벌점이 적을수록 이겨요.
    </>
  ),
  chips: ['👥 2~10명', '⚡ 동시에 골라서 빠르게', '🤖 봇과 함께', '🧩 줄 수·카드 범위·벌점 마음대로'],
  Demo,
  emotes: [...BASE_EMOTES, ...EXTRA_EMOTES],
  ConfigPanel,
  Game: Game as GameClient<GameView, GameConfig>['Game'],
  seatBadge: (i) => <SeatDot seat={i} size={20} label />,
  teamsEnabled: (c, n) => c.teams && n >= 4 && n % 2 === 0,
  guide,
  accent: meta.accent,
  Cover,
  sounds: { cue: 'cueBells', turn: 'tick', swap: { shuffle: 'riffle' } },
};
