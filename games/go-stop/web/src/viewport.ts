import { useEffect, useState } from 'react';

/** 창 크기 (카드 크기를 화면에 맞춰 정한다) */
export function useViewport() {
  const read = () => ({ w: typeof window === 'undefined' ? 1024 : window.innerWidth, h: typeof window === 'undefined' ? 768 : window.innerHeight });
  const [v, setV] = useState(read);
  useEffect(() => {
    const on = () => setV(read());
    addEventListener('resize', on);
    return () => removeEventListener('resize', on);
  }, []);
  return v;
}
