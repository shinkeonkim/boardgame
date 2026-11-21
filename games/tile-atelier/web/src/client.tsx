import { BASE_EMOTES } from '@bg/core';
import { EXTRA_EMOTES, GameConfig, GameView } from '@bg/tile-atelier-engine';
import { SeatDot } from '@bg/ui';
import type { GameClient } from '@bg/web';
import { ConfigPanel } from './ConfigPanel';
import { Demo } from './Demo';
import { Game } from './Game';
import { guide } from './guide';
import { Logo } from './theme';

export const client: GameClient<GameView, GameConfig> = {
  id: 'tile-atelier',
  title: 'Tile Atelier',
  subtitle: '타일 공방 · 2~4명이 벽을 꾸미는 타일 드래프트',
  logo: <Logo />,
  lead: (
    <>
      공장에서 <b>한 색을 모두</b> 가져와 패턴 줄을 채우고, 찬 줄은 벽으로 옮겨요.
      <br />
      타일을 <b>이어서</b> 놓을수록 점수가 커지고, 넘친 타일은 바닥에서 깨져 감점!
    </>
  ),
  chips: ['👥 2~4명', '🧱 이어 붙이는 점수', '🎨 자유 벽·6색', '🤖 가로채는 봇'],
  Demo,
  emotes: [...BASE_EMOTES, ...EXTRA_EMOTES],
  ConfigPanel,
  Game: Game as GameClient<GameView, GameConfig>['Game'],
  seatBadge: (i) => <SeatDot seat={i} size={20} label />,
  guide,
};
