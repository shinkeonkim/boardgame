/**
 * 포털(홈페이지)의 게임 목록·검색·상세 페이지에 쓰는 게임 소개 정보.
 * 게임마다 games/<id>/meta.ts 에 하나씩 두고, apps/portal 이 모아서 보여 준다.
 */
export interface OriginalGame {
  ko: string;
  en: string;
  by: string;
}

/** 원작 표시 한 줄: 「스플렌더 (Splendor · Marc André)」 */
export const originalLabel = (o: OriginalGame) => `${o.ko} (${o.en} · ${o.by})`;
/** 원작 표시 아래 안내 */
export const ORIGINAL_NOTE = '원작의 규칙을 바탕으로 이름·그림·화면을 직접 만든 팬 제작 버전이에요. 원작 및 권리자와는 관계가 없어요.';

export interface GameMeta {
  /** URL 경로·패키지 이름에 쓰는 식별자 (예: 'expedition-lines' → /expedition-lines/) */
  id: string;
  title: string;
  /** 한국어 부제 */
  subtitle: string;
  /** 한 줄 소개 (카드·검색 결과) */
  tagline: string;
  /** 상세 페이지 소개 (문단 배열) */
  description: string[];
  players: { min: number; max: number; best?: number[] };
  /** 분 */
  minutes: { min: number; max: number };
  /** 1(가벼움) ~ 5(무거움) */
  weight: number;
  /** 검색·필터용 태그 (메커니즘·분위기) */
  tags: string[];
  /** 원작 메커니즘 출처 (이름·그림은 자체 제작) */
  inspiredBy: string;
  /** 원작 게임 이름 (한국어 · 원어 · 디자이너) — 포털·첫 화면·게임 방법에 「원작」으로 표시 */
  original?: OriginalGame;
  /** 카드·상세 페이지 색 (CSS 색) */
  accent: string;
  /** 브랜드 아이콘 SVG 마크업 (viewBox 0 0 64 64) */
  icon: string;
  /** 'live' = 플레이 가능, 'soon' = 준비 중 */
  status: 'live' | 'soon';
  /** false면 봇을 넣을 수 없는 게임 (사람끼리만). 없으면 봇과 함께 할 수 있음 — 엔진의 GameModule.bots와 맞춘다 */
  bots?: boolean;
  /** 추가된 날 (YYYY-MM-DD) — "새로 나온 게임" 정렬 */
  addedAt: string;
  /** 상세 페이지 "이런 점이 재밌어요" */
  highlights: string[];
  /** 커스텀 가능한 규칙 요약 */
  customizable: string[];
}

export const TAG_LABELS: Record<string, string> = {
  card: '카드',
  abstract: '추상 전략',
  'area-control': '땅따먹기',
  'set-collection': '세트 모으기',
  'hand-management': '손패 관리',
  'push-your-luck': '운과 배짱',
  'grid-movement': '칸 이동',
  'two-player': '둘이 하기 좋은',
  teams: '팀전',
  'open-info': '패를 모두 공개',
  'hidden-info': '내 패는 비밀',
  quick: '빠른 게임',
  party: '파티',
  simultaneous: '동시에 진행',
  luck: '운',
  'big-group': '여럿이 하기 좋은',
  cooperative: '협력',
  deduction: '추리',
  bluffing: '블러핑',
  word: '단어',
  dice: '주사위',
  drafting: '카드 고르기',
  'engine-building': '엔진 만들기',
  'tile-placement': '타일 놓기',
  pattern: '패턴 만들기',
  spatial: '공간 퍼즐',
  number: '숫자',
  memory: '기억력',
  drawing: '그림',
  'player-elimination': '탈락',
  'bot-friendly': '봇과 하기 좋은',
};

/** 봇 지원 문구 (어디서나 같은 말 — docs/ux-writing.md) */
export const botsText = (g: { bots?: boolean; players?: { min: number } }) =>
  g.bots === false
    ? {
        short: '사람끼리만',
        long: `봇이 없어요. 사람끼리 하는 게임이라 ${g.players?.min ?? 2}명 이상 모여야 시작할 수 있어요.`,
      }
    : {
        short: '봇과 함께',
        long: '사람이 모자라면 빈자리에 봇(쉬움·보통·어려움)을 넣어 함께하거나 혼자 연습할 수 있어요.',
      };
