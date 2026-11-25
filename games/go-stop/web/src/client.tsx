import { BASE_EMOTES } from '@bg/core';
import { EXTRA_EMOTES, GameConfig, GameView } from '@bg/go-stop-engine';
import { SeatDot } from '@bg/ui';
import type { GameClient } from '@bg/web';
import { ConfigPanel } from './ConfigPanel';
import { Cover } from './cover';
import { Demo } from './Demo';
import { Game } from './Game';
import { guide } from './guide';
import { Logo } from './theme';
import { meta } from '../../meta';

export const client: GameClient<GameView, GameConfig> = {
  id: 'go-stop',
  title: 'Go Stop',
  subtitle: '고스톱 · 2~3명 화투',
  logo: <Logo />,
  lead: (
    <>
      같은 달 화투를 맞춰 먹고,
      <br />
      점수가 나면 <b>고?</b> <b>스톱?</b>
    </>
  ),
  chips: ['👥 2~3명', '🎴 직접 그린 화투', '🔥 고/스톱', '🤖 봇과 함께'],
  Demo,
  emotes: [...BASE_EMOTES, ...EXTRA_EMOTES],
  ConfigPanel,
  Game: Game as GameClient<GameView, GameConfig>['Game'],
  seatBadge: (i) => <SeatDot seat={i} size={20} label />,
  guide,
  accent: meta.accent,
  Cover,
};
