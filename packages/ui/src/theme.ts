import { useEffect, useState } from 'react';
import { THEME_KEY } from './theme-boot.js';

export { THEME_BOOT_SCRIPT } from './theme-boot.js';

/**
 * 테마: 'light' | 'dark' | 'system'(기본). 같은 도메인의 모든 게임·포털이 한 설정을 공유한다(localStorage 'bg:theme').
 * 깜빡임 없이 적용하려면 index.html <head>에 THEME_BOOT_SCRIPT를 인라인으로 넣는다 (vite 플러그인 themeBootPlugin).
 */
export type ThemeChoice = 'light' | 'dark' | 'system';
const KEY = THEME_KEY;
const listeners = new Set<(t: ThemeChoice) => void>();

export function getTheme(): ThemeChoice {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

/** 지금 실제로 보이는 테마 */
export function resolvedTheme(choice = getTheme()): 'light' | 'dark' {
  if (choice !== 'system') return choice;
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(choice: ThemeChoice) {
  const root = document.documentElement;
  if (choice === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', choice);
  // 주소창 색도 맞춘다
  const meta = document.querySelector('meta[name="theme-color"]');
  meta?.setAttribute('content', resolvedTheme(choice) === 'dark' ? '#15140f' : '#f3ede3');
}

export function setTheme(choice: ThemeChoice) {
  try {
    if (choice === 'system') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, choice);
  } catch {
    /* 저장 불가여도 이번 화면에는 적용 */
  }
  const root = document.documentElement;
  root.classList.add('theme-anim');
  applyTheme(choice);
  setTimeout(() => root.classList.remove('theme-anim'), 300);
  listeners.forEach((l) => l(choice));
}

export function useTheme(): [ThemeChoice, (t: ThemeChoice) => void, 'light' | 'dark'] {
  const [choice, setChoice] = useState<ThemeChoice>(getTheme);
  const [, rerender] = useState(0);
  useEffect(() => {
    listeners.add(setChoice);
    // 시스템 테마가 바뀌면 'system'일 때 보이는 테마도 바뀐다
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const onSys = () => rerender((n) => n + 1);
    mq.addEventListener('change', onSys);
    // 다른 탭에서 바꾼 것도 따라간다
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) {
        const t = getTheme();
        applyTheme(t);
        setChoice(t);
      }
    };
    addEventListener('storage', onStorage);
    return () => {
      listeners.delete(setChoice);
      mq.removeEventListener('change', onSys);
      removeEventListener('storage', onStorage);
    };
  }, []);
  return [choice, setTheme, resolvedTheme(choice)];
}

