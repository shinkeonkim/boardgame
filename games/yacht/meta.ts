import type { GameMeta } from '@bg/core';

export const meta: GameMeta = {
  id: 'yacht',
  title: 'Yacht Dice',
  subtitle: '요트 다이스',
  tagline: '주사위 5개를 세 번까지 굴려 족보 칸을 채우는 고전 주사위 게임',
  description: [
    '차례마다 주사위 5개를 굴리고, 남길 주사위를 골라 두 번 더 굴릴 수 있어요. 그다음 점수표의 빈 칸 하나에 점수를 적어요.',
    '1~6 칸의 합이 63점을 넘으면 보너스, 다섯 개가 모두 같으면 요트 50점. 모든 칸을 채웠을 때 합계가 가장 높은 사람이 이겨요.',
    '혼자 연습부터 8명까지. 「모두 동시에」 모드로 각자 점수표를 한꺼번에 채울 수도 있고, 확장 족보·굴리기 횟수·보너스 기준을 바꿀 수 있어요.',
  ],
  players: { min: 1, max: 8, best: [2, 4] },
  minutes: { min: 10, max: 25 },
  weight: 1,
  tags: ['dice', 'luck', 'party', 'big-group', 'bot-friendly'],
  inspiredBy: '전통 주사위 게임 요트(Yacht)',
  original: { ko: '요트', en: 'Yacht', by: '전통 주사위 놀이' },
  accent: '#1f6fa8',
  icon: '<rect width="64" height="64" rx="14" fill="#1f4a6e"/><path d="M10 44 q22 10 44 0 l-4 6 h-36 z" fill="#f6efe2"/><path d="M32 12 l14 26 h-14 z" fill="#f6efe2"/><path d="M30 18 l-12 20 h12 z" fill="#e0a526"/><rect x="40" y="40" width="16" height="16" rx="4" fill="#fffdf6" transform="rotate(12 48 48)"/><circle cx="44.5" cy="45" r="1.8" fill="#1d1a16"/><circle cx="51" cy="51.5" r="1.8" fill="#1d1a16"/>',
  status: 'live',
  addedAt: '2026-11-23',
  highlights: ['남길 주사위를 눌러 올려 두기', '적을 수 있는 점수가 점수표에 미리', '보너스까지 남은 점수 막대', '모두 동시에 모드'],
  customizable: ['기본 12칸 / 확장 13칸', '굴리기 1~5번', '보너스 기준·점수', '한 명씩 / 모두 동시에', '게임 수·제한시간'],
};
