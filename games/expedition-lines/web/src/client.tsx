import { EXTRA_EMOTES, GameConfig, GameView } from '@bg/expedition-lines-engine';
import { BASE_EMOTES } from '@bg/core';
import type { GameClient } from '@bg/web';
import { meta } from '../../meta';
import { CardDefs } from './cards';
import { ConfigPanel } from './ConfigPanel';
import { DemoBoard } from './Demo';
import { Game } from './Game';
import { guide } from './guide';

export const client: GameClient<GameView, GameConfig> = {
  id: 'expedition-lines',
  title: 'Expedition Lines',
  subtitle: '탐험대 · 2~4명이 하는 카드 게임',
  original: meta.original,
  logo: (
    <svg viewBox="0 0 64 64" aria-hidden>
      <rect width="64" height="64" rx="14" fill="var(--ink)" />
      <path d="M14 46 L26 26 L34 36 L42 22 L52 46 Z" fill="var(--sun)" />
      <circle cx="46" cy="16" r="5" fill="var(--paper)" />
    </svg>
  ),
  lead: (
    <>
      다섯 지역으로 <b>탐험대</b>를 보내세요. 같은 색 카드를 <b>작은 숫자부터 차례로</b> 쌓을수록 점수가 커져요.
      <br />
      단, 시작한 탐험대는 비용을 내야 해요 — 어디에 걸지가 승부!
    </>
  ),
  chips: ['👥 2~4명 · 4명 팀전', '📱 QR로 각자 폰에서 참여', '🧩 색·숫자·투자 카드를 마음대로', '🃏 끌어서 놓고, 버린 카드 펼쳐 보기'],
  Demo: DemoBoard,
  emotes: [...BASE_EMOTES, ...EXTRA_EMOTES],
  ConfigPanel,
  Game: Game as GameClient<GameView, GameConfig>['Game'],
  teamsEnabled: (c, n) => c.teams && n === 4,
  Globals: CardDefs,
  guide,
};
