/**
 * 관리자 페이지 (/admin). Cloudflare Access로 로그인한 관리자만 /admin/api가 응답한다.
 * - 통계: Prometheus 24시간 요약 (게임 수·끝까지 마친 게임·평균 시간·지금 사람·인기 게임·시간대별)
 * - 모든 방에 공지 · 점검 모드(새 방 막기)
 * - 게임별 열린 방: 상태·사람·봇·마지막 활동 → 방 닫기, 한 사람 내보내기
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AdminGameState, AdminRoom } from '@bg/core';
import { Icon } from '@bg/ui';
import { GAMES, gameById } from '../catalog';

type Stats = { started24h: number; finished24h: number; roomsNow: number; peopleNow: number; avgMinutes: number | null; top: { game: string; started: number; finished: number }[]; hourly: number[] } | { error: string };
type GameRow = { id: string; state?: AdminGameState; error?: string };

async function api<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const r = await fetch(`/admin/api${path}`, {
    method: init?.method ?? 'GET',
    headers: { 'content-type': 'application/json', 'x-bg-admin': '1' },
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
    cache: 'no-store',
    credentials: 'same-origin',
  });
  const d = await r.json().catch(() => ({ error: `응답 ${r.status}` }));
  if (!r.ok) throw new Error((d as { error?: string }).error ?? `응답 ${r.status}`);
  return d as T;
}

const STATE_LABEL: Record<AdminRoom['state'], string> = { lobby: '대기실', playing: '게임 중', 'round-over': '판 결과', 'match-over': '게임 결과', paused: '멈춤' };
const ago = (t: number) => {
  const s = Math.max(0, Math.round((Date.now() - t) / 1000));
  return s < 60 ? `${s}초 전` : s < 3600 ? `${Math.round(s / 60)}분 전` : `${Math.round(s / 3600)}시간 전`;
};

export function AdminPage() {
  const [me, setMe] = useState<string | null>(null);
  const [denied, setDenied] = useState<string | null>(null);
  const [rows, setRows] = useState<GameRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const live = useMemo(() => GAMES.filter((g) => g.status === 'live'), []);

  const load = useCallback(async () => {
    const all = await Promise.all(
      live.map(async (g): Promise<GameRow> => {
        try {
          return { id: g.id, state: await api<AdminGameState>(`/games/${g.id}/state`) };
        } catch (e) {
          return { id: g.id, error: e instanceof Error ? e.message : String(e) };
        }
      }),
    );
    setRows(all);
  }, [live]);

  useEffect(() => {
    api<{ email: string }>('/me')
      .then((d) => setMe(d.email))
      .catch((e) => setDenied(e.message));
  }, []);
  useEffect(() => {
    if (!me) return;
    load();
    api<Stats>('/stats').then(setStats, (e) => setStats({ error: e.message }));
    const t = setInterval(() => document.visibilityState === 'visible' && load(), 5000);
    const s = setInterval(() => document.visibilityState === 'visible' && api<Stats>('/stats').then(setStats, () => {}), 60_000);
    return () => {
      clearInterval(t);
      clearInterval(s);
    };
  }, [me, load]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const doAll = async (label: string, fn: (id: string) => Promise<unknown>) => {
    setBusy(label);
    const results = await Promise.allSettled(live.map((g) => fn(g.id)));
    const fail = results.filter((r) => r.status === 'rejected').length;
    setToast(fail ? `${label}: ${live.length - fail}개 게임 완료, ${fail}개 실패` : `${label}: 모든 게임에 반영했어요`);
    setBusy(null);
    load();
  };
  const sendNotice = (text: string | null) => doAll(text ? '공지 보내기' : '공지 지우기', (id) => api(`/games/${id}/notice`, { method: 'POST', body: { text } }));
  const setMaint = (on: boolean) => doAll(on ? '점검 모드 켜기' : '점검 모드 끄기', (id) => api(`/games/${id}/maintenance`, { method: 'POST', body: { on } }));
  const closeRoom = async (id: string, code: string) => {
    if (!confirm(`${gameById(id)?.title ?? id}의 방 ${code}를 닫을까요? 모두 첫 화면으로 나가요`)) return;
    try {
      await api(`/games/${id}/rooms/${code}/close`, { method: 'POST', body: {} });
      setToast(`방 ${code}를 닫았어요`);
    } catch (e) {
      setToast(e instanceof Error ? e.message : String(e));
    }
    load();
  };
  const kick = async (id: string, code: string, memberId: string, name: string) => {
    if (!confirm(`${name} 님을 방 ${code}에서 내보낼까요?`)) return;
    try {
      await api(`/games/${id}/rooms/${code}/kick`, { method: 'POST', body: { memberId } });
      setToast(`${name} 님을 내보냈어요`);
    } catch (e) {
      setToast(e instanceof Error ? e.message : String(e));
    }
    load();
  };

  if (denied)
    return (
      <section className="admin">
        <h1>관리자</h1>
        <p className="panel admin-denied">
          <Icon name="lock" /> {denied}
        </p>
      </section>
    );
  if (!me) return <p className="muted">확인하는 중…</p>;

  const states = rows.filter((r) => r.state).map((r) => r.state!);
  const anyMaint = states.some((s) => s.maintenance);
  const allMaint = states.length > 0 && states.every((s) => s.maintenance);
  const currentNotice = states.find((s) => s.notice)?.notice ?? null;
  const roomCount = states.reduce((a, s) => a + s.rooms.length, 0);
  const people = states.reduce((a, s) => a + s.rooms.reduce((b, r) => b + r.members.filter((m) => !m.bot && m.connected).length, 0), 0);
  const st = stats && !('error' in stats) ? stats : null;
  const maxHour = st ? Math.max(1, ...st.hourly) : 1;

  return (
    <section className="admin">
      <div className="admin-head">
        <h1>관리자</h1>
        <span className="muted small">
          <Icon name="shield" /> {me}
        </span>
      </div>

      <div className="admin-cards">
        <div className="panel admin-card">
          <span className="muted small">지금 열린 방</span>
          <b>{roomCount}</b>
          <span className="small muted">접속 중인 사람 {people}명</span>
        </div>
        <div className="panel admin-card">
          <span className="muted small">24시간 시작한 게임</span>
          <b>{st ? st.started24h : '–'}</b>
          <span className="small muted">끝까지 마침 {st ? st.finished24h : '–'}</span>
        </div>
        <div className="panel admin-card">
          <span className="muted small">게임 평균 시간</span>
          <b>{st?.avgMinutes ? `${st.avgMinutes.toFixed(1)}분` : '–'}</b>
          <span className="small muted">24시간 기준</span>
        </div>
        <div className="panel admin-card admin-spark">
          <span className="muted small">시간대별 시작 (24시간)</span>
          <svg viewBox={`0 0 ${Math.max(1, (st?.hourly.length ?? 1) * 10)} 40`} preserveAspectRatio="none" aria-label="시간대별 시작한 게임">
            {(st?.hourly ?? []).map((v, i) => (
              <rect key={i} x={i * 10 + 1} y={40 - (v / maxHour) * 38} width={8} height={(v / maxHour) * 38} rx={1.5} />
            ))}
          </svg>
        </div>
      </div>
      {stats && 'error' in stats && (
        <p className="small warn">
          <Icon name="warning" /> 통계: {stats.error}
        </p>
      )}
      {st && st.top.length > 0 && (
        <div className="panel admin-top">
          <b className="small">24시간 인기 게임</b>
          <ol>
            {st.top.map((x) => (
              <li key={x.game}>
                {gameById(x.game)?.title ?? x.game} <span className="muted small">시작 {x.started} · 마침 {x.finished}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="admin-controls">
        <div className="panel">
          <h2>
            <Icon name="bell" /> 모든 방에 공지
          </h2>
          {currentNotice && (
            <p className="small">
              지금 공지: <b>{currentNotice}</b>
            </p>
          )}
          <textarea rows={2} maxLength={200} value={notice} onChange={(e) => setNotice(e.target.value)} placeholder="예: 10분 뒤 점검해요. 하던 게임은 마무리해 주세요" />
          <div className="row tight">
            <button className="btn primary" disabled={!notice.trim() || !!busy} onClick={() => sendNotice(notice.trim())}>
              보내기
            </button>
            <button className="btn" disabled={!currentNotice || !!busy} onClick={() => sendNotice(null)}>
              공지 지우기
            </button>
          </div>
        </div>
        <div className="panel">
          <h2>
            <Icon name="wrench" /> 점검 모드
          </h2>
          <p className="small muted">켜면 새 방을 만들 수 없어요. 지금 하던 게임은 끝까지 이어져요.</p>
          <p className="small">지금: {allMaint ? <b className="warn">모든 게임 점검 중</b> : anyMaint ? <b className="warn">일부 게임 점검 중</b> : '꺼짐'}</p>
          <div className="row tight">
            <button className="btn danger-btn" disabled={allMaint || !!busy} onClick={() => setMaint(true)}>
              모두 켜기
            </button>
            <button className="btn" disabled={!anyMaint || !!busy} onClick={() => setMaint(false)}>
              모두 끄기
            </button>
          </div>
        </div>
      </div>

      <h2 className="admin-sub">열린 방</h2>
      {rows.length === 0 && <p className="muted">불러오는 중…</p>}
      <div className="admin-games">
        {[...rows].sort((a, b) => (b.state?.rooms.length ?? -1) - (a.state?.rooms.length ?? -1)).map((r) => {
          const g = gameById(r.id);
          return (
            <div key={r.id} className={`panel admin-game ${r.state?.rooms.length ? 'has' : ''}`}>
              <div className="admin-game-head">
                <svg viewBox="0 0 64 64" width="28" height="28" aria-hidden dangerouslySetInnerHTML={{ __html: g?.icon ?? '' }} />
                <b>{g?.title ?? r.id}</b>
                {r.state ? (
                  <span className="small muted">
                    방 {r.state.rooms.length}/{r.state.maxRooms} · 소켓 {r.state.sockets}
                    {r.state.maintenance && <span className="tag warn"> 점검</span>}
                  </span>
                ) : (
                  <span className="small warn">
                    <Icon name="warning" /> {r.error}
                  </span>
                )}
              </div>
              {r.state?.rooms.map((room) => (
                <div key={room.code} className="admin-room">
                  <div className="admin-room-head">
                    <code>{room.code}</code>
                    <span className="tag">{STATE_LABEL[room.state]}</span>
                    {room.round && <span className="small muted">{room.round}판</span>}
                    {room.hasPassword && <Icon name="lock" title="암호 걸린 방" />}
                    <span className="small muted">활동 {ago(room.lastActive)}</span>
                    <button className="btn tiny danger-btn" onClick={() => closeRoom(r.id, room.code)}>
                      방 닫기
                    </button>
                  </div>
                  <ul className="admin-members">
                    {room.members.map((m) => (
                      <li key={m.id} className={m.connected ? '' : 'off'}>
                        {m.bot ? <Icon name="bot" /> : <span className={`dot ${m.connected ? 'on' : ''}`} />}
                        {m.name}
                        {m.host && <Icon name="crown" title="방장" />}
                        {m.role === 'spectator' && <span className="small muted"> 관전</span>}
                        <button className="btn tiny ghost" onClick={() => kick(r.id, room.code, m.id, m.name)} aria-label={`${m.name} 내보내기`}>
                          <Icon name="x" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          );
        })}
      </div>
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </section>
  );
}
