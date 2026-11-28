/**
 * 둘러앉은 자리 (공통 배치). 실제 테이블처럼 나는 늘 아래, 다른 사람은 내 왼쪽부터 시계 방향으로
 * 왼쪽 → 위 → 오른쪽 가장자리에 앉는다. 사람마다 자기가 아래에 보이므로 화면이 서로 다르다.
 * 카드가 「그 사람 쪽에서」 나오고 들어가는 움직임(useFlip·action-feed)이 자리 방향과 맞는다.
 *
 *   <SeatRing players={n} me={t.me} seat={(s, pos) => <내 게임의 상대 표시/>} center={가운데 판} bottom={내 손패} />
 *
 * 좁은 화면(휴대폰 세로)은 다른 사람을 모두 위 한 줄에 둔다.
 * 각 자리 상자에는 data-seat가 붙어 말풍선·자리 반짝·날아오기의 기준이 된다.
 */
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { seatColor } from '@bg/ui';
import { useNarrow } from './narrow';

export type SeatPos = 'left' | 'top' | 'right';

/** 다른 사람 k명을 가장자리에 나눔 (시계 방향 순서) */
export function ringPositions(k: number, narrow = false, short = false): SeatPos[] {
  // 낮은 가로 화면(휴대폰 눕힘): 위에 앉히면 판이 눌리므로 왼쪽·오른쪽에만 (반반)
  if (short && !narrow && k >= 1) return Array.from({ length: k }, (_, i) => (i < Math.ceil(k / 2) ? 'left' : 'right'));
  if (narrow || k <= 1) return Array(k).fill('top');
  const side = k >= 6 ? 2 : 1;
  const top = k - side * 2;
  return [...Array(side).fill('left'), ...Array(top).fill('top'), ...Array(side).fill('right')];
}

export function SeatRing({
  players,
  me,
  seat,
  center,
  bottom,
  className = '',
  edges = 'all',
}: {
  players: number;
  /** 내 자리 (관전이면 -1 → 0번 자리를 아래로) */
  me: number;
  seat: (s: number, pos: SeatPos) => ReactNode;
  center: ReactNode;
  bottom?: ReactNode;
  className?: string;
  /** 'top': 다른 사람을 모두 위쪽에 (자리 표시가 가로로 긴 게임 — 손패 줄을 펼쳐 보이는 경우) */
  edges?: 'all' | 'top';
}) {
  const narrow = useNarrow();
  const short = useShort();
  const base = me >= 0 ? me : 0;
  const others = Array.from({ length: players - 1 }, (_, i) => (base + 1 + i) % players).filter((s) => s !== me);
  if (me < 0) others.unshift(0);
  const pos = short ? ringPositions(others.length, narrow, true) : ringPositions(others.length, narrow || edges === 'top');
  const at = (p: SeatPos) => others.filter((_, i) => pos[i] === p);
  const box = (s: number, p: SeatPos) => (
    <div key={s} className="sr-seat" data-seat={s} data-pos={p} style={{ ['--seat' as string]: seatColor(s) } as CSSProperties}>
      {seat(s, p)}
    </div>
  );
  return (
    <div className={`seat-ring ${narrow ? 'narrow' : ''} ${className}`} data-others={others.length}>
      {/* 왼쪽은 내 쪽(아래)부터 위로 앉으므로 거꾸로 그림 */}
      <div className="sr-left">{[...at('left')].reverse().map((s) => box(s, 'left'))}</div>
      <div className="sr-top">{at('top').map((s) => box(s, 'top'))}</div>
      <div className="sr-right">{at('right').map((s) => box(s, 'right'))}</div>
      <div className="sr-center">{center}</div>
      {bottom && (
        <div className="sr-bottom" data-seat={me >= 0 ? me : undefined}>
          {bottom}
        </div>
      )}
    </div>
  );
}

/** 높이가 낮은 화면인지 (휴대폰 가로) */
function useShort(): boolean {
  const read = () => typeof window !== 'undefined' && window.innerHeight < 560 && window.innerWidth >= 760;
  const [v, setV] = useState(read);
  useEffect(() => {
    const on = () => setV(read());
    addEventListener('resize', on);
    return () => removeEventListener('resize', on);
  }, []);
  return v;
}
