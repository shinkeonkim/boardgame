import type { GameMeta } from '@bg/core';

export const meta: GameMeta = {
  id: 'crown-march',
  title: 'Crown March',
  subtitle: '왕관 행진',
  tagline: '모두 함께 쓰는 왕관을 옮기며 내 땅을 넓히는 전략 게임',
  description: [
    '보드 위의 왕관 하나를 모두가 함께 움직여요. 공개된 이동 카드(방향 + 거리)를 내서 왕관을 옮기고, 멈춘 빈 칸에 내 가문의 돌을 놓아요.',
    '상하좌우로 이어진 영역마다 칸 수의 제곱이 점수라, 작은 땅 여럿보다 큰 땅 하나가 훨씬 유리해요. 기사 카드로 상대 돌을 뒤집어 큰 영토를 끊을 수도 있어요.',
    '모든 카드가 공개되어 있어 상대가 무엇을 할 수 있는지 보면서 두는 수 싸움이 핵심이에요. 3~4명과 2:2 팀전, 보드 크기·막힌 칸 같은 변형도 지원해요.',
  ],
  players: { min: 2, max: 4, best: [2] },
  minutes: { min: 20, max: 30 },
  weight: 2,
  tags: ['abstract', 'area-control', 'grid-movement', 'two-player', 'teams', 'open-info'],
  inspiredBy: '장미전쟁 (Rosenkönig, Dirk Henn) 메커니즘',
  original: { ko: '장미전쟁', en: 'Rosenkönig (The Rose King)', by: 'Dirk Henn' },
  accent: '#c43c3c',
  icon: '<rect width="64" height="64" rx="14" fill="#1b1a17"/><path d="M14 44 L16 22 L25 32 L32 16 L39 32 L48 22 L50 44 Z" fill="#d9a441"/><rect x="14" y="46" width="36" height="5" rx="2" fill="#d9a441"/>',
  status: 'live',
  addedAt: '2026-11-21',
  highlights: ['카드를 고르면 왕관이 갈 경로가 바로 보여요', '기사로 상대 영토 한가운데를 뒤집는 한 방', '보드 크기·막힌 칸으로 매번 다른 지도'],
  customizable: ['보드 5×5~13×13', '공용 돌 개수', '막힌 칸', '이동 거리·대각선', '카드 벌 수·손패', '기사 카드 수', '손패 공개 여부', '점수 방식', '판 수·턴 제한시간', '2:2 팀전'],
};
