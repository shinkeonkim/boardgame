import { BASE_EMOTES } from '@bg/core';
import { EXTRA_EMOTES, GameConfig, GameView } from '@bg/hearts-engine';
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
  id: 'hearts',
  title: 'Hearts',
  subtitle: '하트 · 3~6명이 하는 트릭 게임',
  original: meta.original,
  logo: <Logo />,
  lead: (
    <>
      하트와 <b>스페이드 Q</b> 를 피해 트릭을 내주세요. 점수는 <b>적을수록</b> 좋아요.
      <br />
      아니면… 전부 먹어서 문을 쏘거나!
    </>
  ),
  chips: ['👥 3~6명', '🃏 트럼프 52장', '🔄 3장 건네기', '🤖 점수를 피하는 봇'],
  Demo,
  emotes: [...BASE_EMOTES, ...EXTRA_EMOTES],
  ConfigPanel,
  Game: Game as GameClient<GameView, GameConfig>['Game'],
  seatBadge: (i) => <SeatDot seat={i} size={20} label />,
  guide,
  accent: meta.accent,
  Cover,
};
