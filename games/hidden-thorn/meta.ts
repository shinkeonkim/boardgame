import type { GameMeta } from '@bg/core';

export const meta: GameMeta = {
  id: 'hidden-thorn',
  title: 'Hidden Thorn',
  subtitle: '숨은 가시',
  tagline: '장미 사이에 가시를 숨기고 「몇 장 뒤집을 수 있다」고 거는 순수 블러핑 게임',
  description: [
    '모두 장미 원판 3개와 가시 1개를 가져요. 원판을 몰래 내 앞에 쌓다가, 누군가 「장미 N장 뒤집을게」라고 도전을 시작해요.',
    '가장 높게 부른 사람은 자기 원판부터 모두 뒤집고, 남은 수만큼 남의 더미 맨 위를 뒤집어요. 모두 장미면 성공, 가시가 나오면 원판을 잃어요. 두 번 성공하면 우승.',
    '규칙은 1분이면 배우지만 눈치 싸움은 끝이 없어요. 장미·가시 개수, 우승까지 성공 횟수, 잃는 방식을 바꿀 수 있고 허풍을 섞는 봇과 할 수 있어요.',
  ],
  players: { min: 2, max: 8, best: [4, 5, 6] },
  minutes: { min: 15, max: 30 },
  weight: 1,
  tags: ['bluffing', 'party', 'big-group', 'push-your-luck', 'player-elimination'],
  inspiredBy: 'Skull (Hervé Marly) 메커니즘',
  accent: '#d84a5c',
  icon: '<rect width="64" height="64" rx="14" fill="#1f2a1e"/><circle cx="26" cy="34" r="16" fill="#f6efe2"/><circle cx="26" cy="34" r="4" fill="#f2c14e"/><path d="M46 10 L48 20 L57 18 L50 24 L56 32 L47 28 L45 38 L43 28 L34 31 L41 24 L35 17 L44 20 Z" fill="#5aa152"/>',
  status: 'live',
  addedAt: '2026-11-22',
  highlights: ['내 원판은 나만 보이는 작은 표시로', '뒤집을 더미가 반짝여요', '허풍 치는 봇'],
  customizable: ['장미 2~5 · 가시 1~2', '우승까지 성공 1~4번', '잃는 방식 2가지', '게임 수·제한시간'],
};
