import { ReactNode, createContext, useContext, useEffect, useRef, useState } from 'react';

/*
 * 게임 방법 내용을 그리는 부품 (소켓·게임 런타임 없이 쓸 수 있음).
 * 게임 안의 모달(GuideModal)과 포털의 게임 상세 페이지가 같은 섹션을 그대로 그린다.
 */

export interface GuideSection {
  id: string;
  title: string;
  content: ReactNode;
}

export interface GuideDef {
  subtitle: string;
  icon: ReactNode;
  sections: GuideSection[];
}

/** 영상 등 게임 정적 파일의 주소 앞부분 (게임 안: Vite base, 포털: `/<게임id>`) */
export const AssetBaseContext = createContext<string>((import.meta.env?.BASE_URL ?? '/').replace(/\/$/, ''));

/** 짧은 플레이 영상 (자동 재생·반복·무음). src는 게임 public 폴더 기준 ("guide/move.mp4"). 파일이 없으면 숨김 */
export function Clip({ src, caption }: { src: string; caption: string }) {
  const base = useContext(AssetBaseContext);
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <figure className="g-clip">
      <video src={`${base}/${src.replace(/^\//, '')}`} autoPlay muted loop playsInline preload="metadata" onError={() => setFailed(true)} aria-label={caption} />
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

/**
 * 목차 칩 + 섹션 본문. 스크롤하면 목차가 따라 강조된다.
 * scrollRoot가 없으면(포털 페이지처럼) 창 스크롤 기준, stickyNav면 목차가 위에 붙어 있다.
 */
export function GuideSections({ sections, scrollable, stickyTop }: { sections: GuideSection[]; scrollable?: boolean; stickyTop?: number }) {
  const [active, setActive] = useState(sections[0]?.id);
  const body = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = body.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (vis) setActive(vis.target.id.replace('g-', ''));
      },
      { root: scrollable ? root : null, rootMargin: scrollable ? '0px 0px -65% 0px' : `-${(stickyTop ?? 0) + 60}px 0px -60% 0px` },
    );
    root.querySelectorAll('section[id^="g-"]').forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [scrollable, stickyTop]);
  const go = (id: string) => {
    setActive(id);
    const el = body.current?.querySelector<HTMLElement>(`#g-${id}`);
    if (!el) return;
    if (scrollable) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else scrollTo({ top: el.getBoundingClientRect().top + scrollY - (stickyTop ?? 0) - 64, behavior: 'smooth' });
  };
  return (
    <>
      <nav className={`g-nav ${scrollable ? '' : 'g-nav-sticky'}`} aria-label="목차" style={stickyTop !== undefined ? { top: stickyTop } : undefined}>
        {sections.map((s, i) => (
          <button key={s.id} className={`chip ${active === s.id ? 'on' : ''}`} onClick={() => go(s.id)}>
            <span className="g-num">{i + 1}</span> {s.title}
          </button>
        ))}
      </nav>
      <div className={scrollable ? 'g-body' : 'g-body g-body-flow'} ref={body}>
        {sections.map((s, i) => (
          <section id={`g-${s.id}`} key={s.id}>
            <h3>
              {i + 1}. {s.title}
            </h3>
            {s.content}
          </section>
        ))}
      </div>
    </>
  );
}
