import { BASE_EMOTES } from '@bg/core';
import { EXTRA_EMOTES, GameConfig, GameView } from '@bg/yacht-engine';
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
  id: 'yacht',
  title: 'Yacht Dice',
  subtitle: '요트 다이스 · 1~8명이 하는 주사위 족보 게임',
  original: meta.original,
  logo: <Logo />,
  lead: (
    <>
      주사위 5개를 <b>세 번까지</b> 굴려 족보 칸을 하나씩 채워요.
      <br />
      남길 주사위를 고르는 눈치와 운 — 다섯 개가 모두 같으면 <b>요트 50점</b>!
    </>
  ),
  chips: ['👥 1~8명', '🎲 3번 굴리기', '⛵ 요트 50점', '⚡ 모두 동시에 모드'],
  Demo,
  emotes: [...BASE_EMOTES, ...EXTRA_EMOTES],
  ConfigPanel,
  Game: Game as GameClient<GameView, GameConfig>['Game'],
  seatBadge: (i) => <SeatDot seat={i} size={20} label />,
  guide,
  accent: meta.accent,
  Cover,
};
