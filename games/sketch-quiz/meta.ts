import type { GameMeta } from '@bg/core';

export const meta: GameMeta = {
  id: 'sketch-quiz',
  title: 'Sketch Quiz',
  subtitle: '그림 퀴즈',
  tagline: '한 명이 그리고 모두가 맞히는 실시간 그림 퀴즈 — 초성 힌트와 우리끼리 단어',
  description: [
    '차례대로 한 명이 단어 보기 중 하나를 골라 그림판에 그려요. 나머지는 채팅으로 답을 적어, 먼저 맞힐수록 큰 점수를 얻어요.',
    '그린 사람은 맞힌 사람마다 점수를 받아요. 시간이 지나면 초성, 더 지나면 한 글자가 힌트로 나오고, 한 글자 차이면 「아깝다!」라고 알려 줘요.',
    '그리는 시간·횟수·힌트를 바꿀 수 있고, 방장이 우리끼리 단어를 직접 넣을 수도 있어요. 봇은 맞히기만 해요.',
  ],
  players: { min: 2, max: 10, best: [4, 8] },
  minutes: { min: 10, max: 30 },
  weight: 1,
  tags: ['party', 'drawing', 'big-group', 'simultaneous', 'word'],
  inspiredBy: 'Pictionary 메커니즘',
  original: { ko: '픽셔너리', en: 'Pictionary', by: 'Robert Angel' },
  accent: '#2c6fa8',
  icon: '<rect width="64" height="64" rx="14" fill="#2c6fa8"/><rect x="9" y="12" width="46" height="36" rx="4" fill="#fffdf6"/><path d="M16 38 q6 -14 12 -4 t12 -6" stroke="#c0392b" stroke-width="3.5" fill="none" stroke-linecap="round"/><circle cx="44" cy="22" r="4" fill="#f1c40f"/><path d="M40 54 l14 -14 l4 4 l-14 14 z" fill="#f1a33a"/>',
  status: 'live',
  addedAt: '2026-11-23',
  highlights: ['손가락·마우스로 그리는 실시간 그림판', '색·굵기·지우개·되돌리기', '초성 → 한 글자 힌트', '정답을 품은 말은 자동으로 가림'],
  customizable: ['그리는 횟수·시간', '고를 단어 수', '힌트 켜고 끄기', '단어 묶음 / 직접 넣은 단어'],
};
