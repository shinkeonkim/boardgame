import { useEffect, useState } from 'react';

/**
 * 홈 화면에 추가(PWA): 서비스 워커는 포털이 도메인 루트에서 내주는 /sw.js 하나 (게임 앱도 같은 것을 씀).
 * 로컬(localhost)에서는 등록하지 않음: 개발·QA·e2e 가 캐시 때문에 헷갈리지 않게.
 */
export function registerServiceWorker() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) return;
  addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
      /* 지원 안 하거나 막힘 — 그냥 웹으로 */
    });
  });
}

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };

/** 「앱으로 설치」 버튼: 브라우저가 설치를 제안할 수 있을 때만 install 이 생김 (iOS 사파리는 공유 → 홈 화면에 추가 안내) */
export function useInstallPrompt() {
  const [evt, setEvt] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(display-mode: standalone)').matches);
  useEffect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      setEvt(e as InstallEvent);
    };
    const done = () => {
      setInstalled(true);
      setEvt(null);
    };
    addEventListener('beforeinstallprompt', on);
    addEventListener('appinstalled', done);
    return () => {
      removeEventListener('beforeinstallprompt', on);
      removeEventListener('appinstalled', done);
    };
  }, []);
  const ios = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent) && !installed;
  return {
    installed,
    canInstall: !!evt,
    ios,
    install: async () => {
      if (!evt) return;
      await evt.prompt();
      await evt.userChoice.catch(() => null);
      setEvt(null);
    },
  };
}
