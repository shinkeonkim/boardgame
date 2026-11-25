import { useEffect, useState } from 'react';

/**
 * 색 구분 도움: 색으로만 나뉘는 것(보석·카드·타일 색)에 색 이름 첫 글자를 함께 표시.
 * 모든 게임이 한 설정을 공유하고 이 기기에만 저장 (localStorage 'bg:cb' → <html data-cb="on">).
 * 게임은 색 요소에 data-cbl="파" 처럼 글자만 달면 되고, 보이는 방식은 공용 CSS(base.css)가 맡는다.
 */
const KEY = 'bg:cb';
const listeners = new Set<(on: boolean) => void>();

export function getColorAssist(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}
export function applyColorAssist(on = getColorAssist()) {
  if (typeof document === 'undefined') return;
  if (on) document.documentElement.setAttribute('data-cb', 'on');
  else document.documentElement.removeAttribute('data-cb');
}
export function setColorAssist(on: boolean) {
  try {
    if (on) localStorage.setItem(KEY, '1');
    else localStorage.removeItem(KEY);
  } catch {
    /* 저장 못 해도 이번 화면에는 적용 */
  }
  applyColorAssist(on);
  listeners.forEach((f) => f(on));
}
export function useColorAssist(): [boolean, (on: boolean) => void] {
  const [on, setOn] = useState(getColorAssist);
  useEffect(() => {
    listeners.add(setOn);
    return () => void listeners.delete(setOn);
  }, []);
  return [on, setColorAssist];
}
