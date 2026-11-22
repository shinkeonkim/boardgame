export { PlayingCard, CardBack, SUITS, SUIT_NAMES, isRed, cardName } from '@bg/ui';

export function Logo({ size = 48 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden>
      <rect width="64" height="64" rx="14" fill="#2a6a4a" />
      <rect x="14" y="12" width="24" height="34" rx="4" fill="#fffaf0" transform="rotate(-10 26 29)" />
      <rect x="26" y="16" width="24" height="34" rx="4" fill="#fffaf0" stroke="#2a2a2a" strokeWidth="0.8" />
      <text x="38" y="39" textAnchor="middle" fontSize="18" fontWeight="900" fill="#c0392b" fontFamily="Georgia, serif">1</text>
      <text x="38" y="27" textAnchor="middle" fontSize="9" fill="#c0392b">♥</text>
    </svg>
  );
}
