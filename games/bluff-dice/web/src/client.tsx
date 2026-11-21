import { BASE_EMOTES } from '@bg/core';
import { EXTRA_EMOTES, GameConfig, GameView } from '@bg/bluff-dice-engine';
import { SeatDot } from '@bg/ui';
import type { GameClient } from '@bg/web';
import { ConfigPanel } from './ConfigPanel';
import { Demo } from './Demo';
import { Game } from './Game';
import { guide } from './guide';
import { Logo } from './theme';

export const client: GameClient<GameView, GameConfig> = {
  id: 'bluff-dice',
  title: 'Bluff Dice',
  subtitle: '허풍 주사위 · 2~8명이 컵 속 주사위로 겨루는 눈치 게임',
  logo: <Logo />,
  lead: (
    <>
      컵 속 주사위는 나만 봐요. 모두의 주사위 중 <b>그 숫자가 몇 개</b>일지 걸고,
      <br />
      다음 사람은 더 높게 걸거나 <b>「거짓말!」</b>을 외쳐요.
    </>
  ),
  chips: ['👥 2~8명', '🎲 숨긴 주사위로 허풍', '1️⃣ 와일드·페루 규칙', '🤖 확률 계산하는 봇'],
  Demo,
  emotes: [...BASE_EMOTES, ...EXTRA_EMOTES],
  ConfigPanel,
  Game: Game as GameClient<GameView, GameConfig>['Game'],
  seatBadge: (i) => <SeatDot seat={i} size={20} label />,
  guide,
};
