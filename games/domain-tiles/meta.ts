import type { GameMeta } from '@bg/core';

export const meta: GameMeta = {
  id: 'domain-tiles',
  title: 'Domain Tiles',
  subtitle: '영지 도미노',
  tagline: '땅 도미노를 골라 5×5 왕국을 짓는 가벼운 타일 게임 — 같은 땅 크기 × 왕관이 점수',
  description: [
    '줄에 깔린 땅 도미노 중 하나를 골라요. 번호가 작은(평범한) 도미노를 고르면 다음에 먼저 두고, 큰(왕관이 있는) 도미노를 고르면 나중에 둬요.',
    '고른 도미노는 내 왕국에 놓아요. 성이나 같은 땅에 한 칸 이상 닿아야 하고, 왕국은 5×5 를 넘을 수 없어요. 놓을 곳이 없으면 버려요.',
    '끝나면 같은 땅으로 이어진 구역마다 칸 수 × 왕관 수가 점수예요. 2~4명, 7×7 큰 왕국(2명)과 보너스 규칙을 고를 수 있고, 땅을 키우는 봇과 할 수 있어요.',
  ],
  players: { min: 2, max: 4, best: [2, 4] },
  minutes: { min: 15, max: 25 },
  weight: 2,
  tags: ['tile-placement', 'drafting', 'spatial', 'open-info', 'bot-friendly'],
  inspiredBy: 'Kingdomino (Bruno Cathala) 메커니즘',
  original: { ko: '킹도미노', en: 'Kingdomino', by: 'Bruno Cathala' },
  accent: '#4a8f3a',
  icon: '<rect width="64" height="64" rx="14" fill="#2b3a22"/><rect x="10" y="10" width="14" height="14" rx="2" fill="#e5c24a"/><rect x="25" y="10" width="14" height="14" rx="2" fill="#e5c24a"/><rect x="40" y="10" width="14" height="14" rx="2" fill="#2f7a3a"/><rect x="10" y="25" width="14" height="14" rx="2" fill="#3b7be0"/><rect x="25" y="25" width="14" height="14" rx="2" fill="#f4ece0"/><rect x="40" y="25" width="14" height="14" rx="2" fill="#2f7a3a"/><rect x="10" y="40" width="14" height="14" rx="2" fill="#3b7be0"/><rect x="25" y="40" width="14" height="14" rx="2" fill="#8ccf5a"/><rect x="40" y="40" width="14" height="14" rx="2" fill="#6b6f78"/><path d="M28 31l2.5 3 1.5-4 1.5 4 2.5-3-1 6h-6z" fill="#d4a017"/>',
  status: 'live',
  addedAt: '2026-11-26',
  highlights: ['칸 두 번 눌러 놓기 (첫 칸 → 옆 칸) · 반대로 돌리기', '놓을 수 있는 칸만 밝게', '지금 줄·다음 줄 한눈에', '땅을 키우는 봇'],
  customizable: ['5×5 / 7×7(2명) 왕국', '성이 가운데면 +10', '꽉 채우면 +5', '판 수·제한시간'],
};
