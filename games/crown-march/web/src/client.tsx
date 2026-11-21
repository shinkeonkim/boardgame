import { EXTRA_EMOTES, GameConfig, GameView } from '@bg/crown-march-engine';
import { BASE_EMOTES } from '@bg/core';
import type { GameClient } from '@bg/web';
import { ConfigPanel } from './ConfigPanel';
import { DemoBoard } from './Demo';
import { Game } from './Game';
import { guide } from './guide';
import { SeatStone, seatName } from './theme';

export const client: GameClient<GameView, GameConfig> = {
  id: 'crown-march',
  title: 'Crown March',
  subtitle: '왕관 행진 · 2~4인 영토 보드게임',
  logo: (
    <svg viewBox="0 0 64 64" aria-hidden>
      <rect width="64" height="64" rx="14" fill="var(--ink)" />
      <path d="M14 44 L16 22 L25 32 L32 16 L39 32 L48 22 L50 44 Z" fill="var(--gold)" />
      <rect x="14" y="46" width="36" height="5" rx="2" fill="var(--gold)" />
    </svg>
  ),
  lead: (
    <>
      모두가 함께 움직이는 <b>왕관</b>을 이동 카드로 옮겨, 멈춘 칸에 내 가문의 돌을 놓으세요.
      <br />
      이어진 영토가 클수록 점수는 <b>제곱</b>으로 커집니다.
    </>
  ),
  chips: ['👥 2~4인 · 4인 팀전', '📱 각자 휴대폰으로 QR 입장', '🧩 보드 크기·돌·카드 커스텀', '⚔️ 기사로 상대 돌 뒤집기'],
  Demo: DemoBoard,
  emotes: [...BASE_EMOTES, ...EXTRA_EMOTES],
  ConfigPanel,
  Game: Game as GameClient<GameView, GameConfig>['Game'],
  seatBadge: (i) => <SeatStone seat={i} size={22} />,
  seatLabel: seatName,
  teamsEnabled: (c, n) => c.teams && n === 4,
  guide,
};
