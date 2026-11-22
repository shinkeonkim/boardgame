import { BASE_EMOTES } from '@bg/core';
import { EXTRA_EMOTES, GameConfig, GameView } from '@bg/corner-claim-engine';
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
  id: 'corner-claim',
  title: 'Corner Claim',
  subtitle: '모서리 땅따먹기 · 2~4명이 조각을 펼치는 공간 퍼즐',
  original: meta.original,
  logo: <Logo />,
  lead: (
    <>
      귀퉁이에서 시작해 내 조각끼리 <b>모서리로만</b> 이어 가며 판을 차지해요.
      <br />
      남의 길은 막고 내 길은 열고 — 손에 남은 칸이 적을수록 이겨요.
    </>
  ),
  chips: ['👥 2~4명 · 둘이서 모드', '🧩 조각 21개', '↻ 회전·뒤집기 미리보기', '🤖 길을 막는 봇'],
  Demo,
  emotes: [...BASE_EMOTES, ...EXTRA_EMOTES],
  ConfigPanel,
  Game: Game as GameClient<GameView, GameConfig>['Game'],
  seatBadge: (i) => <SeatDot seat={i} size={20} label />,
  guide,
  accent: meta.accent,
  Cover,
};
