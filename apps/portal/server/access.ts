/**
 * Cloudflare Access 확인. /admin 앞에 Cloudflare Zero Trust Access 앱을 두면, 로그인한 사람의 요청에
 * `Cf-Access-Jwt-Assertion` 헤더(또는 CF_Authorization 쿠키)로 서명된 JWT가 붙어 온다.
 * 팀 도메인의 공개키(/cdn-cgi/access/certs)로 서명을 확인하고 aud·iss·exp·이메일을 본다.
 *
 * 환경변수: CF_ACCESS_TEAM_DOMAIN (예: myteam.cloudflareaccess.com), CF_ACCESS_AUD (Access 앱의 AUD 태그),
 *          ADMIN_EMAILS (선택, 쉼표로 — 없으면 Access 정책을 통과한 모두), ADMIN_DEV=1 (로컬 개발에서만: 확인 생략)
 */
import { createPublicKey, verify, type JsonWebKey } from 'node:crypto';
import type { IncomingMessage } from 'node:http';

export type AccessResult = { ok: true; email: string } | { ok: false; status: number; error: string };

interface Jwk extends JsonWebKey {
  kid?: string;
}
type FetchKeys = (team: string) => Promise<Jwk[]>;

const b64 = (s: string) => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');

let cache: { at: number; team: string; keys: Jwk[] } | null = null;
const fetchKeys: FetchKeys = async (team) => {
  if (cache && cache.team === team && Date.now() - cache.at < 10 * 60_000) return cache.keys;
  const r = await fetch(`https://${team}/cdn-cgi/access/certs`, { signal: AbortSignal.timeout(5000) });
  if (!r.ok) throw new Error(`certs ${r.status}`);
  const keys = ((await r.json()) as { keys: Jwk[] }).keys;
  cache = { at: Date.now(), team, keys };
  return keys;
};

export function tokenFrom(req: IncomingMessage): string | null {
  const h = req.headers['cf-access-jwt-assertion'];
  if (typeof h === 'string' && h) return h;
  const cookie = req.headers.cookie ?? '';
  const m = cookie.match(/(?:^|;\s*)CF_Authorization=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

/** JWT 하나 확인 (테스트에서 키 가져오기를 바꿀 수 있게 분리) */
export async function verifyAccessJwt(
  token: string,
  opts: { team: string; aud: string; emails?: string[]; now?: number; keys?: FetchKeys },
): Promise<AccessResult> {
  const parts = token.split('.');
  if (parts.length !== 3) return { ok: false, status: 401, error: '로그인 정보가 이상해요' };
  let header: { alg?: string; kid?: string };
  let payload: { aud?: string | string[]; iss?: string; exp?: number; nbf?: number; email?: string };
  try {
    header = JSON.parse(b64(parts[0]).toString('utf8'));
    payload = JSON.parse(b64(parts[1]).toString('utf8'));
  } catch {
    return { ok: false, status: 401, error: '로그인 정보가 이상해요' };
  }
  if (header.alg !== 'RS256') return { ok: false, status: 401, error: '지원하지 않는 서명 방식이에요' };
  const keys = await (opts.keys ?? fetchKeys)(opts.team);
  const jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) return { ok: false, status: 401, error: '서명 키를 찾지 못했어요' };
  const good = verify('RSA-SHA256', Buffer.from(`${parts[0]}.${parts[1]}`), createPublicKey({ key: jwk, format: 'jwk' }), b64(parts[2]));
  if (!good) return { ok: false, status: 401, error: '서명이 맞지 않아요' };
  const now = Math.floor((opts.now ?? Date.now()) / 1000);
  const auds = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!auds.includes(opts.aud)) return { ok: false, status: 403, error: '이 앱의 로그인이 아니에요' };
  if (payload.iss !== `https://${opts.team}`) return { ok: false, status: 403, error: '발급처가 달라요' };
  if (!payload.exp || payload.exp < now - 30) return { ok: false, status: 401, error: '로그인이 만료됐어요. 새로 고침해 주세요' };
  if (payload.nbf && payload.nbf > now + 30) return { ok: false, status: 401, error: '아직 쓸 수 없는 로그인이에요' };
  const email = String(payload.email ?? '').toLowerCase();
  if (opts.emails?.length && !opts.emails.includes(email)) return { ok: false, status: 403, error: '관리자로 등록된 계정이 아니에요' };
  return { ok: true, email };
}

/** 요청이 관리자의 것인가 */
export async function checkAdmin(req: IncomingMessage): Promise<AccessResult> {
  if (process.env.ADMIN_DEV === '1') return { ok: true, email: 'dev@local' };
  const team = process.env.CF_ACCESS_TEAM_DOMAIN;
  const aud = process.env.CF_ACCESS_AUD;
  if (!team || !aud) return { ok: false, status: 503, error: '관리자 페이지가 아직 설정되지 않았어요 (CF_ACCESS_TEAM_DOMAIN · CF_ACCESS_AUD)' };
  const token = tokenFrom(req);
  if (!token) return { ok: false, status: 401, error: 'Cloudflare Access 로그인이 필요해요' };
  const emails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
  try {
    return await verifyAccessJwt(token, { team, aud, emails });
  } catch (e) {
    console.error('access: 키를 가져오지 못함', e);
    return { ok: false, status: 503, error: '로그인 확인 서버에 닿지 못했어요' };
  }
}
