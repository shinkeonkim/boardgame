import type { GameMeta } from '@bg/core';

export const meta: GameMeta = {
  id: 'silent-count',
  title: 'Silent Count',
  subtitle: '침묵의 숫자',
  tagline: '말없이, 차례도 없이 — 모두의 카드를 작은 순서대로 내는 실시간 협력 게임',
  description: [
    '1~100 카드를 단계 수만큼 받아요. 차례가 없어요. 누구든 「지금이다」 싶을 때 내 가장 낮은 카드를 내요. 모두의 카드가 작은 순서로 나와야 해요.',
    '말이나 손짓으로 숫자를 알려 줄 수 없어요. 서로의 망설임과 시간을 느끼는 게 전부예요. 순서가 어긋나면 생명을 하나 잃고, 그보다 작은 카드는 모두 버려요.',
    '모두 동의하면 수리검을 써서 각자 가장 낮은 카드를 한 장씩 버릴 수 있어요. 단계를 깰수록 카드가 늘고, 생명과 수리검 보상이 와요. 2~6명, 시간 감각을 가진 봇과 할 수 있어요.',
  ],
  players: { min: 2, max: 6, best: [3, 4] },
  minutes: { min: 10, max: 25 },
  weight: 1,
  tags: ['card', 'cooperative', 'simultaneous', 'number', 'party', 'quick'],
  inspiredBy: 'The Mind (Wolfgang Warsch) 메커니즘',
  original: { ko: '더 마인드', en: 'The Mind', by: 'Wolfgang Warsch' },
  accent: '#7a4fd0',
  icon: '<rect width="64" height="64" rx="14" fill="#221a3a"/><circle cx="32" cy="32" r="18" fill="none" stroke="#b49cff" stroke-width="2" opacity=".6"/><circle cx="32" cy="32" r="11" fill="none" stroke="#b49cff" stroke-width="2"/><rect x="22" y="20" width="20" height="26" rx="4" fill="#fffaf1"/><text x="32" y="38" text-anchor="middle" font-size="13" font-weight="900" fill="#221a3a" font-family="Georgia, serif">42</text>',
  status: 'live',
  addedAt: '2026-11-26',
  highlights: ['차례 없이 실시간으로 — 「지금이다」 버튼 하나', '어긋나면 버린 카드를 바로 보여 줌', '수리검은 모두 동의해야', '시간 감각을 가진 봇'],
  customizable: ['단계 수(인원에 맞춰 또는 직접)', '생명', '수리검 0~3개', '단계 보상 켜고 끄기'],
};
