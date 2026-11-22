import type { GameMeta } from '@bg/core';

export const meta: GameMeta = {
  id: 'gem-guild',
  title: 'Gem Guild',
  subtitle: '보석 상단',
  tagline: '보석으로 카드를 사고, 카드 보너스로 더 비싼 카드를 사는 엔진 만들기 게임',
  description: [
    '차례마다 보석을 가져오거나(다른 색 3개 또는 같은 색 2개), 카드를 예약하거나(황금 조커 획득), 카드를 사요.',
    '산 카드는 그 색 보석을 영원히 1개씩 할인해 줘요. 할인이 쌓이면 비싼 고득점 카드도 쉽게 사고, 원하는 보너스를 모으면 귀족이 찾아와 3점을 더해요. 15점에 닿으면 그 바퀴까지 하고 끝.',
    '카드 90장·귀족 10명은 이 사이트에서 직접 설계했어요. 목표 점수·귀족·보석 수·한도·시장 크기를 바꿀 수 있고, 남이 노리는 카드를 예약해 막는 봇과 할 수 있어요.',
  ],
  players: { min: 2, max: 6, best: [3, 4] },
  minutes: { min: 30, max: 45 },
  weight: 2,
  tags: ['engine-building', 'set-collection', 'card', 'open-info'],
  inspiredBy: 'Splendor (Marc André) 메커니즘',
  original: { ko: '스플렌더', en: 'Splendor', by: 'Marc André' },
  accent: '#3a7bd5',
  icon: '<rect width="64" height="64" rx="14" fill="#232035"/><path d="M32 12 L48 26 L32 52 L16 26 Z" fill="#3a7bd5" stroke="#9cc0f5" stroke-width="2"/><circle cx="49" cy="47" r="7" fill="#e3b04a" stroke="#a17a1e" stroke-width="2"/>',
  status: 'live',
  addedAt: '2026-11-22',
  highlights: ['지금 살 수 있는 카드가 초록으로', '보너스(영구 할인)가 한눈에', '직접 설계한 카드 세트'],
  customizable: ['목표 점수 8~25', '귀족 수·없음', '보석 수·황금·들기 한도', '같은 색 2개 조건', '시장 카드 수·예약 한도', '판 수·제한시간'],
};
