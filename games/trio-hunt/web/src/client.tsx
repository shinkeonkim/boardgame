import { BASE_EMOTES } from '@bg/core';
import { EXTRA_EMOTES, GameConfig, GameView } from '@bg/trio-hunt-engine';
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
  id: 'trio-hunt',
  title: 'Trio Hunt',
  subtitle: '셋 찾기 · 3~6명이 하는 기억력 카드 게임',
  original: meta.original,
  logo: <Logo />,
  lead: (
    <>
      누군가의 <b>가장 작은 카드</b>나 <b>가장 큰 카드</b>를 뒤집어
      <br />
      같은 숫자 세 장을 이어 찾으세요 — <b>7 세 장</b>이면 바로 승리!
    </>
  ),
  chips: ['👥 3~6명', '🧠 기억력', '🔢 정렬된 손패 추리', '7️⃣ 즉시 승리'],
  Demo,
  emotes: [...BASE_EMOTES, ...EXTRA_EMOTES],
  ConfigPanel,
  Game: Game as GameClient<GameView, GameConfig>['Game'],
  seatBadge: (i) => <SeatDot seat={i} size={20} label />,
  guide,
  accent: meta.accent,
  Cover,
  sounds: { cue: 'cueKalimba', turn: 'pop' },
};
