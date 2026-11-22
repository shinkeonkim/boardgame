import type { GameMeta } from '@bg/core';

export const meta: GameMeta = {
  id: 'one-card',
  title: 'One Card',
  subtitle: '원카드',
  tagline: '무늬나 숫자를 맞춰 먼저 다 내는 카드 게임 — 공격 쌓기와 「원카드!」 외치기',
  description: [
    '트럼프 카드로 하는 우리에게 익숙한 원카드. 버린 카드와 무늬나 숫자가 같은 카드를 내고, 먼저 다 내면 이겨요.',
    '2·A·조커로 공격하면 다음 사람은 더 센 공격으로 막아 넘기거나 쌓인 만큼 받아요. 7은 무늬 바꾸기, J 건너뛰기, Q 방향 바꾸기, K 한 장 더. 한 장 남으면 「원카드!」 — 남이 먼저 「잡았다!」 하면 벌칙.',
    '집집마다 다른 규칙을 방장이 맞출 수 있어요: 처음 카드 수, 특수 카드 하나씩, 외치기 시간·벌칙, 파산 기준, 끝까지 순위.',
  ],
  players: { min: 2, max: 8, best: [3, 5] },
  minutes: { min: 10, max: 25 },
  weight: 1,
  tags: ['card', 'party', 'quick', 'big-group', 'hand-management', 'bot-friendly'],
  inspiredBy: '전통 카드 놀이 원카드',
  original: { ko: '원카드', en: 'One Card (Crazy Eights 계열)', by: '전통 카드 놀이' },
  accent: '#2a6a4a',
  icon: '<rect width="64" height="64" rx="14" fill="#2a6a4a"/><rect x="14" y="12" width="24" height="34" rx="4" fill="#fffaf0" transform="rotate(-10 26 29)"/><rect x="26" y="16" width="24" height="34" rx="4" fill="#fffaf0" stroke="#2a2a2a" stroke-width="0.8"/><text x="38" y="40" text-anchor="middle" font-size="18" font-weight="900" fill="#c0392b" font-family="Georgia, serif">1</text>',
  status: 'live',
  addedAt: '2026-11-23',
  highlights: ['직접 그린 트럼프 카드 (그림 카드·조커)', '낼 수 있는 카드는 올라와서 보여요', '「원카드!」 「잡았다!」 누르기 대결', '공격이 쌓이면 테이블이 빨갛게'],
  customizable: ['처음 카드 4~10장', '조커·공격·7·J·Q·K 하나씩', '외치기 시간·벌칙', '파산 기준', '한 명 / 끝까지 순위', '판 수·제한시간'],
};
