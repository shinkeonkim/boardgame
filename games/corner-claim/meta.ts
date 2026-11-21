import type { GameMeta } from '@bg/core';

export const meta: GameMeta = {
  id: 'corner-claim',
  title: 'Corner Claim',
  subtitle: '모서리 땅따먹기',
  tagline: '내 조각끼리는 모서리로만 — 21개 조각을 펼쳐 판을 차지하는 공간 퍼즐',
  description: [
    '색마다 1칸부터 5칸까지 조각 21개를 가지고 귀퉁이에서 시작해요. 새 조각은 내 색과 꼭짓점으로만 닿고 변으로는 닿으면 안 돼요.',
    '놓을 곳이 없어지면 그 색은 끝. 모든 색이 끝나면 손에 남은 칸이 적은 사람이 이겨요(다 놓으면 보너스).',
    '조각을 고르면 판 위에 놓일 자리와 안 되는 이유가 바로 보여요(회전 R·뒤집기 F). 4색 2~4명, 둘이서 14×14, 판 크기·조각 수·점수 방식을 바꿀 수 있어요.',
  ],
  players: { min: 2, max: 4, best: [4] },
  minutes: { min: 20, max: 30 },
  weight: 2,
  tags: ['spatial', 'abstract', 'tile-placement', 'area-control', 'open-info'],
  inspiredBy: 'Blokus (Bernard Tavitian) 메커니즘',
  accent: '#3a7bd5',
  icon: '<rect width="64" height="64" rx="14" fill="#eef0f4"/><rect x="8" y="8" width="10" height="10" rx="2" fill="#3a7bd5"/><rect x="18" y="18" width="10" height="10" rx="2" fill="#3a7bd5"/><rect x="46" y="8" width="10" height="10" rx="2" fill="#e0a526"/><rect x="36" y="18" width="10" height="10" rx="2" fill="#e0a526"/><rect x="46" y="46" width="10" height="10" rx="2" fill="#d0453a"/><rect x="36" y="36" width="10" height="10" rx="2" fill="#d0453a"/><rect x="8" y="46" width="10" height="10" rx="2" fill="#2f9e6a"/>',
  status: 'live',
  addedAt: '2026-11-22',
  highlights: ['놓일 자리 미리보기와 안 되는 이유', '2명이면 두 색씩·둘이서 모드', '상대 모서리를 막는 봇'],
  customizable: ['4색/둘이서', '판 크기 12~22', '조각 21/15/9개', '점수 방식', '판 수·제한시간'],
};
