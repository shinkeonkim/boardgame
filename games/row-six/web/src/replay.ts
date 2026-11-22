import { useEffect, useRef, useState } from 'react';
import type { LogEntry } from '@bg/row-six-engine';
import { flyClone } from '@bg/web';

/** 한 장 놓기 연출 시간 (ms): 공개 줄에서 강조 → 줄로 이동 → 다음 카드 */
const LOOK = 520;
const LAND = 620;
/** 줄을 가져갈 때: 줄이 빨갛게 → 카드들이 가져간 사람 자리로 날아감 */
const WARN = 650;
const FLY = 900;

const reduced = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const wait = (ms: number) => new Promise((r) => setTimeout(r, reduced() ? 0 : ms));
/** 밀린 만큼 빠르게: 봇끼리 빨리 두면 재생이 뒤처지므로 (한 차례 넘게 밀리면 0.4배, 많이 밀리면 바로) */
const pace = (backlog: number) => (backlog > 10 ? 0 : backlog > 4 ? 0.4 : 1);
const lastN = (log: LogEntry[]) => (log.length ? log[log.length - 1].n : 0);

/**
 * 서버는 공개된 카드를 한꺼번에 놓은 결과만 보낸다. 그대로 그리면 순식간이라 무슨 일이 있었는지 모른다.
 * 기록(place)을 하나씩 다시 재생한다: 직전에 보이던 줄에서 출발해 카드를 한 장씩 놓고, 줄을 가져가면 그 카드들을 자리로 날린다.
 */
export function useReplay(rows: number[][], log: LogEntry[]) {
  const [shown, setShown] = useState(rows);
  const [active, setActive] = useState<number | null>(null);
  const [taking, setTaking] = useState<number | null>(null);
  const [landed, setLanded] = useState<Set<number>>(() => new Set());
  const [pop, setPop] = useState<{ seat: number; pen: number; key: number } | null>(null);
  const [replaying, setReplaying] = useState(false);
  /** 지금 재생 중인 놓기 (아래 한 줄 안내를 재생에 맞춤) */
  const [cur, setCur] = useState<Extract<LogEntry, { type: 'place' }> | null>(null);
  /** 아직 재생하지 않은 가져가기: 자리별 벌점·장수 (옆 패널 점수가 카드가 날아가기 전에 바뀌지 않게 뺌) */
  const [lag, setLag] = useState<Record<number, { pen: number; cards: number }>>({});
  const addLag = (seat: number, pen: number, cards: number) =>
    setLag((l) => ({ ...l, [seat]: { pen: (l[seat]?.pen ?? 0) + pen, cards: (l[seat]?.cards ?? 0) + cards } }));
  const seen = useRef(lastN(log));
  const queue = useRef<Extract<LogEntry, { type: 'place' }>[]>([]);
  const busy = useRef(false);
  const latest = useRef(rows);
  latest.current = rows;

  const run = async () => {
    if (busy.current) return;
    busy.current = true;
    setReplaying(true);
    while (queue.current.length) {
      const p = queue.current.shift()!;
      setActive(p.card);
      setCur(p);
      await wait(LOOK * pace(queue.current.length));
      if (p.took.length) {
        setTaking(p.row);
        await wait(WARN * pace(queue.current.length));
        const rowEl = document.querySelector(`[data-row="${p.row}"] .row-cards`);
        const seatEl = document.querySelector(`.seat-row[data-seat="${p.seat}"]`);
        if (pace(queue.current.length)) flyClone(rowEl, seatEl, { like: rowEl?.querySelector('.ncard'), count: p.took.length, duration: FLY * pace(queue.current.length) });
        setShown((rs) => rs.map((r, i) => (i === p.row ? [] : r)));
        setPop({ seat: p.seat, pen: p.penalty, key: p.card });
        addLag(p.seat, -p.penalty, -p.took.length);
        await wait(FLY * pace(queue.current.length));
        setTaking(null);
      }
      setShown((rs) => rs.map((r, i) => (i === p.row ? (p.took.length ? [p.card] : [...r, p.card]) : r)));
      setLanded((s) => new Set(s).add(p.card));
      setActive(null);
      await wait(LAND * pace(queue.current.length));
    }
    // 끝나면 서버 상태와 맞춤 (새 판이면 새 줄)
    setShown(latest.current);
    setCur(null);
    setPop(null);
    setLag({});
    busy.current = false;
    setReplaying(false);
  };

  useEffect(() => {
    const fresh = log.filter((e) => e.n > seen.current);
    seen.current = lastN(log);
    // 새 공개가 시작되면 지난 공개의 「놓임」 표시를 지움
    if (fresh.some((e) => e.type === 'reveal')) setLanded(new Set());
    const places = fresh.filter((e): e is Extract<LogEntry, { type: 'place' }> => e.type === 'place');
    if (places.length) {
      queue.current.push(...places);
      for (const pl of places) if (pl.took.length) addLag(pl.seat, pl.penalty, pl.took.length);
      void run();
    } else if (!busy.current) setShown(rows);
  }, [log, rows]); // eslint-disable-line react-hooks/exhaustive-deps

  const penLag = (seat: number) => lag[seat]?.pen ?? 0;
  const cardLag = (seat: number) => lag[seat]?.cards ?? 0;
  return { shown, active, taking, landed, pop, replaying, penLag, cardLag, cur };
}
