import type { GameMeta } from '@bg/core';

export const meta: GameMeta = {
  id: 'cipher-ops',
  title: 'Cipher Ops',
  subtitle: '암호 작전',
  tagline: '팀장만 아는 정답 지도를 한 단어 힌트로 전하는 팀 대항 단어 연상 게임',
  description: [
    '두 팀이 같은 단어 보드를 두고 겨뤄요. 팀장 화면에만 어느 단어가 우리 팀 것인지 보이는 정답 지도가 있어요.',
    '팀장은 「바다 3」처럼 한 단어와 숫자로 힌트를 주고, 요원들은 그 힌트로 우리 단어를 골라요. 상대 단어나 중립을 고르면 차례가 넘어가고, 암살자를 고르면 바로 져요.',
    '팀장과 요원이 각자 다른 화면을 보니 지도를 몰래 볼 일이 없어요. 보드 크기·암살자 수·단어 묶음과 우리끼리 넣는 단어, 고를 수 있는 수, 여러 판 승부를 바꿀 수 있고 봇이 팀장이나 요원을 맡을 수 있어요.',
  ],
  players: { min: 4, max: 10, best: [6, 8] },
  minutes: { min: 15, max: 25 },
  weight: 1,
  tags: ['party', 'word', 'teams', 'deduction', 'big-group', 'hidden-info'],
  inspiredBy: 'Codenames (Vlaada Chvátil) 메커니즘',
  accent: '#3a7bd5',
  icon: '<rect width="64" height="64" rx="14" fill="#1f2430"/><rect x="11" y="11" width="12" height="12" rx="2.5" fill="#d0533f"/><rect x="26" y="11" width="12" height="12" rx="2.5" fill="#3a7bd5"/><rect x="41" y="11" width="12" height="12" rx="2.5" fill="#e8dcc2"/><rect x="11" y="26" width="12" height="12" rx="2.5" fill="#e8dcc2"/><rect x="26" y="26" width="12" height="12" rx="2.5" fill="#111"/><rect x="41" y="26" width="12" height="12" rx="2.5" fill="#3a7bd5"/><rect x="11" y="41" width="12" height="12" rx="2.5" fill="#e8dcc2"/><rect x="26" y="41" width="12" height="12" rx="2.5" fill="#d0533f"/><rect x="41" y="41" width="12" height="12" rx="2.5" fill="#e8dcc2"/>',
  status: 'live',
  addedAt: '2026-11-22',
  highlights: ['팀장 화면에만 정답 지도', '팀원끼리 「이거 같아」 표시로 의논', '우리끼리 아는 단어를 직접 넣기'],
  customizable: ['보드 4×4~6×6', '암살자 0~3장', '단어 묶음 4가지', '직접 넣은 단어', '고를 수 있는 수 3가지', '판마다 팀장 돌아가기', '여러 판 과반 승부', '차례 제한시간'],
};
