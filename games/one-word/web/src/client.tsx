import { BASE_EMOTES } from '@bg/core';
import { EXTRA_EMOTES, GameConfig, GameView } from '@bg/one-word-engine';
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
  id: 'one-word',
  title: 'One Word',
  subtitle: '한 단어 · 3~8명이 함께 맞히는 협력 단어 게임',
  original: meta.original,
  logo: <Logo />,
  lead: (
    <>
      맞히는 사람만 단어를 몰라요. 나머지는 <b>힌트 한 단어</b>씩 —
      <br />
      그런데 <b>남과 겹친 힌트는 지워져요!</b> 13장 중 몇 장을 맞힐까요?
    </>
  ),
  chips: ['👥 3~8명', '🤝 협력', '📝 한 단어 힌트', '🙈 겹치면 지워짐'],
  Demo,
  emotes: [...BASE_EMOTES, ...EXTRA_EMOTES],
  ConfigPanel,
  Game: Game as GameClient<GameView, GameConfig>['Game'],
  seatBadge: (i) => <SeatDot seat={i} size={20} label />,
  guide,
  accent: meta.accent,
  Cover,
};
