import { BASE_EMOTES } from '@bg/core';
import { EXTRA_EMOTES, GameConfig, GameView } from '@bg/one-card-engine';
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
  id: 'one-card',
  title: 'One Card',
  subtitle: '원카드 · 2~8명이 하는 카드 털기 게임',
  original: meta.original,
  logo: <Logo />,
  lead: (
    <>
      무늬나 숫자를 맞춰 카드를 내고, <b>먼저 다 내면</b> 승리!
      <br />
      2·A·조커 공격을 막아 넘기고, 한 장 남으면 <b>「원카드!」</b>
    </>
  ),
  chips: ['👥 2~8명', '💥 공격 쌓기', '☝️ 원카드 외치기', '🛠️ 우리 집 규칙'],
  Demo,
  emotes: [...BASE_EMOTES, ...EXTRA_EMOTES],
  ConfigPanel,
  Game: Game as GameClient<GameView, GameConfig>['Game'],
  seatBadge: (i) => <SeatDot seat={i} size={20} label />,
  guide,
  accent: meta.accent,
  Cover,
  sounds: { cue: 'cueArcade', turn: 'tick', swap: { shuffle: 'riffle' } },
};
