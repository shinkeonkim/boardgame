/**
 * 하우스룰 링크: 방 규칙(config)을 주소 하나로 공유. /<게임>/?rules=<base64url JSON>
 * 받은 사람이 그 주소에서 방을 만들면 같은 규칙으로 시작한다 (서버가 sanitizeConfig 로 다시 거름).
 */
const enc = (s: string) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const dec = (s: string) => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));

export function rulesLink(base: string, config: object): string {
  return `${location.origin}${base}/?rules=${enc(JSON.stringify(config))}`;
}

/** 주소의 ?rules= 를 읽음 (깨졌으면 null) */
export function readRulesParam(search = typeof location === 'undefined' ? '' : location.search): object | null {
  const raw = new URLSearchParams(search).get('rules');
  if (!raw || raw.length > 4000) return null;
  try {
    const v = JSON.parse(dec(raw));
    return v && typeof v === 'object' && !Array.isArray(v) ? v : null;
  } catch {
    return null;
  }
}
