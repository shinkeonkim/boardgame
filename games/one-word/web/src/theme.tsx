/** 단어 카드 (카드 키트 pc) — 맞히는 사람에게는 뒷면 */
export function WordCard({ word, size = 'lg' }: { word: string | null; size?: 'md' | 'lg' }) {
  if (word === null)
    return (
      <div className={`ow-card pc back ${size}`} aria-label="가려진 단어">
        <b className="ow-q">?</b>
      </div>
    );
  return (
    <div className={`ow-card pc light ${size}`} aria-label={`단어 ${word}`}>
      <span className="ow-card-band" aria-hidden />
      <b className="ow-word">{word}</b>
    </div>
  );
}

/** 힌트 쪽지 (좌석 색 메모지) */
export function ClueNote({ text, seatColor, state }: { text: string | null; seatColor: string; state: 'writing' | 'done' | 'shown' | 'erased' | 'hidden-erased' }) {
  return (
    <span className={`ow-note ${state}`} style={{ ['--note' as string]: seatColor }}>
      {state === 'writing' ? '…' : state === 'done' ? '✓' : state === 'hidden-erased' ? '겹침' : text}
    </span>
  );
}

export function Logo({ size = 48 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden>
      <rect width="64" height="64" rx="14" fill="#2a5a8a" />
      <rect x="10" y="14" width="20" height="16" rx="3" fill="#ffe27a" transform="rotate(-6 20 22)" />
      <rect x="34" y="12" width="20" height="16" rx="3" fill="#a8e0c0" transform="rotate(5 44 20)" />
      <rect x="20" y="34" width="24" height="18" rx="3" fill="#fffaf0" />
      <text x="32" y="47" textAnchor="middle" fontSize="12" fontWeight="900" fill="#2a5a8a">?</text>
    </svg>
  );
}
