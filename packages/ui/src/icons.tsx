/**
 * 아이콘 (직접 그린 SVG · 이모지 대신). 24×24 격자, 선 굵기 1.9, 둥근 끝, 색은 currentColor → 글자 색·테마를 그대로 따른다.
 *   <Icon name="sun" />                       글자 크기(1em)에 맞춰 줄 안에
 *   iconize('👥 2~6명')                        문자열 속 이모지를 아이콘으로 (게임이 넘긴 칩·제목·안내에 씀)
 */
import { Fragment, ReactNode, isValidElement, cloneElement, type CSSProperties, type ReactElement } from 'react';

const P: Record<string, ReactNode> = {
  thumbUp: <path d="M7 11v9H4v-9zM7 11l4-7c1.4 0 2.3 1 2 2.4L12.4 10H19a2 2 0 0 1 2 2.3l-1.2 6A2 2 0 0 1 17.8 20H7" />,
  thumbDown: <path d="M7 13V4H4v9zM7 13l4 7c1.4 0 2.3-1 2-2.4L12.4 14H19a2 2 0 0 0 2-2.3l-1.2-6A2 2 0 0 0 17.8 4H7" />,
  scroll: <path d="M6 4h11a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8M6 4a2 2 0 0 0-2 2v2h4V6a2 2 0 0 0-2-2zM8 8v10a2 2 0 0 1-2 2M11 9h5M11 13h5" />,
  square: <rect x="5" y="5" width="14" height="14" rx="2.5" />,
  squareFill: <rect x="5" y="5" width="14" height="14" rx="2.5" fill="currentColor" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
    </>
  ),
  moon: <path d="M20 14.5A8.2 8.2 0 1 1 9.5 4a6.6 6.6 0 0 0 10.5 10.5z" />,
  monitor: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M16.5 14.2c2.6.3 4.5 2.6 4.5 5.8" />
    </>
  ),
  bot: (
    <>
      <rect x="4.5" y="8" width="15" height="11" rx="3.2" />
      <path d="M12 4.6V8M10 15.8h4" />
      <circle cx="12" cy="3.6" r="1" />
      <circle cx="9.3" cy="12.6" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="14.7" cy="12.6" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  x: <path d="M6 6l12 12M18 6L6 18" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  palette: (
    <>
      <path d="M12 3a9 9 0 1 0 0 18c1.2 0 1.7-1 1.2-1.9-.5-1 .2-2.1 1.3-2.1H17a4 4 0 0 0 4-4c0-5.5-4-10-9-10z" />
      <circle cx="7.5" cy="11" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="10" cy="7" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="14.6" cy="7" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="17" cy="10.6" r="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  flag: <path d="M5 21V4M5 4h12l-2.2 4L17 12H5" />,
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="15" r="4" />
      <path d="M11 12l9-9M17 6l2.2 2.2M14.6 8.4l2 2" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.2 2" />
    </>
  ),
  timer: (
    <>
      <circle cx="12" cy="13.5" r="7.5" />
      <path d="M12 10v3.5l2 2M10 2.8h4" />
    </>
  ),
  hourglass: <path d="M7 3h10M7 21h10M8 3v3l4 6 4-6V3M8 21v-3l4-6 4 6v3" />,
  pause: <path d="M9 6v12M15 6v12" />,
  play: <path d="M8 5l11 7-11 7z" />,
  crown: <path d="M3 8l4.6 4L12 5l4.4 7L21 8l-2 11H5z" />,
  book: <path d="M4 19V5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5M8 7.5h8" />,
  bell: <path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4zM10 21h4" />,
  bellOff: <path d="M6 16v-5a6 6 0 0 1 9.5-4.9M18 11v5l2 2H8M10 21h4M3 3l18 18" />,
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5l-2 5-5 2 2-5z" />
    </>
  ),
  scale: <path d="M12 4v16M7 20h10M5 7h14M5 7l-3 6a3 3 0 0 0 6 0zM19 7l-3 6a3 3 0 0 0 6 0z" />,
  link: <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4.4-4.4" />
    </>
  ),
  dice: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="3.5" />
      <circle cx="8.6" cy="8.6" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="15.4" cy="15.4" r="1.3" fill="currentColor" stroke="none" />
    </>
  ),
  pencil: <path d="M4 20l1.2-4.8L16 4.4l3.6 3.6L8.8 18.8zM13.6 6.8l3.6 3.6" />,
  eraser: <path d="M8.5 20L4 15.5 14.5 5l5.5 5.5L10.5 20zM8.5 20H20M9.5 10l5.5 5.5" />,
  trash: <path d="M4 7h16M9.5 7V4h5v3M6 7l1 13h10l1-13M10 11v6M14 11v6" />,
  undo: <path d="M9 6L4 11l5 5M4 11h10a5 5 0 0 1 0 10h-3" />,
  hand: <path d="M8 12.5V5.5a1.5 1.5 0 0 1 3 0V11M11 10V3.8a1.5 1.5 0 0 1 3 0V11M14 10.5V5.5a1.5 1.5 0 0 1 3 0v8c0 4.2-2.6 7.5-6.6 7.5-2.4 0-4-1.1-5.2-3L3.5 13.6a1.6 1.6 0 0 1 2.6-1.9L8 14" />,
  trophy: <path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4.2M16 6h3a3 3 0 0 1-3 4.2M12 13v4M8 20.5h8M9.5 17h5v3.5h-5z" />,
  star: <path d="M12 3.2l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17.2l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />,
  puzzle: <path d="M10 4h4v2.2a1.6 1.6 0 0 0 3.2 0V4H20v6.5h-2.2a1.6 1.6 0 0 0 0 3.2H20V20h-6.5v-2.2a1.6 1.6 0 0 0-3.2 0V20H4v-6.5h2.2a1.6 1.6 0 0 0 0-3.2H4V4z" />,
  note: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 8h6M9 12h6M9 16h3.5" />
    </>
  ),
  zap: <path d="M13 2.8L4.8 14H11l-1 7.2L18.2 10H12z" />,
  spy: (
    <>
      <path d="M3.5 11.5h17M7 11.5l1.6-6.5h6.8l1.6 6.5" />
      <circle cx="8.3" cy="16" r="2.6" />
      <circle cx="15.7" cy="16" r="2.6" />
      <path d="M10.9 16h2.2" />
    </>
  ),
  phone: (
    <>
      <rect x="7" y="3" width="10" height="18" rx="2.2" />
      <path d="M11 17.8h2" />
    </>
  ),
  swords: <path d="M4 4l10.5 10.5M14.5 14.5l2.5-1 1 1-1 1 2 2-1.5 1.5-2-2-1 1-1-1zM20 4L9.5 14.5M9.5 14.5l-2.5-1-1 1 1 1-2 2 1.5 1.5 2-2 1 1 1-1z" />,
  hash: <path d="M5 9h14M5 15h14M10.2 4L8.6 20M15.4 4l-1.6 16" />,
  bulb: <path d="M9.2 18h5.6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.6 1 1.3 1 2.2h5.2c0-.9.3-1.6 1-2.2A6 6 0 0 0 12 3z" />,
  mask: <path d="M4 5h16v6a8 8 0 0 1-16 0zM8 10h2M14 10h2M9 14c1.6 1.4 4.4 1.4 6 0" />,
  eye: (
    <>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  eyeOff: <path d="M3 3l18 18M10.6 5.1A10.6 10.6 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-2.7 3.6M6.6 6.6C3.7 8.5 2 12 2 12s3.6 7 10 7c1.9 0 3.6-.6 5-1.5M9.9 9.9a3 3 0 0 0 4.2 4.2" />,
  rainbow: <path d="M3 18a9 9 0 0 1 18 0M6.5 18a5.5 5.5 0 0 1 11 0M10 18a2 2 0 0 1 4 0" />,
  gem: <path d="M6.5 4h11L21 9l-9 11L3 9zM3 9h18M9.5 4L12 9l2.5-5M12 9v11" />,
  hat: <path d="M7 15V5h10v10M3 18.5c0-1.9 4-3.5 9-3.5s9 1.6 9 3.5M7 11h10" />,
  rose: <path d="M12 13.5c-3 0-4.5-2-4.5-4.6 2.2 0 3.4.6 4.5 1.7 1.1-1.1 2.3-1.7 4.5-1.7 0 2.6-1.5 4.6-4.5 4.6zM10 7.6C10.6 5.6 11.3 4 12 3.5c.7.5 1.4 2.1 2 4.1M12 13.5V21M12 17.5c-2.2 0-3.4-1-4-2.6M12 18.5c2.2 0 3.4-1 4-2.6" />,
  cactus: <path d="M10 21V5a2 2 0 0 1 4 0v16M10 13.5H7.5a2 2 0 0 1-2-2V8.5M14 11h2.5a2 2 0 0 0 2-2V7M6.5 21h11" />,
  bag: <path d="M9.2 3h5.6l-1.6 3.2h-2.4zM10.6 6.2C6.2 8.2 4 12 4 15a5 5 0 0 0 5 5h6a5 5 0 0 0 5-5c0-3-2.2-6.8-6.6-8.8M14 11.6c-.5-.8-1.2-1.1-2-1.1-1.2 0-2 .6-2 1.5s.8 1.3 2 1.5 2 .7 2 1.6-.8 1.4-2 1.4c-.9 0-1.6-.3-2-1M12 9.4v1.1M12 16.5v1.1" />,
  boom: <path d="M12 2.5l1.8 5.1L19 5.2l-2.3 5L21.5 12l-5 1.8L19 18.8l-5-2.3L12 21.5l-1.8-5L5 18.8l2.3-5L2.5 12l5-1.8L5 5.2l5.1 2.4z" />,
  point: <path d="M10 12V4a1.6 1.6 0 0 1 3.2 0v8M13.2 10.8a1.6 1.6 0 0 1 3.2 0v1.4M16.4 11.6a1.6 1.6 0 0 1 3.2 0V15c0 3.6-2.6 6-6 6h-1c-2.4 0-3.7-1-4.8-2.6L5 14.6a1.6 1.6 0 0 1 2.7-1.7L10 15.5" />,
  wrench: <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3.5 17.5 6.5 20.5l5.8-5.8a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.6-.4-.4-2.6z" />,
  plate: (
    <>
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="3.6" />
      <path d="M2.5 4v16M21.5 4v16" />
    </>
  ),
  dagger: <path d="M14.5 4.5L19.8 3l-1.5 5.3L9 17.6 6.4 15zM5.5 14l4.5 4.5M3.5 20.5l3-3" />,
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3.5 6.5l8.5 6.5 8.5-6.5" />
    </>
  ),
  ballot: (
    <>
      <rect x="4" y="11" width="16" height="9.5" rx="1.6" />
      <path d="M9 11V3.5h6V11M8 15.5h8" />
    </>
  ),
  orb: (
    <>
      <circle cx="12" cy="10" r="6.2" />
      <path d="M6.8 20.5h10.4L15.6 16.5H8.4zM9.6 8.6a2.6 2.6 0 0 1 2.4-2" />
    </>
  ),
  bricks: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="1.2" />
      <path d="M3 9.7h18M3 14.3h18M9 5v4.7M15 5v4.7M12 9.7v4.6M7 14.3V19M17 14.3V19" />
    </>
  ),
  boat: <path d="M12 3v14M12 4.5l6.5 11H12M10 7.5l-5 8h5M3 19c3.5 2 14.5 2 18 0" />,
  party: <path d="M4 20.5l4.2-11.2 7 7zM11.5 7.5c.8-2 2.8-3 4.8-2.2M15 11.2c1.9-1 4-.8 5.3.8M12.8 3l.4 1.8M20.6 8.6l-1.8.4M18.6 2.8l-.9 1.8" />,
  firework: <path d="M12 3v4.2M12 16.8V21M3 12h4.2M16.8 12H21M5.6 5.6l3 3M15.4 15.4l3 3M5.6 18.4l3-3M15.4 8.6l3-3" />,
  skull: (
    <>
      <path d="M12 3a8 8 0 0 0-8 8c0 3 1.5 4.6 3 5.5V20h10v-3.5c1.5-.9 3-2.5 3-5.5a8 8 0 0 0-8-8zM10.5 20v-2M13.5 20v-2" />
      <circle cx="9" cy="11.5" r="1.7" />
      <circle cx="15" cy="11.5" r="1.7" />
    </>
  ),
  warning: <path d="M12 3.2L21.6 20H2.4zM12 10v4.6M12 17.4v.2" />,
  ban: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M5.7 5.7l12.6 12.6" />
    </>
  ),
  heart: <path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z" />,
  heartBreak: <path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11zM12 6.2l-1.6 4 3 2.1-1.6 3.6" />,
  shield: <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />,
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  smile: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 14.5c1.9 2 5.1 2 7 0" />
      <circle cx="9" cy="10" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="10" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  cup: <path d="M5 9h11v4.5a5.5 5.5 0 0 1-5.5 5.5h0A5.5 5.5 0 0 1 5 13.5zM16 10.5h1.5a2.5 2.5 0 0 1 0 5H16M8.5 3.5v2.8M12 3.5v2.8" />,
  swap: <path d="M4 12h16M8 8l-4 4 4 4M16 8l4 4-4 4" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5M12 7.6v.2" />
    </>
  ),
  sparkle: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" />,
  cards: (
    <>
      <rect x="3.5" y="6" width="11" height="15" rx="2" transform="rotate(-8 9 13.5)" />
      <path d="M12.5 4.4l5.6-.8a2 2 0 0 1 2.3 1.7l1.6 11a2 2 0 0 1-1.7 2.3l-3 .4" />
    </>
  ),
  dot: <circle cx="12" cy="12" r="6" fill="currentColor" stroke="none" />,
  arrowRight: <path d="M4 12h15M13 6l6 6-6 6" />,
  door: <path d="M5 21V4.5A1.5 1.5 0 0 1 6.5 3H17.5A1.5 1.5 0 0 1 19 4.5V21M3 21h18M14.5 12.5v.2" />,
  plus: <path d="M12 5v14M5 12h14" />,
  chopsticks: <path d="M5 21L16 3M9.5 21L20 4.5" />,
  pin: <path d="M9 3h6l-1 6 3.5 3.5h-11L10 9zM12 12.5V21" />,
  unlock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 7.6-1.8" />
    </>
  ),
  more: (
    <>
      <circle cx="5.5" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="18.5" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </>
  ),
};

export type IconName = keyof typeof P;
export const ICON_NAMES = Object.keys(P) as IconName[];

export function Icon({ name, size, className, style, title, color }: { name: IconName | string; size?: number | string; className?: string; style?: CSSProperties; title?: string; color?: string }) {
  const body = P[name] ?? P.dot;
  return (
    <svg
      className={`ic ${className ?? ''}`}
      viewBox="0 0 24 24"
      width={size ?? '1.1em'}
      height={size ?? '1.1em'}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      style={color ? { color, ...style } : style}
    >
      {body}
    </svg>
  );
}

/** 이모지 → 아이콘 이름 (색이 뜻인 것은 색도) */
const EMOJI: Record<string, IconName | [IconName, string]> = {
  '☀': 'sun', '🌙': 'moon', '💻': 'monitor', '👥': 'users', '🤖': 'bot', '✕': 'x', '✖': 'x', '❌': 'x', '✓': 'check', '✔': 'check', '✅': 'check',
  '🎨': 'palette', '🏁': 'flag', '🚩': 'flag', '🔒': 'lock', '🔐': 'lock', '🔑': 'key', '⏱': 'timer', '⏰': 'clock', '🕐': 'clock', '⏳': 'hourglass', '⌛': 'hourglass',
  '⏸': 'pause', '▶': 'play', '👑': 'crown', '📖': 'book', '📚': 'book', '🔔': 'bell', '🔕': 'bellOff', '🧭': 'compass', '⚖': 'scale', '🤝': 'link',
  '🔍': 'search', '🔎': 'search', '🎲': 'dice', '✏': 'pencil', '🖌': 'pencil', '🧽': 'eraser', '🗑': 'trash', '↶': 'undo', '✋': 'hand', '🖐': 'hand',
  '🏆': 'trophy', '🥇': 'trophy', '⭐': 'star', '🌟': 'star', '🧩': 'puzzle', '📝': 'note', '⚡': 'zap', '🕵': 'spy', '📱': 'phone', '⚔': 'swords',
  '🔢': 'hash', '🧠': 'bulb', '💡': 'bulb', '🎭': 'mask', '👀': 'eye', '👁': 'eye', '🙈': 'eyeOff', '🌈': 'rainbow', '💎': 'gem', '🎩': 'hat',
  '🌹': ['rose', '#c0392b'], '🌵': ['cactus', '#2e8b57'], '💰': 'bag', '💥': 'boom', '☝': 'point', '🛠': 'wrench', '🔧': 'wrench', '🍣': 'plate', '🍽': 'plate',
  '🗡': 'dagger', '✉': 'mail', '📨': 'mail', '🗳': 'ballot', '🔮': 'orb', '🧱': 'bricks', '⛵': 'boat', '🎉': 'party', '🥳': 'party', '🎆': 'firework', '🎇': 'firework',
  '💀': 'skull', '⚠': 'warning', '🚫': 'ban', '💔': 'heartBreak', '❤': 'heart', '🛡': 'shield', '🎯': 'target', '😊': 'smile', '🙂': 'smile', '🍵': 'cup', '☕': 'cup',
  '↔': 'swap', '🔄': 'swap', 'ℹ': 'info', '✨': 'sparkle', '🃏': 'cards', '🎴': 'cards', '🔴': ['dot', '#d0453a'], '🔵': ['dot', '#2f6fb0'], '🟢': ['dot', '#2e8b57'], '🟡': ['dot', '#d4a017'],
  '👍': 'thumbUp', '👎': 'thumbDown', '📜': 'scroll', '🏴': 'flag', '⬛': 'squareFill', '⬜': 'square', '😱': 'zap',
  '➡': 'arrowRight', '🚪': 'door', '➕': 'plus', '🥢': 'chopsticks', '🔓': 'unlock', '📌': 'pin', '📍': 'pin',
};

/** 이모지 한 글자(+변형 선택자·피부색·ZWJ 묶음)와 숫자 키캡 */
const EMOJI_RE = /([0-9#]️?⃣)|((?:\p{Extended_Pictographic}|[✕✖✓✔↔↶ℹ])(?:️|[\u{1F3FB}-\u{1F3FF}])?(?:‍\p{Extended_Pictographic}️?)*)/gu;

/** 숫자 키캡(7️⃣)은 둥근 네모 안 숫자로 */
function Keycap({ d }: { d: string }) {
  return (
    <svg className="ic" viewBox="0 0 24 24" width="1.1em" height="1.1em" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth={1.9} />
      <text x="12" y="16.6" textAnchor="middle" fontSize="12.5" fontWeight="800" fill="currentColor" fontFamily="system-ui, sans-serif">
        {d}
      </text>
    </svg>
  );
}

/** 문자열에서 아는 이모지를 아이콘으로 (모르는 이모지·카드 무늬는 그대로) */
export function iconize(node: ReactNode): ReactNode {
  if (typeof node === 'string') {
    if (!/[\p{Extended_Pictographic}⃣✕✖✓✔↔↶ℹ]/u.test(node)) return node;
    const out: ReactNode[] = [];
    let last = 0;
    let k = 0;
    for (const m of node.matchAll(EMOJI_RE)) {
      const raw = m[0];
      const base = raw.replace(/[️‍\u{1F3FB}-\u{1F3FF}]/gu, '');
      let el: ReactNode = null;
      if (m[1]) el = <Keycap key={k++} d={m[1][0]} />;
      else {
        const hit = EMOJI[base] ?? EMOJI[[...base][0]];
        if (hit) el = Array.isArray(hit) ? <Icon key={k++} name={hit[0]} color={hit[1]} /> : <Icon key={k++} name={hit} />;
      }
      if (!el) continue;
      out.push(node.slice(last, m.index), el);
      last = m.index! + raw.length;
    }
    if (!out.length) return node;
    out.push(node.slice(last));
    return out.filter((x) => x !== '');
  }
  if (Array.isArray(node)) return node.map((n, i) => <Fragment key={i}>{iconize(n)}</Fragment>);
  // <>…</> 안의 글자도 (한 단계)
  if (isValidElement(node) && node.type === Fragment) {
    const el = node as ReactElement<{ children?: ReactNode }>;
    return cloneElement(el, {}, iconize(el.props.children));
  }
  return node;
}
