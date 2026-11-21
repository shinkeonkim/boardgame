import type { GameMeta } from '@bg/core';

export const meta: GameMeta = {
  id: 'bluff-dice',
  title: 'Bluff Dice',
  subtitle: '허풍 주사위',
  tagline: '컵 속에 숨긴 주사위로 「몇 개 이상」을 걸고, 거짓말을 잡아내는 눈치 게임',
  description: [
    '모두 컵 속 주사위를 굴리고 내 주사위만 봐요. 차례대로 「모든 주사위 중 4가 4개 이상」처럼 걸고, 다음 사람은 더 높게 걸거나 「거짓말!」을 외쳐요.',
    '거짓말을 외치면 모두의 주사위를 공개해 세고, 틀린 쪽이 주사위 하나를 잃어요. 주사위를 모두 잃으면 탈락, 마지막 한 명이 이겨요.',
    '1은 와일드, 1에 거는 페루 규칙, 「딱 맞다!」, 팔리피코, 차이만큼 잃기, 주사위 개수·면 수를 바꿀 수 있고, 확률을 계산하는 봇과 할 수 있어요.',
  ],
  players: { min: 2, max: 8, best: [4, 5, 6] },
  minutes: { min: 15, max: 25 },
  weight: 1,
  tags: ['dice', 'bluffing', 'party', 'player-elimination', 'hidden-info', 'big-group'],
  inspiredBy: "Liar's Dice / Perudo (전통 주사위 게임) 메커니즘",
  accent: '#b3542e',
  icon: '<rect width="64" height="64" rx="14" fill="#2a1f1a"/><path d="M18 12 h28 l-4 30 h-20 z" fill="#b3542e"/><rect x="15" y="9" width="34" height="6" rx="3" fill="#c96a3e"/><rect x="22" y="40" width="20" height="20" rx="5" fill="#f6efe2"/><circle cx="27" cy="45" r="2.3" fill="#2a1f1a"/><circle cx="37" cy="55" r="2.3" fill="#2a1f1a"/><circle cx="32" cy="50" r="2.3" fill="#d0533f"/>',
  status: 'live',
  addedAt: '2026-11-22',
  highlights: ['걸 수 있는 최소 개수를 바로 보여 줘요', '공개 때 센 주사위가 빛나요', '확률을 계산하는 봇 (어려움은 남의 호가도 읽어요)'],
  customizable: ['주사위 1~8개 · 4~8면', '1은 와일드', '1에 걸기(페루 규칙)', '딱 맞다·되찾기 한도', '팔리피코', '진 사람 1개/차이만큼', '게임 수·제한시간'],
};
