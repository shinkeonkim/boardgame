import { BASE_EMOTES } from '@bg/core';
import { EXTRA_EMOTES, GameConfig, GameView } from '@bg/cipher-ops-engine';
import type { GameClient } from '@bg/web';
import { ConfigPanel } from './ConfigPanel';
import { Demo } from './Demo';
import { Game } from './Game';
import { guide } from './guide';
import { Logo, TEAMS } from './theme';

export const client: GameClient<GameView, GameConfig> = {
  id: 'cipher-ops',
  title: 'Cipher Ops',
  subtitle: '암호 작전 · 4~10명이 두 팀으로 하는 단어 연상 게임',
  logo: <Logo />,
  lead: (
    <>
      팀장만 보는 <b>정답 지도</b>를 한 단어 힌트로 전해요.
      <br />
      요원들은 힌트로 우리 팀 단어를 찾고, <b>암살자</b> 카드만은 피해야 해요.
    </>
  ),
  chips: ['👥 4~10명 · 두 팀', '🕵️ 팀장 화면에만 정답', '📝 우리끼리 단어 넣기', '🤖 봇이 팀장·요원 대신'],
  Demo,
  emotes: [...BASE_EMOTES, ...EXTRA_EMOTES],
  ConfigPanel,
  Game: Game as GameClient<GameView, GameConfig>['Game'],
  seatBadge: (i) => <span className={`co-seat ${i % 2 ? 'blue' : 'red'}`}>{TEAMS[i % 2].icon}</span>,
  seatLabel: (i) => `${TEAMS[i % 2].short}${i < 2 ? ' · 첫 판 팀장' : ' · 요원'}`,
  teamsEnabled: () => false,
  guide,
};
