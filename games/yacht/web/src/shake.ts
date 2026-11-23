/**
 * 주사위 「손맛」: 쥐고 흔들다 던지기.
 *  - 굴리기 버튼을 꾹 누르는 동안 흔들림(달그락 소리·진동) → 떼면 던짐. 오래 흔들수록 세게 던짐.
 *  - 폰: 「폰 흔들어 굴리기」를 켜면 폰을 흔드는 동안 흔들리고, 멈추면 던짐 (iOS는 켤 때 동작 권한을 물음).
 *  - 키보드(Enter·Space)는 바로 굴림.
 * 결과는 언제나 서버가 정한다 — 흔드는 건 화면과 소리뿐.
 */
import { PointerEvent as RPointerEvent, MouseEvent as RMouseEvent, useEffect, useRef, useState } from 'react';
import { sound } from '@bg/web';

const FULL_MS = 1200; // 이만큼 흔들면 최대 힘
const MOTION_KEY = 'ya:motion';
/** 흔들림으로 칠 가속도 (m/s², 중력 뺀 값) */
const STRONG = 13;
/** 이만큼 잠잠하면 던짐 */
const STILL_MS = 420;

type DM = typeof DeviceMotionEvent & { requestPermission?: () => Promise<'granted' | 'denied'> };

function motionSupported(): boolean {
  if (typeof window === 'undefined' || !('DeviceMotionEvent' in window)) return false;
  return !!window.matchMedia?.('(pointer: coarse)').matches;
}
function readFlag(): boolean {
  try {
    return localStorage.getItem(MOTION_KEY) === '1';
  } catch {
    return false;
  }
}

export function useShake({ canStart, ready, onThrow, onShake }: { canStart: (quiet?: boolean) => boolean; ready: boolean; onThrow: () => void; /** 흔들기 시작·멈춤을 다른 사람에게 알림 */ onShake?: (on: boolean) => void }) {
  const [on, setOn] = useState(false);
  const [power, setPower] = useState(0.5);
  const [motionOn, setMotionOn] = useState(readFlag);
  const startAt = useRef(0);
  const thrown = useRef(false);
  const rattle = useRef<number | undefined>(undefined);
  const fallback = useRef<number | undefined>(undefined);
  const latest = useRef({ canStart, onThrow, onShake });
  latest.current = { canStart, onThrow, onShake };

  const stopRattle = () => {
    window.clearInterval(rattle.current);
    rattle.current = undefined;
  };
  const start = () => {
    thrown.current = false;
    startAt.current = performance.now();
    setOn(true);
    latest.current.onShake?.(true);
    stopRattle();
    sound.fx('rattle');
    rattle.current = window.setInterval(() => {
      sound.fx('rattle');
      navigator.vibrate?.(10);
    }, 95);
  };
  const stop = () => {
    // 던지지 않고 내려놓음 → 다른 사람 화면도 멈춤 (던졌으면 굴림이 알아서 끔)
    if (!thrown.current && rattle.current !== undefined) latest.current.onShake?.(false);
    stopRattle();
    window.clearTimeout(fallback.current);
    setOn(false);
  };
  const throwNow = (extra = 0) => {
    if (thrown.current) return;
    thrown.current = true;
    stopRattle();
    setPower(Math.max(0.15, Math.min(1, (performance.now() - startAt.current) / FULL_MS + extra)));
    latest.current.onThrow();
    // 결과가 안 오면(거절·끊김) 손을 내려놓음
    window.clearTimeout(fallback.current);
    fallback.current = window.setTimeout(() => {
      setOn(false);
      latest.current.onShake?.(false);
    }, 1500);
  };
  useEffect(() => () => (stopRattle(), window.clearTimeout(fallback.current)), []);
  // 차례가 끝나면 흔들기도 끝
  useEffect(() => {
    if (!ready && on) stop();
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps

  // 폰 흔들기
  useEffect(() => {
    if (!motionOn || !ready || !motionSupported()) return;
    let shaking = false;
    let lastStrong = 0;
    let peak = 0;
    const onMotion = (e: DeviceMotionEvent) => {
      const a = e.acceleration;
      let mag: number;
      if (a && a.x != null && a.y != null && a.z != null) mag = Math.hypot(a.x, a.y, a.z);
      else {
        const g = e.accelerationIncludingGravity;
        if (!g || g.x == null || g.y == null || g.z == null) return;
        mag = Math.abs(Math.hypot(g.x, g.y, g.z) - 9.81);
      }
      if (mag < STRONG) return;
      lastStrong = performance.now();
      peak = Math.max(peak, mag);
      if (!shaking) {
        if (!latest.current.canStart(true)) return;
        shaking = true;
        peak = mag;
        start();
      }
    };
    const tick = window.setInterval(() => {
      if (shaking && performance.now() - lastStrong > STILL_MS) {
        shaking = false;
        throwNow(Math.min(0.4, (peak - STRONG) / 40));
      }
    }, 80);
    window.addEventListener('devicemotion', onMotion);
    return () => {
      window.removeEventListener('devicemotion', onMotion);
      window.clearInterval(tick);
    };
  }, [motionOn, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleMotion = async () => {
    const next = !motionOn;
    if (next) {
      const req = (window.DeviceMotionEvent as DM | undefined)?.requestPermission;
      if (typeof req === 'function') {
        try {
          if ((await req.call(window.DeviceMotionEvent)) !== 'granted') return;
        } catch {
          return;
        }
      }
    }
    setMotionOn(next);
    try {
      localStorage.setItem(MOTION_KEY, next ? '1' : '0');
    } catch {
      /* ignore */
    }
  };

  return {
    on,
    power,
    /** 굴린 결과가 화면에 왔음 → 손을 비움 */
    landed: () => {
      if (thrown.current || !on) stop();
    },
    buttonProps: {
      onPointerDown: (e: RPointerEvent<HTMLButtonElement>) => {
        if (e.button !== 0 || on) return;
        if (!latest.current.canStart()) return;
        e.currentTarget.setPointerCapture?.(e.pointerId);
        start();
      },
      onPointerUp: () => {
        if (on && !thrown.current) throwNow();
      },
      onPointerCancel: () => {
        if (on && !thrown.current) stop();
      },
      onClick: (e: RMouseEvent<HTMLButtonElement>) => {
        // 키보드(Enter·Space)로 누르면 detail = 0 → 바로 굴림
        if (e.detail === 0) latest.current.onThrow();
      },
      onContextMenu: (e: RMouseEvent) => e.preventDefault(),
    },
    motion: { supported: motionSupported(), on: motionOn, toggle: toggleMotion },
  };
}
