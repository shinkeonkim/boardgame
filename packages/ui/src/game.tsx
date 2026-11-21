import { CSSProperties, ReactNode, createContext, useContext, useEffect, useRef, useState } from 'react';
import { BASE_EMOTES, EmoteDef, EmoteEvent } from '@bg/core';

/*
 * 게임 화면 공용 컴포넌트 (디자인 시스템의 게임 확장). 스타일은 styles/game.css.
 * 게임마다 필요한 새 UI가 여러 게임에 쓸 만하면 여기에 추가하고, 한 게임 전용이면 그 게임 폴더에 둔다.
 */

// ---------- 감정 표현 ----------

/** 이 게임에서 쓸 수 있는 감정 표현 목록 (공통 + 게임 전용). @bg/web의 앱 틀이 제공한다 */
export const EmotesContext = createContext<EmoteDef[]>(BASE_EMOTES);
const useEmotes = () => useContext(EmotesContext);

/** 감정 표현 고르기 버튼 + 팔레트 (이모지 격자 + 문구 칩) */
export function EmoteButton({ onSend, small }: { onSend: (id: string) => void; small?: boolean }) {
  const emotes = useEmotes();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);
  const emojis = emotes.filter((e) => [...e.text].length <= 2);
  const phrases = emotes.filter((e) => [...e.text].length > 2);
  const send = (id: string) => {
    onSend(id);
    setOpen(false);
  };
  return (
    <div className="emote-wrap" ref={wrap}>
      <button className={`btn ghost ${small ? 'tiny' : ''} emote-toggle`} aria-expanded={open} aria-label="감정 표현 보내기" onClick={() => setOpen((v) => !v)}>
        😊
      </button>
      {open && (
        <div className="emote-palette" role="menu">
          <div className="emote-grid">
            {emojis.map((e) => (
              <button key={e.id} className="emote-emoji" role="menuitem" onClick={() => send(e.id)}>
                {e.text}
              </button>
            ))}
          </div>
          <div className="emote-phrases">
            {phrases.map((e) => (
              <button key={e.id} className="chip" role="menuitem" onClick={() => send(e.id)}>
                {e.text}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** 이름 옆에 잠깐 떠오르는 말풍선 (🍵 같은 특수 이모트는 움직임 포함) */
export function EmoteBubble({ e }: { e?: EmoteEvent }) {
  const emotes = useEmotes();
  if (!e) return null;
  const def = emotes.find((x) => x.id === e.id);
  const text = def?.text ?? '';
  const big = [...text].length <= 2;
  return (
    <span className={`emote-bubble ${big ? 'big' : ''} ${def?.anim ? `anim-${def.anim}` : ''}`} key={e.n} role="status" aria-label={`${e.name}: ${text}`}>
      <span className="emote-inner">{text}</span>
    </span>
  );
}

/** 좌석이 없는 사람(관전자 등)의 감정 표현을 화면 위쪽에 띄움 */
export function EmoteFeed({ items }: { items: EmoteEvent[] }) {
  const emotes = useEmotes();
  if (!items.length) return null;
  return (
    <div className="emote-feed" aria-live="polite">
      {items.map((e) => (
        <div key={e.n} className="emote-feed-item">
          <b>{e.name}</b> {emotes.find((x) => x.id === e.id)?.text}
        </div>
      ))}
    </div>
  );
}

// ---------- 차례 안내 ----------

/**
 * 화면 위쪽 차례 배너 틀. 내 차례면 강조색, 아니면 차분한 색.
 * shake 값이 바뀔 때마다 흔들어 "지금은 안 돼요"를 알린다.
 */
export function TurnBanner({
  mine,
  away,
  title,
  hint,
  side,
  footer,
  shake = 0,
  style,
  shakeKey,
}: {
  mine: boolean;
  away?: boolean;
  title: ReactNode;
  hint?: ReactNode;
  /** 오른쪽: 단계 표시·타이머·대신 진행 버튼 등 */
  side?: ReactNode;
  /** 아래 띠: 덱 부족 등 */
  footer?: ReactNode;
  shake?: number;
  style?: CSSProperties;
  /** 차례가 바뀌면 등장 애니메이션을 다시 */
  shakeKey?: string | number;
}) {
  return (
    <section className={`turn-banner ${mine ? 'mine' : 'theirs'} ${away ? 'away' : ''}`} aria-live="polite" style={style}>
      <div className={`tb-body ${shake ? 'shake' : ''}`} key={`${shake}-${shakeKey ?? ''}`}>
        <div className="tb-text">
          <div className="tb-title">{title}</div>
          {hint && <div className="tb-hint">{hint}</div>}
        </div>
        {side && <div className="tb-side">{side}</div>}
      </div>
      {footer}
    </section>
  );
}

/** 남은 시간 표시 (10초 이하면 빨갛게) */
export function TurnTimer({ secs }: { secs: number | null }) {
  if (secs === null) return null;
  return <span className={`tb-timer ${secs <= 10 ? 'hot' : ''}`}>{secs}초</span>;
}

/** 차례가 바뀔 때 화면 가운데 잠깐 뜨는 큰 글씨 */
export function TurnSplash({ splash }: { splash: { text: string; sub?: string; mine: boolean; k: number } | null }) {
  if (!splash) return null;
  return (
    <div className={`turn-splash ${splash.mine ? 'mine' : ''}`} key={splash.k} aria-hidden>
      <div className="ts-text">{splash.text}</div>
      {splash.sub && <div className="ts-sub">{splash.sub}</div>}
    </div>
  );
}

/** 한 차례 안의 단계 표시 (예: ① 내려놓기 → ② 가져오기). current는 0부터, 지난 단계는 done */
export function TurnSteps({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="tb-steps" aria-label="이번 차례 단계">
      {steps.map((s, i) => (
        <li key={s} className={i === current ? 'on' : i < current ? 'done' : ''}>
          {s}
        </li>
      ))}
    </ol>
  );
}
