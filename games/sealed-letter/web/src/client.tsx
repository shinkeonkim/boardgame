import { BASE_EMOTES } from '@bg/core';
import { EXTRA_EMOTES, GameConfig, GameView } from '@bg/sealed-letter-engine';
import { SeatDot } from '@bg/ui';
import type { GameClient } from '@bg/web';
import { ConfigPanel } from './ConfigPanel';
import { Demo } from './Demo';
import { Game } from './Game';
import { guide } from './guide';
import { Logo } from './theme';

export const client: GameClient<GameView, GameConfig> = {
  id: 'sealed-letter',
  title: 'Sealed Letter',
  subtitle: '비밀 편지 · 2~6명이 하는 16장 추리 카드 게임',
  logo: <Logo />,
  lead: (
    <>
      손에는 늘 카드 <b>한 장</b>. 한 장을 뽑아 둘 중 하나를 내며 효과를 써요.
      <br />
      끝까지 살아남거나 <b>가장 높은 카드</b>를 들고 있으면 편지를 전해요.
    </>
  ),
  chips: ['👥 2~6명 · 5분 한 판', '🗡️ 추측·엿보기·결투', '✉️ 확장 21장', '🤖 카드를 세는 봇'],
  Demo,
  emotes: [...BASE_EMOTES, ...EXTRA_EMOTES],
  ConfigPanel,
  Game: Game as GameClient<GameView, GameConfig>['Game'],
  seatBadge: (i) => <SeatDot seat={i} size={20} label />,
  guide,
};
