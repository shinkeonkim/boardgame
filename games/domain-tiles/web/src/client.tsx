import { BASE_EMOTES } from '@bg/core';
import { EXTRA_EMOTES, GameConfig, GameView } from '@bg/domain-tiles-engine';
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
  id: 'domain-tiles',
  title: 'Domain Tiles',
  subtitle: '영지 도미노 · 2~4명 왕국 짓기',
  original: meta.original,
  logo: <Logo />,
  lead: (
    <>
      땅 도미노를 골라 <b>5×5 왕국</b>을 지어요.
      <br />
      같은 땅을 크게 잇고, 왕관을 모아요!
    </>
  ),
  chips: ['👥 2~4명', '🧩 타일 놓기', '👑 칸 수 × 왕관', '🤖 땅을 키우는 봇'],
  Demo,
  emotes: [...BASE_EMOTES, ...EXTRA_EMOTES],
  ConfigPanel,
  Game: Game as GameClient<GameView, GameConfig>['Game'],
  seatBadge: (i) => <SeatDot seat={i} size={20} label />,
  guide,
  accent: meta.accent,
  Cover,
  sounds: { cue: 'cueTile', turn: 'wood' },
};
