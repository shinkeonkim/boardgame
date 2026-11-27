import { BASE_EMOTES } from '@bg/core';
import { EXTRA_EMOTES, GameConfig, GameView } from '@bg/silent-count-engine';
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
  id: 'silent-count',
  title: 'Silent Count',
  subtitle: '침묵의 숫자 · 2~6명 실시간 협력',
  original: meta.original,
  logo: <Logo />,
  lead: (
    <>
      말없이, 차례도 없이. 모두의 카드를 <b>작은 순서대로</b> 내요.
      <br />
      믿을 건 서로의 망설임뿐!
    </>
  ),
  chips: ['👥 2~6명 협력', '⏱ 실시간', '🔢 1~100', '🤖 시간 감각 봇'],
  Demo,
  emotes: [...BASE_EMOTES, ...EXTRA_EMOTES],
  ConfigPanel,
  Game: Game as GameClient<GameView, GameConfig>['Game'],
  seatBadge: (i) => <SeatDot seat={i} size={20} label />,
  guide,
  accent: meta.accent,
  Cover,
  sounds: { cue: 'cueKalimba', turn: 'tick' },
};
