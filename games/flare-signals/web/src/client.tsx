import { BASE_EMOTES } from '@bg/core';
import { EXTRA_EMOTES, GameConfig, GameView } from '@bg/flare-signals-engine';
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
  id: 'flare-signals',
  title: 'Flare Signals',
  subtitle: '불꽃 신호 · 2~6명이 함께 만드는 협력 불꽃놀이',
  original: meta.original,
  logo: <Logo />,
  lead: (
    <>
      내 카드는 <b>나만 못 봐요</b>. 친구들이 주는 힌트로 내 카드를 짐작해
      <br />
      색마다 1부터 5까지 차례로 <b>쏘아 올리세요</b>. 모두 함께 이기고 함께 져요.
    </>
  ),
  chips: ['🤝 협력 게임 · 2~6명', '👀 남의 카드만 보여요', '🌈 6색·무지개 변형', '🤖 약속을 지키는 봇'],
  Demo,
  emotes: [...BASE_EMOTES, ...EXTRA_EMOTES],
  ConfigPanel,
  Game: Game as GameClient<GameView, GameConfig>['Game'],
  seatBadge: (i) => <SeatDot seat={i} size={20} label />,
  guide,
  accent: meta.accent,
  Cover,
  sounds: { cue: 'cueSpark', turn: 'sparkle' },
};
