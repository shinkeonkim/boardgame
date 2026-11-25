/**
 * 판 다시 보기: 게임 중에 받은 화면 상태(RoomView)를 이 기기에 모아 두었다가, 매치가 끝나면
 * 같은 게임 화면으로 한 장면씩 다시 틀어 준다. 서버에 새 기능이 필요 없고, 내가 본 그대로(내 손패 포함) 재생된다.
 */
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { RoomView } from '@bg/core';
import { Icon } from '@bg/ui';

const MAX_FRAMES = 2000;

/** 게임 화면에서 「판 다시 보기」를 열 수 있게 RoomPage 가 내려 줌 */
export const ReplayContext = createContext<{ frames: number; open: () => void } | null>(null);
export const useReplay = () => useContext(ReplayContext);

/** 매치 동안의 장면 모으기 (새 매치가 시작되면 비움). 같은 장면이 연달아 오면 하나로 */
export function useReplayRecorder(view: RoomView | null) {
  const frames = useRef<RoomView[]>([]);
  const matchId = useRef<number | null>(null);
  const [count, setCount] = useState(0);
  useEffect(() => {
    const o = view?.outcome;
    if (!view?.game || !o) return;
    if (matchId.current !== o.id) {
      matchId.current = o.id;
      frames.current = [];
    }
    const last = frames.current[frames.current.length - 1];
    // 시간처럼 매번 바뀌는 값(sinceMs 등 ms 로 끝나는 키)은 빼고 비교 — 안 그러면 같은 장면이 수십 개
    const key = (g: unknown) => JSON.stringify(g, (k, x) => (/Ms$/.test(k) ? undefined : x));
    if (last && key(last.game) === key(view.game)) return;
    frames.current.push(view);
    if (frames.current.length > MAX_FRAMES) frames.current.shift();
    setCount(frames.current.length);
  }, [view]);
  return { frames: frames.current, count };
}

/** 재생 막대: 처음 · 이전 · 재생/멈춤 · 다음 · 끝, 장면 슬라이더, 빠르기, 닫기 */
export function ReplayBar({ index, total, playing, speed, onSeek, onPlay, onSpeed, onClose }: { index: number; total: number; playing: boolean; speed: number; onSeek: (i: number) => void; onPlay: (p: boolean) => void; onSpeed: (s: number) => void; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') onSeek(Math.min(total - 1, index + 1));
      else if (e.key === 'ArrowLeft') onSeek(Math.max(0, index - 1));
      else if (e.key === ' ') {
        e.preventDefault();
        onPlay(!playing);
      }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [index, total, playing, onSeek, onPlay, onClose]);
  return (
    <div className="replay-bar" role="toolbar" aria-label="판 다시 보기">
      <span className="replay-tag">
        <Icon name="undo" /> 다시 보기
      </span>
      <button type="button" className="btn tiny ghost" onClick={() => onSeek(0)} aria-label="처음">
        ⏮
      </button>
      <button type="button" className="btn tiny ghost" onClick={() => onSeek(Math.max(0, index - 1))} aria-label="이전 장면">
        ◀
      </button>
      <button type="button" className="btn tiny primary" onClick={() => onPlay(!playing)} aria-label={playing ? '멈춤' : '재생'}>
        <Icon name={playing ? 'pause' : 'play'} />
      </button>
      <button type="button" className="btn tiny ghost" onClick={() => onSeek(Math.min(total - 1, index + 1))} aria-label="다음 장면">
        ▶
      </button>
      <input type="range" min={0} max={Math.max(0, total - 1)} value={index} onChange={(e) => onSeek(Number(e.target.value))} aria-label="장면" />
      <span className="replay-count small">
        {index + 1}/{total}
      </span>
      <select value={speed} onChange={(e) => onSpeed(Number(e.target.value))} aria-label="빠르기" className="replay-speed">
        <option value={1600}>느리게</option>
        <option value={900}>보통</option>
        <option value={400}>빠르게</option>
      </select>
      <button type="button" className="btn tiny" onClick={onClose}>
        <Icon name="x" /> 닫기
      </button>
    </div>
  );
}

/** 재생 상태 (자동 넘김 포함) */
export function useReplayPlayer(total: number) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(900);
  useEffect(() => {
    if (!open || !playing) return;
    if (index >= total - 1) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setIndex((i) => Math.min(total - 1, i + 1)), speed);
    return () => clearTimeout(t);
  }, [open, playing, index, total, speed]);
  return {
    open,
    index,
    playing,
    speed,
    start: () => {
      setIndex(0);
      setPlaying(true);
      setOpen(true);
    },
    close: () => {
      setOpen(false);
      setPlaying(false);
    },
    seek: (i: number) => {
      setPlaying(false);
      setIndex(i);
    },
    setPlaying,
    setSpeed,
  };
}
