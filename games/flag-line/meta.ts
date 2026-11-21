import type { GameMeta } from '@bg/core';

export const meta: GameMeta = {
  id: 'flag-line',
  title: 'Flag Line',
  subtitle: '깃발 전선',
  tagline: '아홉 깃발을 사이에 두고 3장 대형(쐐기·방진·대대…)으로 겨루는 2인 진지전',
  description: [
    '두 사람 사이에 깃발 9개가 놓여요. 차례마다 손패에서 1장을 깃발 하나의 내 쪽에 놓고 1장을 뽑아요.',
    '깃발마다 3장으로 포커 같은 대형(같은 색 연속 > 같은 숫자 > 같은 색 > 연속 > 아무거나)을 만들고, 상대가 남은 카드로 절대 못 이기면 그 깃발을 차지해요. 깃발 5개나 나란히 3개면 승리.',
    '보드에 나오지 않은 카드를 모두 계산해 확정된 깃발을 자동으로 차지해 줘요. 깃발·대형 크기·색·숫자·승리 조건을 바꿀 수 있고, 4명이면 2:2 팀전으로도 해요.',
  ],
  players: { min: 2, max: 4, best: [2] },
  minutes: { min: 20, max: 30 },
  weight: 2,
  tags: ['card', 'two-player', 'hand-management', 'teams', 'abstract'],
  inspiredBy: 'Battle Line / Schotten Totten (Reiner Knizia) 메커니즘',
  accent: '#3a7bd5',
  icon: '<rect width="64" height="64" rx="14" fill="#1e2630"/><g transform="translate(8 18)"><rect x="3" width="1.6" height="26" fill="#cfd6e0"/><path d="M4.6 1 L12 3 L4.6 6 Z" fill="#d0533f"/></g><g transform="translate(30 18)"><rect x="3" width="1.6" height="26" fill="#cfd6e0"/><path d="M4.6 1 L12 3 L4.6 6 Z" fill="#8792a2"/></g><g transform="translate(41 18)"><rect x="3" width="1.6" height="26" fill="#cfd6e0"/><path d="M4.6 1 L12 3 L4.6 6 Z" fill="#3a7bd5"/></g>',
  status: 'live',
  addedAt: '2026-11-22',
  highlights: ['남은 카드를 모두 따져 깃발을 자동으로 차지', '완성된 대형 이름 표시', '2:2 팀전'],
  customizable: ['깃발 5~11', '대형 2~4장', '색 4~6 · 숫자 1~8~12', '손패', '이기는 깃발 수·연속 조건', '자동 차지', '판 수·제한시간'],
};
