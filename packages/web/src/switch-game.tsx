/**
 * 방을 만든 뒤 다른 게임으로 바꾸기 (방장).
 * 게임마다 서버가 따로라서 「옮기기」로 한다:
 *   1) 방장이 고른 게임의 서버에 새 방을 만든다 (그 게임 소켓에 잠깐 붙어 create → 봇도 같은 난이도로 다시 넣음)
 *   2) 지금 방에 relocate를 알린다 → 서버가 모두에게 새 방 주소를 보냄
 *   3) 모두 그 주소로 이동, 저장된 닉네임으로 자동 입장 (방장은 만든 토큰으로 다시 방장)
 */
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import type { GameMeta, RoomView } from '@bg/core';
import { Icon } from '@bg/ui';
import { store } from './runtime';
import type { Act } from './client';

// 게임 목록: 고르기 창을 열 때만 불러온다 (게임 화면 묶음을 키우지 않게)
const loaders = import.meta.glob<GameMeta>('../../../games/*/meta.ts', { import: 'meta' });
async function loadGames(): Promise<GameMeta[]> {
  const all = await Promise.all(Object.values(loaders).map((f) => f()));
  return all.filter((g) => g.status === 'live').sort((a, b) => a.title.localeCompare(b.title));
}

type Ack = { ok: true; code: string; token: string } | { ok: false; error: string };

/** 다른 게임 서버에 방 만들기 (+ 봇) → 방 코드 */
async function createRoomOn(game: string, name: string, bots: string[]): Promise<string> {
  const s = io({ path: `/${game}/socket.io`, forceNew: true, transports: ['websocket', 'polling'] });
  const call = (ev: string, p: object) =>
    new Promise<Ack>((res) => s.timeout(8000).emit(ev, p, (err: unknown, r: Ack) => res(err ? { ok: false, error: '그 게임 서버에 연결하지 못했어요' } : r)));
  try {
    const r = await call('create', { name });
    if (!r.ok) throw new Error(r.error);
    try {
      localStorage.setItem(`bg:${game}:token:${r.code}`, r.token);
    } catch {
      /* 저장이 막혀 있으면 방장 대신 손님으로 들어감 */
    }
    // 봇을 못 넣는 게임이면 서버가 거절 → 무시
    for (const level of bots) await call('addBot', { level });
    return r.code;
  } finally {
    s.disconnect();
  }
}

export function SwitchGame({ view, act, current }: { view: RoomView; act: Act; current: string }) {
  const [open, setOpen] = useState(false);
  const [games, setGames] = useState<GameMeta[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const players = view.members.filter((m) => m.role === 'player');
  const bots = players.filter((m) => m.bot).map((m) => m.bot as string);
  const humans = players.length - bots.length;

  useEffect(() => {
    if (open && !games) loadGames().then(setGames, () => setErr('게임 목록을 불러오지 못했어요'));
  }, [open, games]);

  const go = async (g: GameMeta) => {
    setBusy(g.id);
    setErr(null);
    try {
      const code = await createRoomOn(g.id, store.name() || '방장', bots.slice(0, Math.max(0, g.players.max - humans)));
      await act('relocate', { game: g.id, code, title: g.title });
    } catch (e) {
      setErr(e instanceof Error ? e.message : '방을 옮기지 못했어요');
      setBusy(null);
    }
  };

  return (
    <>
      <button className="btn small-btn" onClick={() => setOpen(true)}>
        <Icon name="swap" /> 다른 게임으로 바꾸기
      </button>
      {open && (
        <div className="overlay" role="dialog" aria-modal="true" aria-label="다른 게임 고르기" onClick={(e) => e.target === e.currentTarget && !busy && setOpen(false)}>
          <div className="panel sheet switch-sheet">
            <div className="row between">
              <h2>다른 게임으로 바꾸기</h2>
              <button className="btn ghost tiny" onClick={() => setOpen(false)} disabled={!!busy} aria-label="닫기">
                <Icon name="x" />
              </button>
            </div>
            <p className="small muted">
              지금 방의 사람 {humans}명{bots.length ? `과 봇 ${bots.length}명` : ''}이 함께 새 게임 방으로 옮겨요. 닉네임은 그대로예요.
            </p>
            {err && <p className="small warn">{err}</p>}
            {!games ? (
              <p className="muted small">불러오는 중…</p>
            ) : (
              <ul className="switch-list">
                {games
                  .filter((g) => g.id !== current)
                  .map((g) => {
                    const tooMany = humans > g.players.max;
                    const noBots = g.tags.includes('bot-friendly') === false && bots.length > 0;
                    return (
                      <li key={g.id}>
                        <button className="switch-item" disabled={tooMany || !!busy} onClick={() => go(g)}>
                          <svg viewBox="0 0 64 64" width="40" height="40" aria-hidden dangerouslySetInnerHTML={{ __html: g.icon }} />
                          <span className="switch-text">
                            <b>{g.title}</b> <span className="muted small">{g.subtitle}</span>
                            <span className="small muted">
                              <Icon name="users" /> {g.players.min === g.players.max ? g.players.min : `${g.players.min}~${g.players.max}`}명
                              {tooMany ? ' · 사람이 너무 많아요' : humans + bots.length < g.players.min ? ' · 봇을 더 넣어야 해요' : ''}
                              {noBots ? ' · 봇 없이 하는 게임일 수 있어요' : ''}
                            </span>
                          </span>
                          {busy === g.id && <span className="small">옮기는 중…</span>}
                        </button>
                      </li>
                    );
                  })}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/** 옮기기를 받은 모두: 새 방으로 이동 (방장은 바로, 나머지는 조금 뒤 — 방장이 먼저 들어가 방장 자리를 지키게) */
export function useRelocate(view: RoomView | null) {
  const to = view?.lobby.relocate ?? null;
  const isHost = !!view && view.hostId === view.you;
  useEffect(() => {
    if (!to) return;
    const t = setTimeout(() => location.assign(`/${to.game}/r/${to.code}?auto=1`), isHost ? 200 : 1800);
    return () => clearTimeout(t);
  }, [to?.game, to?.code, isHost]); // eslint-disable-line react-hooks/exhaustive-deps
  return to;
}
