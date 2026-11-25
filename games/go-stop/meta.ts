import type { GameMeta } from '@bg/core';

export const meta: GameMeta = {
  id: 'go-stop',
  title: 'Go Stop',
  subtitle: '고스톱',
  tagline: '같은 달 화투를 맞춰 먹고, 점수가 나면 「고」로 더 갈지 「스톱」할지 고르는 2~3명 카드 게임',
  description: [
    '손패 한 장을 내서 바닥의 같은 달 카드를 먹고, 더미에서 한 장을 뒤집어 한 번 더 맞춰요. 쪽·뻑·따닥·싹쓸이도 그대로예요.',
    '광·열끗·띠·피를 모아 점수가 나면(2명 7점 · 3명 3점) 「고」로 더 크게 노리거나 「스톱」으로 판을 끝내요. 고를 부르고 상대가 먼저 나면 위험!',
    '피박·광박, 피 뺏기를 방마다 켜고 끌 수 있고, 값진 카드를 아끼는 봇과 할 수 있어요. 카드 그림은 직접 그렸어요.',
  ],
  players: { min: 2, max: 3, best: [2, 3] },
  minutes: { min: 10, max: 20 },
  weight: 2,
  tags: ['card', 'set-collection', 'push-your-luck', 'bot-friendly'],
  inspiredBy: '화투 고스톱(전통 놀이) 규칙',
  accent: '#c0392b',
  icon: '<rect width="64" height="64" rx="14" fill="#7a1f1f"/><rect x="12" y="14" width="22" height="34" rx="3" fill="#fbf4e4" transform="rotate(-10 23 31)"/><rect x="30" y="14" width="22" height="34" rx="3" fill="#fbf4e4" transform="rotate(8 41 31)"/><circle cx="42" cy="24" r="6" fill="#d64545" transform="rotate(8 41 31)"/><path d="M20 40l4-14 4 14z" fill="#2f7a3a" transform="rotate(-10 23 31)"/>',
  status: 'live',
  addedAt: '2026-11-26',
  highlights: ['직접 그린 화투 48장', '먹을 수 있는 카드에 표시', '쪽·뻑·따닥·싹쓸이 · 피 뺏기', '고/스톱 · 피박·광박', '값진 카드를 아끼는 봇'],
  customizable: ['고/스톱 점수', '피박·광박', '피 뺏기', '판 수·제한시간'],
};
