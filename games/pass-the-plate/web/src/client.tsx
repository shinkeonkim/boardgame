import { BASE_EMOTES } from '@bg/core';
import { EXTRA_EMOTES, GameConfig, GameView } from '@bg/pass-the-plate-engine';
import { SeatDot } from '@bg/ui';
import type { GameClient } from '@bg/web';
import { ConfigPanel } from './ConfigPanel';
import { Demo } from './Demo';
import { Game } from './Game';
import { guide } from './guide';
import { Logo } from './theme';

export const client: GameClient<GameView, GameConfig> = {
  id: 'pass-the-plate',
  title: 'Pass the Plate',
  subtitle: '접시 돌리기 · 2~8명이 동시에 고르는 요리 모으기',
  logo: <Logo />,
  lead: (
    <>
      손에 든 접시 중 <b>하나만</b> 골라 먹고, 나머지는 <b>옆 사람에게 넘겨요</b>.
      <br />
      튀김은 2개, 회는 3개씩 모으고 — 김밥 줄 수 경쟁까지! 3판 합계로 겨뤄요.
    </>
  ),
  chips: ['👥 2~8명 · 동시에', '🍣 세트 모으기', '🍽️ 메뉴를 마음대로', '🤖 가로채는 봇'],
  Demo,
  emotes: [...BASE_EMOTES, ...EXTRA_EMOTES],
  ConfigPanel,
  Game: Game as GameClient<GameView, GameConfig>['Game'],
  seatBadge: (i) => <SeatDot seat={i} size={20} label />,
  guide,
};
