export const TEAMS = [
  { name: '빨강 팀', short: '빨강', hex: '#d0533f', icon: '🔴' },
  { name: '파랑 팀', short: '파랑', hex: '#3a7bd5', icon: '🔵' },
];

export function Logo({ size = 48 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden>
      <rect width="64" height="64" rx="14" fill="#1f2430" />
      {[0, 1, 2].map((r) =>
        [0, 1, 2].map((c) => {
          const fill = (r * 3 + c) % 4 === 0 ? '#d0533f' : (r * 3 + c) % 4 === 1 ? '#3a7bd5' : r === 1 && c === 1 ? '#111' : '#e8dcc2';
          return <rect key={`${r}${c}`} x={11 + c * 15} y={11 + r * 15} width="12" height="12" rx="2.5" fill={fill} />;
        }),
      )}
    </svg>
  );
}
