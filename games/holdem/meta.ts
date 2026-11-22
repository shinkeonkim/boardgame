import type { GameMeta } from '@bg/core';

export const meta: GameMeta = {
  id: 'holdem',
  title: "Hold'em",
  subtitle: '홀덤',
  tagline: '손패 2장과 바닥 5장으로 겨루는 텍사스 홀덤 — 돈이 오가지 않는 칩 게임',
  description: [
    '블라인드·프리플랍·플랍·턴·리버·쇼다운까지 텍사스 홀덤 규칙 그대로. 체크·콜·레이즈·올인, 사이드 팟도 자동으로 나눠요.',
    '모두 같은 칩으로 시작해 한 명이 남을 때까지, 또는 정한 핸드 수가 끝나면 칩이 많은 순으로 순위를 정해요. 돈이 오가지 않는 친목용이에요.',
    '처음 칩·블라인드·블라인드 올림 주기·노 리밋/팟 리밋을 바꿀 수 있고, 승률을 계산하는 봇과 연습할 수 있어요.',
  ],
  players: { min: 2, max: 9, best: [4, 6] },
  minutes: { min: 20, max: 60 },
  weight: 2,
  tags: ['card', 'bluffing', 'big-group', 'hidden-info', 'player-elimination', 'bot-friendly'],
  inspiredBy: '전통 카드 게임 텍사스 홀덤',
  original: { ko: '텍사스 홀덤', en: "Texas Hold'em", by: '전통 카드 게임' },
  accent: '#1f5a3a',
  icon: '<rect width="64" height="64" rx="14" fill="#1f5a3a"/><rect x="10" y="12" width="22" height="32" rx="4" fill="#fffaf0" transform="rotate(-10 21 28)"/><rect x="26" y="12" width="22" height="32" rx="4" fill="#fffaf0" transform="rotate(8 37 28)"/><circle cx="46" cy="48" r="9" fill="#d0453a" stroke="#fff" stroke-width="2" stroke-dasharray="3 2.4"/>',
  status: 'live',
  addedAt: '2026-11-23',
  highlights: ['직접 그린 카드와 칩 더미', '½팟·팟·최대 버튼과 슬라이더', '사이드 팟 자동 계산', '지금 내 족보 표시'],
  customizable: ['처음 칩', '블라인드·올림 주기', '노 리밋 / 팟 리밋', '핸드 수 또는 한 명 남을 때까지', '제한시간'],
};
