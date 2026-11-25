import { BASE_EMOTES } from '@bg/core';
import { EXTRA_EMOTES, GameConfig, GameView } from '@bg/five-stones-engine';
import type { GameClient } from '@bg/web';
import { meta } from '../../meta';
import { ConfigPanel } from './ConfigPanel';
import { Cover } from './cover';
import { Demo } from './Demo';
import { Game } from './Game';
import { guide } from './guide';
import { Logo, StoneView } from './theme';

export const client: GameClient<GameView, GameConfig> = {
  id: 'five-stones',
  title: 'Five Stones',
  subtitle: '오목 · 둘이 하는 두뇌 게임',
  original: meta.original,
  logo: <Logo />,
  lead: (
    <>
      흑과 백이 번갈아 돌을 놓아 <b>다섯 개를 먼저 한 줄로</b> 이으면 이겨요.
      <br />
      막으면서 잇고, 두 갈래로 노리세요.
    </>
  ),
  chips: ['👥 2명', '⚫ 흑백 번갈아', '📐 13·15·19줄', '🤖 수를 읽는 봇'],
  Demo,
  emotes: [...BASE_EMOTES, ...EXTRA_EMOTES],
  ConfigPanel,
  Game: Game as GameClient<GameView, GameConfig>['Game'],
  seatBadge: (i) => <StoneView stone={i === 0 ? 0 : 1} size={20} />,
  guide,
  accent: meta.accent,
  Cover,
};
