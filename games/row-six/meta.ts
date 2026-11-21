import type { GameMeta } from '@bg/core';

export const meta: GameMeta = {
  id: 'row-six',
  title: 'Row Six',
  subtitle: '여섯째 줄',
  tagline: '모두 동시에 숫자 카드를 내고, 6번째가 되면 줄을 몽땅 떠안는 눈치 게임',
  description: [
    '모두 손에서 숫자 카드 한 장을 몰래 고르고 동시에 공개해요. 작은 카드부터, 끝 숫자가 가장 가까운 줄 뒤에 붙어요.',
    '줄의 6번째 카드를 낸 사람은 앞의 다섯 장을 벌점으로 가져가고, 모든 줄보다 작은 카드를 낸 사람은 줄 하나를 골라 가져가요. 벌점이 가장 적은 사람이 이겨요.',
    '각자 폰으로 고르니 공개·정렬·줄 붙이기·벌점 계산이 자동이라 10명이 해도 빨라요. 카드 범위·줄 수·한 줄 길이·벌점 방식·팀전을 바꿀 수 있고 봇과도 할 수 있어요.',
  ],
  players: { min: 2, max: 10, best: [4, 5, 6] },
  minutes: { min: 15, max: 30 },
  weight: 1,
  tags: ['party', 'simultaneous', 'card', 'luck', 'big-group'],
  inspiredBy: '6 nimmt! (Wolfgang Kramer) 메커니즘',
  accent: '#d0533f',
  icon: '<rect width="64" height="64" rx="14" fill="#1d1a24"/><rect x="9" y="18" width="7" height="20" rx="1.6" fill="#f6efe2" opacity=".55"/><rect x="18" y="18" width="7" height="20" rx="1.6" fill="#f6efe2" opacity=".64"/><rect x="27" y="18" width="7" height="20" rx="1.6" fill="#f6efe2" opacity=".73"/><rect x="36" y="18" width="7" height="20" rx="1.6" fill="#f6efe2" opacity=".82"/><rect x="45" y="18" width="7" height="20" rx="1.6" fill="#f6efe2" opacity=".91"/><rect x="52" y="14" width="8" height="28" rx="1.8" fill="#d0533f" transform="rotate(12 56 28)"/>',
  status: 'live',
  addedAt: '2026-11-22',
  highlights: ['10명까지 한 방에서', '고르는 순간 들어갈 줄과 위험을 미리 보여 줘요', '봇 세 단계 (쉬움·보통·어려움)'],
  customizable: ['카드 범위 30~154 · 인원에 맞추기', '줄 수 3~6', '한 줄 길이', '손패 장수', '벌점 방식(원작/모두 1점)', '작은 카드: 줄 고르기/자동', '목표 벌점 또는 판 수', '공개 전 바꾸기', '벌점 공개', '고르는 시간', '2명씩 팀전'],
};
