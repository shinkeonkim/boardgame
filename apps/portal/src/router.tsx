import { AnchorHTMLAttributes, MouseEvent, useEffect, useState } from 'react';

/** 아주 작은 라우터: pushState + popstate. 게임 페이지(/<id>/)는 다른 앱이므로 일반 링크로 이동 */
const listeners = new Set<() => void>();
export function navigate(to: string) {
  history.pushState(null, '', to);
  listeners.forEach((l) => l());
  scrollTo({ top: 0 });
}
export function useRoute() {
  const [loc, setLoc] = useState({ path: location.pathname, search: location.search });
  useEffect(() => {
    const on = () => setLoc({ path: location.pathname, search: location.search });
    listeners.add(on);
    addEventListener('popstate', on);
    return () => {
      listeners.delete(on);
      removeEventListener('popstate', on);
    };
  }, []);
  return loc;
}
export function Link({ href, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    navigate(href);
  };
  return <a href={href} onClick={onClick} {...rest} />;
}
