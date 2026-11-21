import type { GameMeta } from '@bg/core';

export const meta: GameMeta = {
  id: 'sealed-letter',
  title: 'Sealed Letter',
  subtitle: '비밀 편지',
  tagline: '손에 든 단 한 장을 지키며 추측·엿보기·결투로 상대를 떨어뜨리는 짧은 추리 게임',
  description: [
    '카드는 16장뿐이고, 손에는 늘 한 장. 차례마다 1장을 뽑아 둘 중 하나를 내며 효과를 써요 — 상대 카드 맞히기, 엿보기, 결투, 보호, 버리게 하기, 맞바꾸기.',
    '혼자 살아남거나 더미가 떨어졌을 때 가장 높은 카드를 든 사람이 인장을 받아요. 인장을 먼저 모으면 우승. 한 판이 5분이면 끝나요.',
    '낸 카드가 모두 공개되니 남은 카드를 세며 추리하는 재미가 있어요. 확장 21장(첩자·서기관)으로 6명까지, 우승 인장 수·2명 공개 규칙을 바꿀 수 있고 카드를 세는 봇과 할 수 있어요.',
  ],
  players: { min: 2, max: 6, best: [3, 4] },
  minutes: { min: 10, max: 20 },
  weight: 1,
  tags: ['card', 'deduction', 'bluffing', 'player-elimination', 'quick', 'hidden-info'],
  inspiredBy: 'Love Letter (Seiji Kanai) 메커니즘',
  accent: '#c0392b',
  icon: '<rect width="64" height="64" rx="14" fill="#3a2430"/><rect x="12" y="18" width="40" height="28" rx="3" fill="#f6efe2"/><path d="M12 20 L32 34 L52 20" fill="none" stroke="#c8b89a" stroke-width="2.5"/><circle cx="32" cy="36" r="7" fill="#c0392b"/>',
  status: 'live',
  addedAt: '2026-11-22',
  highlights: ['카드를 고르면 지목·추측 단계가 차례로', '내가 알게 된 카드는 👁로 표시', '확장 21장으로 6명까지'],
  customizable: ['원작 16장 / 확장 21장', '우승 인장 수', '2명 공개 카드', '파수꾼끼리 지목', '이긴 사람 먼저', '제한시간'],
};
