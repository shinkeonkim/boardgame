import { useState } from 'react';
import { Modal } from '@bg/ui';
import { useGameClient } from './App';
import { GuideSections } from './guide-kit';

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

/** 게임 안의 게임 방법 모달 (내용은 guide-kit의 GuideSections) */
export function GuideModal({ onClose }: { onClose: () => void }) {
  const { title, guide } = useGameClient();
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
      <GuideSections sections={guide.sections} scrollable />
    </Modal>
  );
}
