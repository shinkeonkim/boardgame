import type { GameMeta } from '@bg/core';

export const meta: GameMeta = {
  id: 'tile-atelier',
  title: 'Tile Atelier',
  subtitle: '타일 공방',
  tagline: '공장에서 한 색을 통째로 가져와 벽을 꾸미는, 이어 붙일수록 점수가 커지는 타일 게임',
  description: [
    '차례마다 공장 하나나 가운데에서 한 색의 타일을 모두 가져와 패턴 줄 하나에 놓아요. 공장에 남은 타일은 가운데로 밀려나고, 넘친 타일은 바닥으로 떨어져 감점돼요.',
    '모든 타일을 가져가면 꽉 찬 줄의 타일이 벽으로 옮겨지고, 가로·세로로 이어진 만큼 점수가 나요. 누군가 벽의 가로줄을 완성하면 끝, 가로·세로·색 보너스를 더해 승부해요.',
    '가져갈 타일을 고르면 놓을 수 있는 줄이 빛나요. 자유 벽(원작 뒷면)·색 수·공장·바닥 감점·보너스를 바꿀 수 있고, 남의 줄을 망치는 봇과 할 수 있어요.',
  ],
  players: { min: 2, max: 4, best: [2, 3] },
  minutes: { min: 30, max: 45 },
  weight: 2,
  tags: ['tile-placement', 'pattern', 'drafting', 'abstract', 'open-info'],
  inspiredBy: 'Azul (Michael Kiesling) 메커니즘',
  original: { ko: '아줄', en: 'Azul', by: 'Michael Kiesling' },
  accent: '#4a90d9',
  icon: '<rect width="64" height="64" rx="14" fill="#f3ead8"/><rect x="10" y="10" width="13" height="13" rx="3" fill="#4a90d9"/><rect x="25" y="10" width="13" height="13" rx="3" fill="#e8a33a"/><rect x="40" y="10" width="13" height="13" rx="3" fill="#2f3340"/><rect x="10" y="25" width="13" height="13" rx="3" fill="#4fae8a"/><rect x="25" y="25" width="13" height="13" rx="3" fill="#4a90d9"/><rect x="40" y="25" width="13" height="13" rx="3" fill="#e8a33a"/><rect x="10" y="40" width="13" height="13" rx="3" fill="#e0614f"/><rect x="25" y="40" width="13" height="13" rx="3" fill="#4fae8a"/><rect x="40" y="40" width="13" height="13" rx="3" fill="#4a90d9"/>',
  status: 'live',
  addedAt: '2026-11-22',
  highlights: ['놓을 수 있는 줄이 빛나요', '색마다 모양도 달라 구분이 쉬워요', '자유 벽 변형'],
  customizable: ['색 4~6 (벽 크기)', '색마다 타일·공장 수·공장마다 타일', '자유 벽', '바닥 감점 3단계', '보너스 크기', '판 수 제한', '게임 수·제한시간'],
};
