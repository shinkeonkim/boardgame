import { BASE_EMOTES } from '@bg/core';
import { EXTRA_EMOTES, GameConfig, GameView } from '@bg/hidden-thorn-engine';
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
  id: 'hidden-thorn',
  title: 'Hidden Thorn',
  subtitle: '숨은 가시 · 2~8명이 하는 순수 블러핑',
  original: meta.original,
  logo: <Logo />,
  lead: (
    <>
      장미 사이에 <b>가시</b>를 숨기고, 「장미를 몇 장 뒤집을 수 있다」고 걸어요.
      <br />
      가시를 뒤집는 순간 — 찔려서 원판을 잃어요. 두 번 성공하면 우승!
    </>
  ),
  chips: ['👥 2~8명', '🌹 단순한 규칙, 깊은 눈치', '🌵 가시 개수 바꾸기', '🤖 허풍 치는 봇'],
  Demo,
  emotes: [...BASE_EMOTES, ...EXTRA_EMOTES],
  ConfigPanel,
  Game: Game as GameClient<GameView, GameConfig>['Game'],
  seatBadge: (i) => <SeatDot seat={i} size={20} label />,
  guide,
  accent: meta.accent,
  Cover,
  sounds: { cue: 'cueHeart', turn: 'tick' },
};
