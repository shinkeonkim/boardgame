import TAG_LABEL_DATA from './tag-labels.json';
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

/** 태그 → 한국어 이름. JSON 으로 둔 까닭: Vite 설정(Node가 TS 없이 읽음)의 SEO 플러그인도 같은 표를 쓴다 */
export const TAG_LABELS: Record<string, string> = TAG_LABEL_DATA;

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
