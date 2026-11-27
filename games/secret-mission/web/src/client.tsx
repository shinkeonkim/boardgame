import { BASE_EMOTES } from '@bg/core';
import { EXTRA_EMOTES, GameConfig, GameView } from '@bg/secret-mission-engine';
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
  id: 'secret-mission',
  title: 'Secret Mission',
  subtitle: '비밀 원정대 · 5~10명이 숨은 첩자를 찾는 파티 게임',
  original: meta.original,
  logo: <Logo />,
  lead: (
    <>
      몇 명은 <b>첩자</b>예요. 원정대를 뽑고 투표하고, 몰래 낸 원정 카드로
      <br />
      누가 첩자인지 추리하세요 — 요원은 <b>3번 성공</b>, 첩자는 3번 실패시키면 승리!
    </>
  ),
  chips: ['👥 5~10명', '🕵️ 숨은 역할', '🗳️ 찬반 투표', '🔮 예언자·사냥꾼'],
  Demo,
  emotes: [...BASE_EMOTES, ...EXTRA_EMOTES],
  ConfigPanel,
  Game: Game as GameClient<GameView, GameConfig>['Game'],
  seatBadge: (i) => <SeatDot seat={i} size={20} label />,
  guide,
  accent: meta.accent,
  Cover,
  sounds: { cue: 'cueRadio', turn: 'static' },
};
