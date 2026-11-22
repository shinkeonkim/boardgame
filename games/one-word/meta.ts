import type { GameMeta } from '@bg/core';

export const meta: GameMeta = {
  id: 'one-word',
  title: 'One Word',
  subtitle: '한 단어',
  tagline: '겹치지 않는 힌트 한 단어로 함께 맞히는 협력 파티 게임',
  description: [
    '모두 한 팀. 차례로 한 명이 맞히는 사람이 되고, 나머지는 단어를 보고 힌트 한 단어씩 몰래 써요.',
    '모두 쓰고 나면 같은(비슷한) 힌트는 지워지고, 맞히는 사람은 남은 힌트만 보고 한 번 답해요. 틀리면 다음 카드까지 잃어요.',
    '카드 수·단어 묶음·지워지는 기준·틀렸을 때 벌칙·시간을 바꿀 수 있어요. 직접 만든 한국어 단어 목록을 써요.',
  ],
  players: { min: 3, max: 8, best: [4, 7] },
  minutes: { min: 15, max: 25 },
  weight: 1,
  tags: ['word', 'cooperative', 'party', 'big-group', 'simultaneous'],
  inspiredBy: 'Just One (Ludovic Roudy · Bruno Sautter) 메커니즘',
  original: { ko: '저스트 원', en: 'Just One', by: 'Ludovic Roudy · Bruno Sautter' },
  accent: '#2a5a8a',
  icon: '<rect width="64" height="64" rx="14" fill="#2a5a8a"/><rect x="10" y="14" width="20" height="16" rx="3" fill="#ffe27a" transform="rotate(-6 20 22)"/><rect x="34" y="12" width="20" height="16" rx="3" fill="#a8e0c0" transform="rotate(5 44 20)"/><rect x="20" y="34" width="24" height="18" rx="3" fill="#fffaf0"/>',
  status: 'live',
  addedAt: '2026-11-23',
  highlights: ['좌석 색 메모지 힌트', '겹친 힌트에 줄이 그어져요', '13장 진행 점 막대', '지난 카드 기록'],
  customizable: ['카드 5~20장', '단어 묶음 4종', '비슷한 힌트도 / 똑같은 것만', '틀리면 다음 카드도', '힌트·맞히기 시간'],
};
