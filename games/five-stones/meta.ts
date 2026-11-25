import type { GameMeta } from '@bg/core';

export const meta: GameMeta = {
  id: 'five-stones',
  title: 'Five Stones',
  subtitle: '오목',
  tagline: '흑과 백이 번갈아 돌을 놓아 먼저 다섯 개를 한 줄로 잇는 고전 두뇌 게임',
  description: [
    '흑이 먼저, 번갈아 판의 빈 교차점에 돌을 하나씩 놓아요. 가로·세로·대각선 어느 쪽이든 내 돌 다섯 개를 먼저 한 줄로 이으면 이겨요.',
    '상대의 열린 셋·넷을 막으면서 동시에 내 줄을 두 갈래로 만드는 것이 이기는 길이에요. 놓을 자리는 폰에서 한 번 누르면 미리 보이고, 한 번 더 누르면 놓여요.',
    '13·15·19줄 판, 「딱 다섯만 승리(장목 무효)」 규칙, 흑백을 바꿔 가며 3판 2선승을 고를 수 있어요. 수를 읽는 봇과 연습할 수도 있어요.',
  ],
  players: { min: 2, max: 2, best: [2] },
  minutes: { min: 5, max: 20 },
  weight: 2,
  tags: ['abstract', 'two-player', 'open-info', 'quick', 'bot-friendly'],
  inspiredBy: '전통 놀이 오목(五目)',
  original: { ko: '오목', en: 'Gomoku', by: '전통 놀이' },
  accent: '#9a6a2f',
  icon: '<rect width="64" height="64" rx="14" fill="#d9a65a"/><path d="M12 16h40M12 26h40M12 36h40M12 46h40M16 12v40M26 12v40M36 12v40M46 12v40" stroke="#5a3c16" stroke-width="1.6"/><circle cx="16" cy="46" r="5.5" fill="#1b1a17"/><circle cx="26" cy="36" r="5.5" fill="#1b1a17"/><circle cx="36" cy="26" r="5.5" fill="#1b1a17"/><circle cx="46" cy="16" r="5.5" fill="#1b1a17"/><circle cx="26" cy="16" r="5.5" fill="#fffaf1" stroke="#5a3c16"/><circle cx="46" cy="36" r="5.5" fill="#fffaf1" stroke="#5a3c16"/>',
  status: 'live',
  addedAt: '2026-11-26',
  highlights: ['폰에서는 눌러서 미리 보고 한 번 더 눌러 놓기', '방금 둔 돌·이긴 다섯 줄 표시', '수를 읽는 봇 (쉬움은 가끔 실수)'],
  customizable: ['13 · 15 · 19줄 판', '딱 다섯 / 다섯 이상', '흑백 번갈아 1~7판', '차례 제한시간'],
};
