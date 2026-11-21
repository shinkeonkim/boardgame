import { io, Socket } from 'socket.io-client';

/**
 * 게임 웹 런타임: 소켓·저장소. 게임은 /<id>/ 아래에서 서비스되므로 Vite base(import.meta.env.BASE_URL)를 기준으로 한다.
 * 같은 도메인의 여러 게임이 localStorage를 공유하므로 키에 게임 id를 넣는다 (닉네임·음소거·테마는 공유).
 */
export const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');

export const socket: Socket = io({ path: `${BASE}/socket.io`, autoConnect: true, transports: ['websocket', 'polling'] });

export type AckResult<T = Record<string, unknown>> = ({ ok: true } & T) | { ok: false; error: string };

export function call<T = Record<string, unknown>>(event: string, payload: object = {}): Promise<AckResult<T>> {
  return new Promise((resolve) => {
    socket.timeout(8000).emit(event, payload, (err: unknown, res: AckResult<T>) => {
      if (err) resolve({ ok: false, error: '연결이 잠깐 끊겼어요. 다시 시도해 주세요' });
      else resolve(res);
    });
  });
}

// localStorage는 막혀 있을 수 있으므로 항상 try/catch
function get(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function set(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

let gameId = 'game';
/** mountGame이 한 번 부른다 */
export function setGameId(id: string) {
  gameId = id;
}

export const store = {
  /** 닉네임은 모든 게임 공유 */
  name: () => get('bg:name') ?? '',
  setName: (n: string) => set('bg:name', n),
  token: (code: string) => get(`bg:${gameId}:token:${code}`),
  setToken: (code: string, t: string | null) => set(`bg:${gameId}:token:${code}`, t),
  password: (code: string) => get(`bg:${gameId}:pw:${code}`),
  setPassword: (code: string, pw: string | null) => set(`bg:${gameId}:pw:${code}`, pw),
};
