import { BASE_EMOTES } from '@bg/core';
import { EXTRA_EMOTES, GameConfig, GameView } from '@bg/sketch-quiz-engine';
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
  id: 'sketch-quiz',
  title: 'Sketch Quiz',
  subtitle: '그림 퀴즈 · 2~10명이 그리고 맞히는 파티 게임 (사람끼리)',
  bots: false,
  original: meta.original,
  logo: <Logo />,
  lead: (
    <>
      한 명이 단어를 <b>그림으로</b> 그리면
      <br />
      나머지가 <b>먼저 맞히기</b> 경쟁! 시간이 지나면 초성 힌트가 나와요.
    </>
  ),
  chips: ['👥 2~10명', '🎨 그림판', '⚡ 빨리 맞힐수록 점수', '📝 우리끼리 단어'],
  Demo,
  emotes: [...BASE_EMOTES, ...EXTRA_EMOTES],
  ConfigPanel,
  Game: Game as GameClient<GameView, GameConfig>['Game'],
  seatBadge: (i) => <SeatDot seat={i} size={20} label />,
  guide,
  accent: meta.accent,
  Cover,
};
