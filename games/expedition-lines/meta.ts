import type { GameMeta } from '@bg/core';

export const meta: GameMeta = {
  id: 'expedition-lines',
  title: 'Expedition Lines',
  subtitle: '탐험대',
  tagline: '같은 색 카드를 작은 숫자부터 쌓아 탐험대를 키우는 카드 게임',
  description: [
    '다섯 지역(사막·심해·설산·밀림·화산)으로 탐험대를 보내 점수를 모아요. 탐험대는 같은 색 카드를 작은 숫자부터 큰 숫자 순서로 쌓은 줄이에요.',
    '시작한 탐험대는 비용 20점을 먼저 내야 해서, 끝까지 키울 수 있는 곳에만 걸어야 해요. 투자 카드로 점수를 두세 배로 불릴 수도 있지만 손해도 같이 커져요.',
    '버린 카드는 상대가 주워 갈 수 있어 무엇을 버릴지가 늘 고민이에요. 원작은 2명용이지만 3~4명과 2:2 팀전도 지원해요.',
  ],
  players: { min: 2, max: 4, best: [2] },
  minutes: { min: 15, max: 30 },
  weight: 2,
  tags: ['card', 'hand-management', 'set-collection', 'push-your-luck', 'two-player', 'teams', 'hidden-info'],
  inspiredBy: '로스트 시티 (Reiner Knizia) 메커니즘',
  original: { ko: '로스트 시티', en: 'Lost Cities', by: 'Reiner Knizia' },
  accent: '#e2a72e',
  icon: '<rect width="64" height="64" rx="14" fill="#1b1a17"/><path d="M14 46 L26 26 L34 36 L42 22 L52 46 Z" fill="#e2a72e"/><circle cx="46" cy="16" r="5" fill="#f4ece0"/>',
  status: 'live',
  addedAt: '2026-11-21',
  highlights: ['카드를 끌어다 탐험대에 놓는 손맛', '버림 더미를 펼쳐 보며 상대 수 읽기', '투자 카드로 크게 걸지, 안전하게 갈지'],
  customizable: ['색 2~6개', '숫자 범위', '색당 투자 카드', '덱 배수', '손패', '탐험대 비용·보너스', '판 수', '턴 제한시간', '2:2 팀전'],
};
