import type { GameMeta } from '@bg/core';

export const meta: GameMeta = {
  id: 'court-intrigue',
  title: 'Court Intrigue',
  subtitle: '궁정 음모',
  tagline: '가진 척, 아닌 척 — 역할을 주장하고 거짓말을 도전으로 밝혀내는 허풍 게임',
  description: [
    '내 카드 두 장이 영향력이에요. 차례마다 금화를 모으거나 역할 행동(세금·암살·약탈·교환)을 하고, 금화 7개로 쿠데타를 일으켜 상대 영향력을 없애요.',
    '역할 행동은 그 카드가 없어도 주장할 수 있어요. 다른 사람은 「거짓말!」로 도전하거나 역할을 주장해 막을 수 있고, 들킨 쪽이 카드를 잃어요. 마지막까지 남은 사람이 이겨요.',
    '도전·막기 창은 정해진 시간이 지나면 자동으로 넘어가 게임이 멈추지 않아요. 카드 장수·금화·비용과 대기 시간을 바꿀 수 있고, 공개된 카드를 세며 허풍도 섞는 봇과 할 수 있어요.',
  ],
  players: { min: 2, max: 6, best: [4, 5] },
  minutes: { min: 10, max: 20 },
  weight: 2,
  tags: ['bluffing', 'deduction', 'player-elimination', 'hidden-info', 'party', 'card'],
  inspiredBy: 'Coup (Rikki Tahta) 메커니즘',
  original: { ko: '쿠', en: 'Coup', by: 'Rikki Tahta' },
  accent: '#8a5cd0',
  icon: '<rect width="64" height="64" rx="14" fill="#231c2e"/><path d="M20 44 L22 24 L28 32 L32 20 L36 32 L42 24 L44 44 Z" fill="#d79a1e"/><rect x="18" y="46" width="28" height="5" rx="2" fill="#d79a1e"/><circle cx="47" cy="18" r="7" fill="#8a5cd0"/>',
  status: 'live',
  addedAt: '2026-11-22',
  highlights: ['허풍 표시: 없는 역할로 하는 행동이 한눈에', '도전·막기 대기가 자동으로 넘어가요', '공개된 카드를 세는 봇'],
  customizable: ['역할 장수 2~4', '시작 금화', '쿠데타 비용·의무', '암살 비용', '약탈량', '도전·막기 대기 시간', '2명 핸디캡', '판 수·제한시간'],
};
