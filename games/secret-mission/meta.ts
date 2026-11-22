import type { GameMeta } from '@bg/core';

export const meta: GameMeta = {
  id: 'secret-mission',
  title: 'Secret Mission',
  subtitle: '비밀 원정대',
  tagline: '숨은 첩자를 찾아라 — 원정대 투표와 몰래 낸 카드로 추리하는 5~10인 파티 게임',
  description: [
    '모두 비밀 역할을 받아요. 요원은 원정 5번 중 3번을 성공시키고, 서로를 아는 첩자들은 몰래 실패 카드를 섞어 3번 실패시키려 해요.',
    '대장이 원정대를 고르면 모두 동시에 찬성·반대 투표. 원정대만 몰래 성공·실패 카드를 내고, 실패 카드가 섞이면 원정 실패. 누가 냈는지는 아무도 몰라요.',
    '예언자·그림자 사냥꾼·호위무사·가짜 예언자·숨은 우두머리·외톨이 첩자를 켜고 끌 수 있고, 투표 공개 방식과 부결 한도도 바꿀 수 있어요. 5명이 안 되면 봇으로 채워요.',
  ],
  players: { min: 5, max: 10, best: [6, 8] },
  minutes: { min: 20, max: 40 },
  weight: 2,
  tags: ['party', 'deduction', 'bluffing', 'big-group', 'teams', 'hidden-info'],
  inspiredBy: 'The Resistance (Don Eskridge) 메커니즘',
  original: { ko: '레지스탕스', en: 'The Resistance', by: 'Don Eskridge' },
  accent: '#a8322a',
  icon: '<rect width="64" height="64" rx="14" fill="#1f2a3a"/><circle cx="32" cy="34" r="18" fill="none" stroke="#c9a24a" stroke-width="2.4"/><path d="M20 30 q12 -10 24 0 l3 1.6 q-15 3 -30 0 z" fill="#0f141c"/><rect x="25" y="22" width="14" height="8" rx="3" fill="#0f141c"/><path d="M24 34 q4 -2.4 8 0 q4 -2.4 8 0 v3 q-4 2.4 -8 0 q-4 2.4 -8 0 z" fill="#a8322a"/>',
  status: 'live',
  addedAt: '2026-11-23',
  highlights: ['원탁에서 대장·원정대·투표가 한눈에', '역할 초상 카드 (눌러서 가리기)', '원정대 기록으로 추리', '예언자와 그림자 사냥꾼'],
  customizable: ['예언자·사냥꾼·호위무사·가짜 예언자·숨은 우두머리·외톨이 첩자', '투표 공개 / 익명', '연속 부결 한도 3~7', '게임 수·제한시간'],
};
