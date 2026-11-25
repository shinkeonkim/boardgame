import type { GameMeta } from '@bg/core';

export const meta: GameMeta = {
  id: 'hearts',
  title: 'Hearts',
  subtitle: '하트',
  tagline: '하트와 스페이드 Q 를 피해 가며 트릭을 내주는 고전 카드 게임 — 점수가 낮을수록 이겨요',
  description: [
    '처음 낸 무늬를 따라 한 장씩 내고, 가장 높은 카드를 낸 사람이 그 트릭을 가져가요. 가져간 하트는 1점, 스페이드 Q 는 13점 — 점수는 적을수록 좋아요.',
    '판마다 카드 3장을 옆 사람에게 건네고 시작해요. 하트는 누가 버리기 전까지 먼저 낼 수 없고, 하트 13장과 스페이드 Q 를 혼자 모두 먹으면 「문 쏘기」로 나머지가 26점을 받아요.',
    '3~6명까지 (인원에 맞춰 낮은 카드를 빼요). 목표 점수, 건네기, 문 쏘기, 다이아 J -10 변형을 고를 수 있고, 점수를 피하는 봇과 할 수 있어요.',
  ],
  players: { min: 3, max: 6, best: [4] },
  minutes: { min: 20, max: 40 },
  weight: 2,
  tags: ['card', 'hidden-info', 'hand-management', 'bot-friendly'],
  inspiredBy: '전통 트럼프 게임 하트(Hearts)',
  original: { ko: '하트', en: 'Hearts', by: '전통 카드 게임' },
  accent: '#c0392b',
  icon: '<rect width="64" height="64" rx="14" fill="#1f5a3a"/><rect x="12" y="12" width="24" height="34" rx="4" fill="#fffaf0" transform="rotate(-12 24 29)"/><rect x="28" y="16" width="24" height="34" rx="4" fill="#fffaf0" transform="rotate(10 40 33)"/><path d="M40 30c-3-5-10-3-9 3 1 4 6 7 9 10 3-3 8-6 9-10 1-6-6-8-9-3z" fill="#d0453a"/><text x="17" y="30" font-size="12" font-weight="900" fill="#1f2430" font-family="Georgia, serif" transform="rotate(-12 24 29)">Q</text>',
  status: 'live',
  addedAt: '2026-11-26',
  highlights: ['낼 수 있는 카드만 밝게', '트릭이 끝나면 카드가 가져간 사람 쪽으로', '먹은 하트·스페이드 Q 가 자리마다 보여요', '점수를 피하는 봇'],
  customizable: ['목표 점수 30~150', '3장 건네기 켜고 끄기', '문 쏘기', '다이아 J -10', '차례 제한시간'],
};
