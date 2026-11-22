import { BASE_EMOTES } from '@bg/core';
import { EXTRA_EMOTES, GameConfig, GameView } from '@bg/gem-guild-engine';
import { SeatDot } from '@bg/ui';
import type { GameClient } from '@bg/web';
import { meta } from '../../meta';
import { ConfigPanel } from './ConfigPanel';
import { Demo } from './Demo';
import { Game } from './Game';
import { guide } from './guide';
import { Logo } from './theme';

export const client: GameClient<GameView, GameConfig> = {
  id: 'gem-guild',
  title: 'Gem Guild',
  subtitle: '보석 상단 · 2~6명이 하는 보석 엔진 만들기',
  original: meta.original,
  logo: <Logo />,
  lead: (
    <>
      보석을 모아 카드를 사면 그 색 <b>보석이 영구 할인</b>돼요.
      <br />
      할인이 쌓일수록 비싼 카드도 척척 — 먼저 <b>15점</b>을 모아 최고의 상단이 되세요.
    </>
  ),
  chips: ['👥 2~6명', '💎 엔진 만들기', '🎩 귀족 보너스', '🤖 막아서는 봇'],
  Demo,
  emotes: [...BASE_EMOTES, ...EXTRA_EMOTES],
  ConfigPanel,
  Game: Game as GameClient<GameView, GameConfig>['Game'],
  seatBadge: (i) => <SeatDot seat={i} size={20} label />,
  guide,
};
