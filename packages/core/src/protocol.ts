/** 서버 ↔ 클라이언트 공용 타입 (모든 게임 공통) */
import type { BotLevel } from './bot';

export interface MemberPublic {
  id: string;
  name: string;
  role: 'player' | 'spectator';
  seat: number | null;
  connected: boolean;
  /** 끝난 매치의 결과 화면을 아직 보고 있음 */
  inResults: boolean;
  /** 연결이 끊긴 지 몇 ms 지났는지 (접속 중이면 null) */
  awayMs: number | null;
  isHost: boolean;
  /** 봇이면 난이도 (사람이면 null) */
  bot: BotLevel | null;
}

export interface PausedInfo {
  /** 중지 당시 판 (1부터) / 전체 판 수 */
  round: number;
  rounds: number;
  /** 그 판이 이미 끝난 상태였는지 */
  roundOver: boolean;
  /** 자리 순서대로 이름과 끝난 판까지의 누적 점수 */
  players: { name: string; total: number }[];
  /** 설정이 중지 당시와 같은지 — 같으면 하던 판 그대로, 다르면 끝난 판 점수만 이어 새 판 */
  sameConfig: boolean;
  /** 이어갈 수 없는 이유 (없으면 null) */
  blocked: string | null;
}

export interface RoomView<GameView = unknown, Config = unknown> {
  code: string;
  hasPassword: boolean;
  /** 친구 방 목록(첫 화면)에 보이는지 */
  listed: boolean;
  you: string;
  hostId: string;
  members: MemberPublic[];
  config: Config;
  lobby: {
    playerCount: number;
    minPlayers: number;
    maxPlayers: number;
    /** 로비 아래 한 줄 요약 */
    summary: string;
    warnings: string[];
    /** 게임이 로비에서 쓰는 추가 숫자 */
    info: Record<string, number>;
    /** 시작할 수 없는 이유 */
    errors: string[];
    /** 아직 결과 화면에 있는 플레이어 이름 (방장이 기다리지 않고 시작 가능) */
    inResults: string[];
    /** 방장이 중지한 게임 — 이어서 하기 가능 */
    paused: PausedInfo | null;
  };
  game: GameView | null;
  /** seat → 이름 */
  seats: string[];
  /** 턴 제한시간이 있을 때 남은 ms (서버 기준 — 기기 시계 오차 무관) */
  turnRemainingMs: number | null;
  /** 지금 둘 수 있는 좌석들 (동시 진행 게임이면 여럿) */
  actors: number[];
  /** 차례인 사람이 끊겨서 다른 사람이 대신 진행할 수 있기까지 남은 ms (해당 없으면 null) */
  nudgeInMs: number | null;
}

/** 무중단 배포로 서버를 교체하는 동안의 안내 (클라이언트는 이 오류면 잠시 뒤 다시 시도) */
export const DRAIN_MESSAGE = '새 버전으로 바꾸는 중이에요. 잠시 뒤 자동으로 이어져요';

export interface EmoteDef {
  id: string;
  text: string;
  /** 말풍선 특수 움직임 (teabag: 위아래로 담갔다 빼기) */
  anim?: 'teabag';
}

/** 모든 게임 공통 감정 표현. 게임은 extraEmotes로 몇 개를 더할 수 있다 */
export const BASE_EMOTES: EmoteDef[] = [
  // 이모지만 (팔레트 위쪽 격자)
  { id: 'thumbs', text: '👍' },
  { id: 'clap', text: '👏' },
  { id: 'lol', text: '😂' },
  { id: 'wow', text: '😮' },
  { id: 'scream', text: '😱' },
  { id: 'think', text: '🤔' },
  { id: 'cry', text: '😭' },
  { id: 'fire', text: '🔥' },
  { id: 'cool', text: '😎' },
  { id: 'pray', text: '🙏' },
  { id: 'teabag', text: '🍵', anim: 'teabag' },
  { id: 'clown', text: '🤡' },
  // 짧은 말 — 친구끼리 보드게임하며 실제로 하는 말 (docs/ux-writing.md 5절)
  { id: 'please', text: '잘 부탁해요 🙌' },
  { id: 'nice', text: '오 나이스 👍' },
  { id: 'close', text: '아 아깝다 😫' },
  { id: 'hmm', text: '어떡하지… 🤔' },
  { id: 'hurry', text: '빨리 좀~ ⏳' },
  { id: 'wait', text: '잠깐만! ✋' },
  { id: 'again', text: '한 판 더? 🔁' },
  { id: 'gg', text: '줴줴이야 👋' },
  // 약올리기 (놀리되 상처 주지 않게)
  { id: 'meh', text: '메롱 😜' },
  { id: 'best', text: '그게 최선이야? 😏' },
  { id: 'yawn', text: '하품 나와 🥱' },
  { id: 'plan', text: '다 계획대로야 😎' },
  { id: 'shaking', text: '쫄았지? 🫣' },
  { id: 'ez', text: '너무 쉬운데? 💅' },
];

export interface EmoteEvent {
  /** 보낸 멤버 id */
  from: string;
  name: string;
  /** 게임 좌석 (관전자/로비면 null) */
  seat: number | null;
  id: string;
  /** 같은 이모트를 구분하기 위한 일련번호 */
  n: number;
}

/** 첫 화면 「친구 방에 들어가기」의 방 목록 한 줄 (GET <base>/api/rooms) */
export interface RoomListing {
  code: string;
  host: string;
  players: number;
  maxPlayers: number;
  bots: number;
  spectators: number;
  hasPassword: boolean;
  /** lobby=대기실, playing=게임 중, paused=멈춤 */
  state: 'lobby' | 'playing' | 'paused';
  /** 게임 중이면 판 (1부터) / 전체 판 */
  round: number | null;
  rounds: number;
  /** 빈자리가 있어 플레이어로 들어갈 수 있는지 */
  open: boolean;
}
