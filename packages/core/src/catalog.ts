/**
 * 포털(홈페이지)의 게임 목록·검색·상세 페이지에 쓰는 게임 소개 정보.
 * 게임마다 games/<id>/meta.ts 에 하나씩 두고, apps/portal 이 모아서 보여 준다.
 */
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
  /** 카드·상세 페이지 색 (CSS 색) */
  accent: string;
  /** 브랜드 아이콘 SVG 마크업 (viewBox 0 0 64 64) */
  icon: string;
  /** 'live' = 플레이 가능, 'soon' = 준비 중 */
  status: 'live' | 'soon';
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
};
