import type { GameMeta } from '@bg/core';

export const meta: GameMeta = {
  id: 'pass-the-plate',
  title: 'Pass the Plate',
  subtitle: '접시 돌리기',
  tagline: '한 접시 고르고 나머지는 옆으로 — 동시에 고르며 세트를 모으는 회전 요리 게임',
  description: [
    '모두 손패에서 접시 하나를 몰래 골라 동시에 공개하고, 남은 손패는 옆 사람에게 넘겨요. 손패가 돌고 돌며 줄어들어요.',
    '튀김 2개 5점, 회 3개 10점, 만두는 모을수록 크게, 초밥은 겨자 위에서 3배, 김밥은 줄 수 경쟁. 3판 합계에 마지막 푸딩 보너스로 승부해요.',
    '동시에 고르니 8명이 해도 빨라요. 요리 묶음(메뉴)·판 수·손패·넘기는 방향을 바꿀 수 있고, 남이 노리는 접시를 가로채는 봇과 할 수 있어요.',
  ],
  players: { min: 2, max: 8, best: [4, 5] },
  minutes: { min: 15, max: 20 },
  weight: 1,
  tags: ['drafting', 'set-collection', 'simultaneous', 'card', 'party', 'big-group'],
  inspiredBy: 'Sushi Go! (Phil Walker-Harding) 메커니즘',
  accent: '#d79a1e',
  icon: '<rect width="64" height="64" rx="14" fill="#2b2420"/><ellipse cx="32" cy="38" rx="22" ry="9" fill="#f6efe2"/><ellipse cx="32" cy="36" rx="16" ry="6" fill="#e8dcc2"/><rect x="22" y="26" width="20" height="9" rx="4" fill="#f4a261"/><rect x="22" y="31" width="20" height="4" rx="2" fill="#fff"/><path d="M48 14 L28 30" stroke="#c0703a" stroke-width="2.5" stroke-linecap="round"/>',
  status: 'live',
  addedAt: '2026-11-22',
  highlights: ['8명까지 동시에', '먹은 접시가 묶음별로 정리되고 점수 미리보기', '방장이 메뉴를 고르는 변형'],
  customizable: ['메뉴(요리 묶음 8가지) 켜고 끄기', '판 수 1~5', '손패 장수', '넘기는 방향', '공개 전 바꾸기', '남의 접시 공개', '고르는 시간'],
};
