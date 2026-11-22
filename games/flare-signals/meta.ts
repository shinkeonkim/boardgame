import type { GameMeta } from '@bg/core';

export const meta: GameMeta = {
  id: 'flare-signals',
  title: 'Flare Signals',
  subtitle: '불꽃 신호',
  tagline: '내 카드만 못 보는 채로 힌트를 주고받으며 함께 불꽃놀이를 완성하는 협력 게임',
  description: [
    '손패를 바깥쪽으로 들어서 남의 카드는 보이고 내 카드만 안 보여요. 각자 폰을 쓰니 카드를 거꾸로 들 필요 없이 내 화면에는 남의 카드가, 남의 화면에는 내 카드가 보여요.',
    '내 차례에는 힌트 주기(색 또는 숫자로 해당 카드를 모두 가리키기), 카드 쏘아 올리기, 버리기 중 하나를 해요. 색마다 1부터 5까지 차례로 쌓아야 하고, 틀리면 실수 토큰이 쌓여요.',
    '받은 힌트·가능한 카드 계산·버린 카드 표가 자동으로 정리돼요. 6색·무지개·힌트/실수 개수·기억력 도전 같은 변형과, 같은 약속으로 움직이는 봇을 지원해요.',
  ],
  players: { min: 2, max: 6, best: [3, 4] },
  minutes: { min: 20, max: 30 },
  weight: 2,
  tags: ['cooperative', 'hidden-info', 'deduction', 'card', 'memory', 'bot-friendly'],
  inspiredBy: 'Hanabi (Antoine Bauza) 메커니즘',
  original: { ko: '하나비', en: 'Hanabi', by: 'Antoine Bauza' },
  accent: '#3b7be0',
  icon: '<rect width="64" height="64" rx="14" fill="#141628"/><g stroke-width="4" stroke-linecap="round"><line x1="32" y1="22" x2="32" y2="8" stroke="#e0483c"/><line x1="37.7" y1="26.1" x2="51" y2="21.8" stroke="#e6b422"/><line x1="35.5" y1="32.9" x2="43.8" y2="44.2" stroke="#2fa865"/><line x1="28.5" y1="32.9" x2="20.2" y2="44.2" stroke="#3b7be0"/><line x1="26.3" y1="26.1" x2="13" y2="21.8" stroke="#9b5ad6"/></g><circle cx="32" cy="28" r="4" fill="#fff4c2"/>',
  status: 'live',
  addedAt: '2026-11-22',
  highlights: ['받은 힌트가 카드에 남아요 (끌 수도 있어요)', '내 카드가 될 수 있는 것과 남은 장수 계산', '봇도 같은 힌트 약속을 지켜요'],
  customizable: ['5색/6색 · 무지개', '여섯째 색 장수', '손패 장수', '힌트 토큰 3~12', '실수 허용 1~6', '실패 점수', '없는 카드 힌트', '힌트 표시·가능성 계산', '마지막 바퀴', '판 수·턴 제한시간'],
};
