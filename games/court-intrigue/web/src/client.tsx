import { BASE_EMOTES } from '@bg/core';
import { EXTRA_EMOTES, GameConfig, GameView } from '@bg/court-intrigue-engine';
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
  id: 'court-intrigue',
  title: 'Court Intrigue',
  subtitle: '궁정 음모 · 2~6명이 허풍으로 겨루는 15분 게임',
  original: meta.original,
  logo: <Logo />,
  lead: (
    <>
      내 카드 두 장이 내 <b>영향력</b>이에요. 역할을 <b>주장</b>해 금화를 모으고 상대를 몰아내요.
      <br />
      그 역할이 없어도 돼요 — 누군가 <b>「거짓말!」</b>이라고 도전하기 전까지는.
    </>
  ),
  chips: ['👥 2~6명', '🎭 허풍과 도전', '⏱️ 끼어들기 대기 자동', '🤖 카드를 세는 봇'],
  Demo,
  emotes: [...BASE_EMOTES, ...EXTRA_EMOTES],
  ConfigPanel,
  Game: Game as GameClient<GameView, GameConfig>['Game'],
  seatBadge: (i) => <SeatDot seat={i} size={20} label />,
  guide,
  accent: meta.accent,
  Cover,
};
