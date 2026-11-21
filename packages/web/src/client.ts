import type { ComponentType, ReactNode } from 'react';
import type { EmoteDef, EmoteEvent, RoomView } from '@bg/core';

/** 서버 요청 (실패하면 토스트를 띄우고 false) */
export type Act = (event: string, payload?: object) => Promise<boolean>;

export interface GameScreenProps<V = unknown, C = unknown> {
  view: RoomView<V, C>;
  act: Act;
  onLeave: () => void;
  /** 짧은 안내 토스트 */
  notify: (msg: string) => void;
  emotes: EmoteEvent[];
  onEmote: (id: string) => void;
}

export interface ConfigPanelProps<C = unknown> {
  view: RoomView<unknown, C>;
  config: C;
  isHost: boolean;
  /** 방장만: 설정 일부 바꾸기 */
  set: (patch: Partial<C>) => void;
}

export interface GuideSection {
  id: string;
  title: string;
  content: ReactNode;
}

/**
 * 게임 하나의 웹 클라이언트 정의. games/<id>/web/src/main.tsx 에서 mountGame(client)로 띄운다.
 * 플랫폼(@bg/web)이 첫 화면·초대 입장·로비·재접속·게임 방법 모달 틀을 그리고,
 * 게임은 아래 슬롯만 채운다.
 */
export interface GameClient<V = unknown, C = unknown> {
  id: string;
  title: string;
  /** 첫 화면 브랜드 아래 한 줄 */
  subtitle: string;
  /** 브랜드 아이콘 (48×48 정도 SVG) */
  logo: ReactNode;
  /** 첫 화면 소개 문단 */
  lead: ReactNode;
  /** 첫 화면 특징 칩 */
  chips: string[];
  /** 첫 화면 왼쪽 시연 애니메이션 */
  Demo: ComponentType;
  /** 공통 + 게임 전용 감정 표현 */
  emotes: EmoteDef[];
  /** 로비 오른쪽 규칙 설정 패널 (프리셋·스텝퍼·토글) */
  ConfigPanel: ComponentType<ConfigPanelProps<C>>;
  /** 게임 화면 (매치가 있을 때) */
  Game: ComponentType<GameScreenProps<V, C>>;
  /** 로비 플레이어 목록 좌석 표시 (기본: 번호) */
  seatBadge?: (seat: number) => ReactNode;
  /** 로비 플레이어 이름 옆 보조 표시 (예: "진홍 가문") */
  seatLabel?: (seat: number) => string;
  /** 로비 시작 막대 위 경고·팀 안내 등 */
  teamsEnabled?: (config: C, players: number) => boolean;
  /** 앱 맨 위에 한 번 그리는 것 (예: 카드 그림용 SVG defs) */
  Globals?: ComponentType;
  /** 게임 방법 모달 */
  guide: { subtitle: string; icon: ReactNode; sections: GuideSection[] };
}
