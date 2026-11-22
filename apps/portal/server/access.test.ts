import { generateKeyPairSync, sign } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { verifyAccessJwt } from './access';

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'k1' };
const keys = async () => [jwk];
const b64u = (b: Buffer | string) => Buffer.from(b).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
const NOW = 1_800_000_000_000;
function jwt(payload: object, kid = 'k1', key = privateKey) {
  const h = b64u(JSON.stringify({ alg: 'RS256', kid }));
  const p = b64u(JSON.stringify(payload));
  return `${h}.${p}.${b64u(sign('RSA-SHA256', Buffer.from(`${h}.${p}`), key))}`;
}
const opts = { team: 'team.cloudflareaccess.com', aud: 'AUD1', now: NOW, keys };
const good = { aud: ['AUD1'], iss: 'https://team.cloudflareaccess.com', exp: NOW / 1000 + 600, email: 'Me@Example.com' };

describe('Cloudflare Access JWT', () => {
  it('맞는 서명·aud·iss·exp면 통과 (이메일은 소문자로)', async () => {
    expect(await verifyAccessJwt(jwt(good), opts)).toEqual({ ok: true, email: 'me@example.com' });
  });
  it('서명이 다르면 거절', async () => {
    const other = generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey;
    expect((await verifyAccessJwt(jwt(good, 'k1', other), opts)).ok).toBe(false);
    const t = jwt(good).split('.');
    t[1] = b64u(JSON.stringify({ ...good, email: 'evil@x.com' }));
    expect((await verifyAccessJwt(t.join('.'), opts)).ok).toBe(false);
  });
  it('다른 앱(aud)·발급처·만료·모르는 키는 거절', async () => {
    expect(await verifyAccessJwt(jwt({ ...good, aud: ['OTHER'] }), opts)).toMatchObject({ ok: false, status: 403 });
    expect(await verifyAccessJwt(jwt({ ...good, iss: 'https://evil.cloudflareaccess.com' }), opts)).toMatchObject({ ok: false, status: 403 });
    expect(await verifyAccessJwt(jwt({ ...good, exp: NOW / 1000 - 3600 }), opts)).toMatchObject({ ok: false, status: 401 });
    expect(await verifyAccessJwt(jwt(good, 'nope'), opts)).toMatchObject({ ok: false, status: 401 });
  });
  it('관리자 이메일 목록이 있으면 그 사람만', async () => {
    expect((await verifyAccessJwt(jwt(good), { ...opts, emails: ['me@example.com'] })).ok).toBe(true);
    expect(await verifyAccessJwt(jwt(good), { ...opts, emails: ['boss@example.com'] })).toMatchObject({ ok: false, status: 403 });
  });
  it('alg none 같은 다른 방식은 거절', async () => {
    const h = b64u(JSON.stringify({ alg: 'none', kid: 'k1' }));
    expect((await verifyAccessJwt(`${h}.${b64u(JSON.stringify(good))}.`, opts)).ok).toBe(false);
  });
});
