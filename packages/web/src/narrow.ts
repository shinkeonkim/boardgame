import { useEffect, useState } from 'react';

/** 좁은 화면(폰 세로·정사각형보다 좁은 창) — CSS의 같은 미디어 쿼리와 맞춘다 */
export const NARROW_QUERY = '(max-width: 759px), (max-aspect-ratio: 1/1)';

export function useNarrow(): boolean {
  const [n, setN] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.(NARROW_QUERY).matches);
  useEffect(() => {
    const mq = window.matchMedia?.(NARROW_QUERY);
    if (!mq) return;
    const on = () => setN(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return n;
}
