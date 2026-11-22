import { BASE_EMOTES } from '@bg/core';
import { EXTRA_EMOTES, GameConfig, GameView } from '@bg/number-runs-engine';
import { SeatDot } from '@bg/ui';
import type { GameClient } from '@bg/web';
import { meta } from '../../meta';
import { ConfigPanel } from './ConfigPanel';
import { Demo } from './Demo';
import { Game } from './Game';
import { guide } from './guide';
import { Logo } from './theme';

export const client: GameClient<GameView, GameConfig> = {
  id: 'number-runs',
  title: 'Number Runs',
  subtitle: '숫자 잇기 · 2~6명이 테이블을 다시 짜는 숫자 타일 게임',
  original: meta.original,
  logo: <Logo />,
  lead: (
    <>
      같은 색 <b>연속 숫자</b>나 같은 숫자 <b>다른 색</b>으로 묶어 타일을 내요.
      <br />
      테이블의 묶음을 나누고 합쳐 내 타일 자리를 만드는 게 묘미 — 먼저 손을 비우면 승리!
    </>
  ),
  chips: ['👥 2~6명', '🔢 줄과 무리', '🧠 테이블 다시 짜기', '🤖 이어 붙이는 봇'],
  Demo,
  emotes: [...BASE_EMOTES, ...EXTRA_EMOTES],
  ConfigPanel,
  Game: Game as GameClient<GameView, GameConfig>['Game'],
  seatBadge: (i) => <SeatDot seat={i} size={20} label />,
  guide,
};
