import type { GameMeta } from '@bg/core';

export const meta: GameMeta = {
  id: 'number-vault',
  title: 'Number Vault',
  subtitle: '숫자 금고',
  tagline: '오름차순으로 놓인 가려진 숫자 타일을 색과 위치로 추리해 맞히는 게임',
  description: [
    '모두 검정·하양 숫자 타일을 몇 장씩 가려 놓아요. 타일은 늘 왼쪽부터 작은 숫자 순서이고, 남에게는 색만 보여요.',
    '내 차례에 타일을 1장 가져오고, 다른 사람의 가려진 타일 하나를 골라 숫자를 맞혀요. 맞히면 공개되고 계속할 수 있고, 틀리면 가져온 타일이 공개돼요. 내 타일이 모두 공개되면 탈락.',
    '틀린 추측 기록이 타일 아래에 남아 추리가 편해요. 숫자 범위·조커·시작 타일 수·맞히면 계속·색 고르기를 바꿀 수 있고, 후보를 좁혀 가는 봇과 할 수 있어요.',
  ],
  players: { min: 2, max: 6, best: [3, 4] },
  minutes: { min: 15, max: 25 },
  weight: 1,
  tags: ['deduction', 'number', 'hidden-info', 'player-elimination', 'quick'],
  inspiredBy: '다빈치 코드 (Coda, 와카스기 에이지) 메커니즘',
  accent: '#2b2f3a',
  icon: '<rect width="64" height="64" rx="14" fill="#2b2f3a"/><rect x="10" y="16" width="13" height="30" rx="3" fill="#15171c" stroke="#5c6475" stroke-width="1.5"/><rect x="25.5" y="16" width="13" height="30" rx="3" fill="#f4f1ea"/><rect x="41" y="16" width="13" height="30" rx="3" fill="#15171c" stroke="#5c6475" stroke-width="1.5"/><circle cx="32" cy="54" r="3" fill="#e8b04a"/>',
  status: 'live',
  addedAt: '2026-11-22',
  highlights: ['타일 정렬은 자동, 추리에만 집중', '틀린 숫자가 타일 아래 남아요', '조커로 더 헷갈리게'],
  customizable: ['숫자 범위 0~5 ~ 0~15', '조커 0~2장', '시작 타일 수', '맞히면 계속', '가져올 색 고르기', '틀린 기록 표시', '판 수·제한시간'],
};
