import type { GameMeta } from '@bg/core';

export const meta: GameMeta = {
  id: 'trio-hunt',
  title: 'Trio Hunt',
  subtitle: '셋 찾기',
  tagline: '가장 작은 카드? 가장 큰 카드? 같은 숫자 세 장을 뒤집어 모으는 기억력 게임',
  description: [
    '1~12 카드가 세 장씩. 손패는 작은 숫자부터 정렬돼 있어요. 차례에 누군가의 가장 작은·가장 큰 카드나 가운데 카드를 계속 뒤집어 같은 숫자를 이어 가요.',
    '세 장이 모이면 세트! 다른 숫자가 나오면 다시 덮이니, 뒤집혔던 카드를 기억하는 게 핵심이에요. 세트 3개 또는 7 세 장이면 승리.',
    '모을 세트 수, 7 즉시 승리, 가운데 카드 수를 바꿀 수 있어요. 봇은 난이도에 따라 기억력이 달라요.',
  ],
  players: { min: 3, max: 6, best: [4, 5] },
  minutes: { min: 10, max: 20 },
  weight: 1,
  tags: ['card', 'memory', 'deduction', 'quick', 'bot-friendly'],
  inspiredBy: 'Trio (Kaya Miyano) 메커니즘',
  original: { ko: '트리오', en: 'Trio', by: 'Kaya Miyano' },
  accent: '#3a4ab0',
  icon: '<rect width="64" height="64" rx="14" fill="#2a2440"/><rect x="10" y="16" width="20" height="30" rx="4" fill="#fffaf0" transform="rotate(-8 20 31)"/><rect x="22" y="12" width="20" height="30" rx="4" fill="#fffaf0"/><rect x="34" y="16" width="20" height="30" rx="4" fill="#fffaf0" transform="rotate(8 44 31)"/><text x="32" y="33" text-anchor="middle" font-size="15" font-weight="900" fill="#1f6fb0" font-family="Georgia, serif">7</text>',
  status: 'live',
  addedAt: '2026-11-23',
  highlights: ['숫자마다 색과 무늬', '양 끝 버튼으로 작은·큰 카드 뒤집기', '틀려서 덮인 카드도 잠깐 보여 줘요', '모은 세트가 쌓여 보여요'],
  customizable: ['세트 2~4개', '7 즉시 승리', '가운데 카드 수', '판 수·제한시간'],
};
