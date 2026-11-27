import { BASE_EMOTES } from '@bg/core';
import { EXTRA_EMOTES, GameConfig, GameView } from '@bg/holdem-engine';
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
  id: 'holdem',
  title: "Hold'em",
  subtitle: '홀덤 · 2~9명이 칩으로 겨루는 포커 (돈 없음)',
  original: meta.original,
  logo: <Logo />,
  lead: (
    <>
      손패 2장과 바닥 5장으로 <b>가장 좋은 패</b>를 —
      <br />
      아니면 <b>블러핑</b>으로 모두 접게 하세요. 마지막까지 칩이 남으면 우승!
    </>
  ),
  chips: ['👥 2~9명', '🃏 텍사스 홀덤', '💰 칩만 (돈 없음)', '🤖 승률 계산 봇'],
  Demo,
  emotes: [...BASE_EMOTES, ...EXTRA_EMOTES],
  ConfigPanel,
  Game: Game as GameClient<GameView, GameConfig>['Game'],
  seatBadge: (i) => <SeatDot seat={i} size={20} label />,
  guide,
  accent: meta.accent,
  Cover,
  sounds: { cue: 'cueChips', turn: 'chip', swap: { shuffle: 'riffle', chips: 'chipStack' } },
};
