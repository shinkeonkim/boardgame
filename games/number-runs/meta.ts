import type { GameMeta } from '@bg/core';

export const meta: GameMeta = {
  id: 'number-runs',
  title: 'Number Runs',
  subtitle: '숫자 잇기',
  tagline: '같은 색 연속·같은 숫자로 묶어 내고, 테이블을 다시 짜 손을 비우는 숫자 타일 게임',
  description: [
    '숫자 타일(4색 × 1~13 × 2벌 + 조커)을 14장씩 들고 시작해요. 같은 색 연속 3장 이상(줄)이나 같은 숫자 다른 색 3~4장(무리)으로 묶어 테이블에 내요.',
    '처음에는 내 타일만으로 합 30 이상을 내야 하고, 그 뒤로는 테이블의 묶음을 나누고 합쳐 내 타일이 들어갈 자리를 만들 수 있어요. 손을 먼저 비우면 승리, 남은 타일은 감점.',
    '테이블을 초안으로 자유롭게 고쳐 보고, 틀린 묶음은 바로 빨갛게 보여 줘요. 색·숫자·벌 수·조커·손패·처음 등록 기준을 바꿀 수 있고, 테이블에 이어 붙이는 봇과 할 수 있어요.',
  ],
  players: { min: 2, max: 6, best: [3, 4] },
  minutes: { min: 30, max: 60 },
  weight: 2,
  tags: ['number', 'tile-placement', 'hand-management', 'set-collection'],
  inspiredBy: 'Rummikub (Ephraim Hertzano) 메커니즘',
  accent: '#2b4a3e',
  icon: '<rect width="64" height="64" rx="14" fill="#2b4a3e"/><rect x="9" y="18" width="14" height="20" rx="3" fill="#fbf6ea"/><rect x="25" y="18" width="14" height="20" rx="3" fill="#fbf6ea"/><rect x="41" y="18" width="14" height="20" rx="3" fill="#fbf6ea"/><text x="16" y="32.5" text-anchor="middle" font-size="11" font-weight="900" fill="#d0453a" font-family="system-ui">7</text><text x="32" y="32.5" text-anchor="middle" font-size="11" font-weight="900" fill="#2f6fd0" font-family="system-ui">8</text><text x="48" y="32.5" text-anchor="middle" font-size="11" font-weight="900" fill="#d88a12" font-family="system-ui">9</text>',
  status: 'live',
  addedAt: '2026-11-22',
  highlights: ['테이블 초안을 자유롭게 고치고 되돌리기', '틀린 묶음이 바로 빨갛게', '처음 등록 합계 표시'],
  customizable: ['색 3~5', '숫자 1~9~13', '벌 수 1~3', '조커 0~4', '처음 손패', '처음 등록 기준(0 = 없음)', '판 수·제한시간'],
};
