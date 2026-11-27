import { BASE_EMOTES } from '@bg/core';
import { EXTRA_EMOTES, GameConfig, GameView } from '@bg/orbit-tasks-engine';
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
  id: 'orbit-tasks',
  title: 'Orbit Tasks',
  subtitle: '궤도 임무 · 3~5명이 한 팀',
  original: meta.original,
  logo: <Logo />,
  lead: (
    <>
      모두 한 팀! <b>과제 카드를 맡은 사람</b>이 그 트릭을 가져가게 손발을 맞춰요.
      <br />
      말은 못 해요 — 신호 한 번과 눈치로.
    </>
  ),
  chips: ['👥 3~5명 협력', '🚀 로켓은 으뜸', '📈 성공할수록 과제 +1', '🤖 함께하는 봇'],
  Demo,
  emotes: [...BASE_EMOTES, ...EXTRA_EMOTES],
  ConfigPanel,
  Game: Game as GameClient<GameView, GameConfig>['Game'],
  seatBadge: (i) => <SeatDot seat={i} size={20} label />,
  guide,
  accent: meta.accent,
  Cover,
  sounds: { cue: 'cueRadio', turn: 'beep' },
};
