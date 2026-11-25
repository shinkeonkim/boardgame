import { haptic } from '@bg/ui';
import { Fx, playFx } from './fx';

/** 소리와 함께 오는 진동 (중요한 순간만 — 카드 한 장마다 떨리면 피곤함) */
const HAPTIC: Partial<Record<Fx, number | number[]>> = { myTurn: [18, 60, 18], alert: 40, fail: [30, 40, 30], win: [20, 40, 20, 40, 60] };

// 짧은 알림음 (WebAudio로 합성 — 음원 파일 없음). 음소거 설정은 기기에만 저장.
let ctx: AudioContext | null = null;

function getMuted(): boolean {
  try {
    return localStorage.getItem('bg:mute') === '1';
  } catch {
    return false;
  }
}
let muted = getMuted();
const listeners = new Set<(m: boolean) => void>();

export const sound = {
  get muted() {
    return muted;
  },
  setMuted(m: boolean) {
    muted = m;
    try {
      localStorage.setItem('bg:mute', m ? '1' : '0');
    } catch {
      /* ignore */
    }
    listeners.forEach((fn) => fn(m));
  },
  subscribe(fn: (m: boolean) => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  /** 브라우저 자동재생 정책: 사용자 조작 중에 한 번 깨워 둔다 */
  unlock() {
    try {
      ctx ??= new AudioContext();
      if (ctx.state === 'suspended') ctx.resume();
    } catch {
      /* 지원 안 함 */
    }
  },
  /** 알림음: 내 차례(마림바 세 음) · 남의 차례(나무 똑) · 감정 표현 */
  play(kind: 'myTurn' | 'turn' | 'emote') {
    sound.fx(kind === 'myTurn' ? 'myTurn' : kind === 'turn' ? 'tick' : 'pop');
  },
  /** 효과음 (fx.ts): 카드·칩·주사위·타일… 게임 도구에 맞는 소리 */
  fx(name: Fx, delay = 0) {
    const h = HAPTIC[name];
    if (h) setTimeout(() => haptic(h), delay * 1000);
    if (muted) return;
    try {
      ctx ??= new AudioContext();
      if (ctx.state === 'suspended') return; // 아직 사용자 조작 전
      playFx(ctx, name, delay);
    } catch {
      /* ignore */
    }
  },
};

if (typeof window !== 'undefined') {
  const wake = () => sound.unlock();
  window.addEventListener('pointerdown', wake, { passive: true });
  window.addEventListener('keydown', wake);
}
