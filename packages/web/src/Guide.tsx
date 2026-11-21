import { useEffect, useRef, useState } from 'react';
import { Modal } from '@bg/ui';
import { useGameClient } from './App';
import { BASE } from './runtime';

/** 게임 방법 열기 버튼 + 모달 (첫 화면·로비·게임 상단 바) */
export function GuideButton({ className = 'btn ghost', label = '게임 방법' }: { className?: string; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className={className} onClick={() => setOpen(true)} aria-label={label}>
        📖 <span className="guide-label">{label}</span>
      </button>
      {open && <GuideModal onClose={() => setOpen(false)} />}
    </>
  );
}

/** 짧은 플레이 영상 (자동 재생·반복·무음). src는 게임 public 폴더 기준 ("guide/move.mp4"). 파일이 없으면 숨김 */
export function Clip({ src, caption }: { src: string; caption: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <figure className="g-clip">
      <video src={`${BASE}/${src.replace(/^\//, '')}`} autoPlay muted loop playsInline preload="metadata" onError={() => setFailed(true)} aria-label={caption} />
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

/** 섹션 목차(칩) + 스크롤 본문. 스크롤 위치에 따라 목차가 따라 강조된다 */
export function GuideModal({ onClose }: { onClose: () => void }) {
  const { title, guide } = useGameClient();
  const [active, setActive] = useState(guide.sections[0]?.id);
  const body = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = body.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (vis) setActive(vis.target.id.replace('g-', ''));
      },
      { root, rootMargin: '0px 0px -65% 0px' },
    );
    root.querySelectorAll('section[id^="g-"]').forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);
  const go = (id: string) => {
    setActive(id);
    body.current?.querySelector(`#g-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  return (
    <Modal onClose={onClose} label="게임 방법">
      <header className="g-head">
        <div className="g-title">
          <span className="g-logo" aria-hidden>
            {guide.icon}
          </span>
          <div>
            <h2>게임 방법</h2>
            <span className="muted small">
              {title} · {guide.subtitle}
            </span>
          </div>
        </div>
        <button className="icon-btn g-close" onClick={onClose} aria-label="닫기">
          ✕
        </button>
      </header>
      <nav className="g-nav" aria-label="목차">
        {guide.sections.map((s, i) => (
          <button key={s.id} className={`chip ${active === s.id ? 'on' : ''}`} onClick={() => go(s.id)}>
            <span className="g-num">{i + 1}</span> {s.title}
          </button>
        ))}
      </nav>
      <div className="g-body" ref={body}>
        {guide.sections.map((s, i) => (
          <section id={`g-${s.id}`} key={s.id}>
            <h3>
              {i + 1}. {s.title}
            </h3>
            {s.content}
          </section>
        ))}
      </div>
    </Modal>
  );
}
