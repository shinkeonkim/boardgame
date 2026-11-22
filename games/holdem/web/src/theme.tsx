import { ChipSvg } from '@bg/ui';

/** 칩 더미: 금액에 따라 색이 다른 칩을 몇 개 쌓아 보여 줌 (숫자는 옆 글씨로) */
const DENOMS: [number, string][] = [
  [1000, '#2b2b33'],
  [500, '#6a3fb0'],
  [100, '#2f6fb0'],
  [25, '#2f9e6a'],
  [5, '#d0453a'],
  [1, '#f4f4f6'],
];
export function ChipStack({ amount, size = 26, max = 6 }: { amount: number; size?: number; max?: number }) {
  const chips: string[] = [];
  let rest = amount;
  for (const [d, col] of DENOMS) {
    while (rest >= d && chips.length < max) {
      chips.push(col);
      rest -= d;
    }
  }
  // 위에서 비스듬히 본 더미: 한 장마다 18%씩 위로
  const step = size * 0.18;
  return (
    <span className="hd-stack" aria-label={`칩 ${amount}`} style={{ width: size, height: size + step * Math.max(0, chips.length - 1) }}>
      {chips.map((col, i) => (
        <span key={i} className="hd-chip" style={{ bottom: i * step }}>
          <ChipSvg fill={col} edge={col === '#f4f4f6' ? '#9aa0ad' : '#fff'} size={size} />
        </span>
      ))}
    </span>
  );
}

export function Logo({ size = 48 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden>
      <rect width="64" height="64" rx="14" fill="#1f5a3a" />
      <rect x="10" y="12" width="22" height="32" rx="4" fill="#fffaf0" transform="rotate(-10 21 28)" />
      <rect x="26" y="12" width="22" height="32" rx="4" fill="#fffaf0" transform="rotate(8 37 28)" />
      <text x="20" y="34" fontSize="14" fontWeight="900" fill="#1f2430" fontFamily="Georgia, serif" transform="rotate(-10 21 28)">A</text>
      <text x="33" y="33" fontSize="14" fontWeight="900" fill="#c0392b" fontFamily="Georgia, serif" transform="rotate(8 37 28)">A</text>
      <circle cx="46" cy="48" r="9" fill="#d0453a" stroke="#fff" strokeWidth="2" strokeDasharray="3 2.4" />
    </svg>
  );
}
