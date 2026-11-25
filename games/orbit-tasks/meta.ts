import type { GameMeta } from '@bg/core';

export const meta: GameMeta = {
  id: 'orbit-tasks',
  title: 'Orbit Tasks',
  subtitle: '궤도 임무',
  tagline: '말없이 손발을 맞춰 과제 카드를 맡은 사람이 가져가게 하는 협력 트릭 게임',
  description: [
    '모두 한 팀이에요. 임무마다 과제 카드(예: 파랑 7)가 공개되고, 대장부터 하나씩 맡아요. 맡은 사람이 그 카드가 든 트릭을 가져가면 과제 성공이에요.',
    '처음 낸 색을 따라 내고, 로켓 카드는 어떤 색이든 이기는 으뜸이에요. 말로 패를 알려 줄 수 없고, 임무마다 한 번 손패 한 장을 「가장 높음·가장 낮음·하나뿐」으로만 알려 줄 수 있어요.',
    '과제 하나부터 시작해 성공할 때마다 하나씩 늘어나요. 순서 표시가 붙은 과제는 순서대로 해내야 해요. 3~5명, 함께 손발을 맞추는 봇과 할 수 있어요.',
  ],
  players: { min: 3, max: 5, best: [4] },
  minutes: { min: 10, max: 40 },
  weight: 2,
  tags: ['card', 'cooperative', 'hidden-info', 'deduction', 'bot-friendly'],
  inspiredBy: 'The Crew (Thomas Sing) 메커니즘',
  original: { ko: '더 크루', en: 'The Crew', by: 'Thomas Sing' },
  accent: '#5b4fd0',
  icon: '<rect width="64" height="64" rx="14" fill="#141a3a"/><circle cx="32" cy="34" r="15" fill="none" stroke="#8f86ff" stroke-width="2.5" stroke-dasharray="4 4"/><circle cx="32" cy="34" r="6" fill="#e6b422"/><path d="M44 10c5 2 8 7 8 12l-6 2-6-6 2-6c1-1 1-2 2-2z" fill="#fff"/><path d="M40 18l-6 2 2 2zM46 24l-2 6-2-2z" fill="#e0559b"/><circle cx="47" cy="17" r="2" fill="#3b7be0"/>',
  status: 'live',
  addedAt: '2026-11-26',
  highlights: ['과제 카드를 맡은 사람 표시와 순서 번호', '신호: 손패 한 장을 가장 높음·낮음·하나뿐으로', '성공할수록 과제가 늘어나는 연속 임무', '함께 손발 맞추는 봇'],
  customizable: ['첫 과제 수 1~8', '성공하면 과제 +1', '순서 표시 0~3개', '신호 켜고 끄기', '도전 횟수 1~12'],
};
