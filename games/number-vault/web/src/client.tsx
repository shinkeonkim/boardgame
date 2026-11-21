import { BASE_EMOTES } from '@bg/core';
import { EXTRA_EMOTES, GameConfig, GameView } from '@bg/number-vault-engine';
import { SeatDot } from '@bg/ui';
import type { GameClient } from '@bg/web';
import { ConfigPanel } from './ConfigPanel';
import { Demo } from './Demo';
import { Game } from './Game';
import { guide } from './guide';
import { Logo } from './theme';

export const client: GameClient<GameView, GameConfig> = {
  id: 'number-vault',
  title: 'Number Vault',
  subtitle: '숫자 금고 · 2~6명이 하는 숫자 추리 게임',
  logo: <Logo />,
  lead: (
    <>
      타일은 <b>왼쪽부터 작은 숫자</b> 순서로 놓여요. 색과 위치를 단서로
      <br />
      다른 사람의 가려진 숫자를 맞혀 <b>금고를 열어요</b>. 마지막까지 버티면 승리!
    </>
  ),
  chips: ['👥 2~6명', '🔍 순서와 색으로 추리', '🃏 조커 변형', '🤖 추리하는 봇'],
  Demo,
  emotes: [...BASE_EMOTES, ...EXTRA_EMOTES],
  ConfigPanel,
  Game: Game as GameClient<GameView, GameConfig>['Game'],
  seatBadge: (i) => <SeatDot seat={i} size={20} label />,
  guide,
};
