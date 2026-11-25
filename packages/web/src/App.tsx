import { SiteNotice } from './site-notice';
import { useRelocate } from './switch-game';
import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerServiceWorker } from './pwa';
import { recordOutcome } from './stats';
import { DRAIN_MESSAGE, type EmoteEvent, type RoomView } from '@bg/core';
import { EmotesContext, Icon, NoticeSlot, applySkin, applyTheme, getTheme } from '@bg/ui';
import type { GameClient } from './client';
import { BASE, call, setGameId, socket, store } from './runtime';
import { Home, HomeShell } from './Home';
import { Lobby } from './Lobby';

const ClientContext = createContext<GameClient | null>(null);
/** 지금 게임의 클라이언트 정의 (첫 화면·로비·모달이 씀) */
export function useGameClient<V = unknown, C = unknown>(): GameClient<V, C> {
  return useContext(ClientContext) as GameClient<V, C>;
}

/** 표지(1280×720): 왼쪽 아래 제목, 오른쪽 크게 게임 도구 (client.Cover) */
function CoverFrame({ client }: { client: GameClient<any, any> }) {
  const Cover = client.Cover!;
  return (
    <div className="cover-frame" data-game={client.id} style={{ ['--cover-accent' as string]: client.accent ?? '#c0612a' }}>
      <div className="cover-pieces">
        <Cover />
      </div>
      <div className="cover-title">
        <span className="cover-logo">{client.logo}</span>
        <div>
          <h1>{client.title}</h1>
          <p>{client.subtitle.split(' · ')[0]}</p>
          {client.original && <span className="cover-original">원작 · {client.original.ko}</span>}
        </div>
      </div>
    </div>
  );
}

/** 게임 웹 앱을 #root에 띄운다 */
export function mountGame(client: GameClient<any, any>) {
  setGameId(client.id);
  applyTheme(getTheme());
  applySkin();
  // 빌드 때 넣은 검색용 제목(「요트 다이스 온라인 · …」)이 있으면 그대로 둠
  if (!document.title) document.title = client.title;
  registerServiceWorker();
  createRoot(document.getElementById('root')!).render(
    <ClientContext.Provider value={client}>
      <EmotesContext.Provider value={client.emotes}>
        {client.Globals && <client.Globals />}
        {/* ?cover: 포털 표지(키 아트) 촬영용 화면 — 실제 카드·칩을 크게 배치 */}
        {client.Cover && new URLSearchParams(location.search).has('cover') ? <CoverFrame client={client} /> : <App />}
      </EmotesContext.Provider>
    </ClientContext.Provider>,
  );
}

/** BASE(/<게임id>) 안의 경로만 다룬다: / → 첫 화면, /r/CODE → 방 */
function useLocation() {
  const local = () => location.pathname.slice(BASE.length) || '/';
  const [path, setPath] = useState(local);
  useEffect(() => {
    const on = () => setPath(local());
    window.addEventListener('popstate', on);
    return () => window.removeEventListener('popstate', on);
  }, []);
  const navigate = useCallback((to: string) => {
    history.pushState(null, '', `${BASE}${to}`);
    setPath(to);
  }, []);
  return { path, navigate };
}

function App() {
  const { path, navigate } = useLocation();
  const [flash, setFlash] = useState<string | null>(null);
  const m = path.match(/^\/r\/([A-Za-z0-9]{4})\/?$/);
  const code = m ? m[1].toUpperCase() : null;
  const goHome = useCallback(
    (msg?: string) => {
      setFlash(msg ?? null);
      navigate('/');
    },
    [navigate],
  );
  return code ? <RoomPage key={code} code={code} onExit={goHome} /> : <Home flash={flash} onEnter={(c) => navigate(`/r/${c}`)} />;
}

type Phase = { kind: 'connecting' } | { kind: 'form'; hasPassword: boolean; inGame: boolean } | { kind: 'in' };

function RoomPage({ code, onExit }: { code: string; onExit: (msg?: string) => void }) {
  const client = useGameClient();
  const [phase, setPhase] = useState<Phase>({ kind: 'connecting' });
  const [view, setView] = useState<RoomView | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [connected, setConnected] = useState(socket.connected);
  const [emotes, setEmotes] = useState<EmoteEvent[]>([]);
  // 방장이 다른 게임으로 옮기면 모두 그 방으로
  const relocating = useRelocate(view);

  useEffect(() => {
    const up = () => setConnected(true);
    const down = () => setConnected(false);
    socket.on('connect', up);
    socket.on('disconnect', down);
    return () => {
      socket.off('connect', up);
      socket.off('disconnect', down);
    };
  }, []);

  const hashPw = new URLSearchParams(location.hash.slice(1)).get('pw') ?? '';

  const enter = useCallback(
    async (opts: { name: string; password?: string; spectator?: boolean }) => {
      const r = await call<{ code: string; token: string }>('join', { code, token: store.token(code) ?? undefined, ...opts });
      if (!r.ok) return r.error;
      store.setToken(code, r.token);
      if (opts.password) store.setPassword(code, opts.password);
      if (location.hash) history.replaceState(null, '', location.pathname); // 암호를 주소창에서 지움
      setPhase({ kind: 'in' });
      return null;
    },
    [code],
  );

  // 최초 진입: 토큰이 있으면 바로 재접속, 아니면 입장 폼
  useEffect(() => {
    let cancelled = false;
    // 옮겨 온 표시는 읽고 바로 주소에서 지움
    const auto = new URLSearchParams(location.search).get('auto') === '1';
    if (auto) history.replaceState(null, '', location.pathname);
    (async () => {
      if (store.token(code)) {
        const err = await enter({ name: store.name() });
        if (!err || cancelled) return;
        store.setToken(code, null);
      }
      const p = await call<{ hasPassword: boolean; inGame: boolean }>('peek', { code });
      if (cancelled) return;
      if (!p.ok) return onExit(p.error);
      // 다른 게임에서 옮겨 온 경우(?auto=1): 저장된 닉네임으로 바로 입장
      if (auto && store.name() && !p.hasPassword && !(await enter({ name: store.name() }))) return;
      setPhase({ kind: 'form', hasPassword: p.hasPassword, inGame: p.inGame });
    })();
    return () => {
      cancelled = true;
    };
  }, [code, enter, onExit]);

  // 서버 이벤트
  useEffect(() => {
    const onRoom = (v: RoomView) => {
      setView(v);
      // 매치가 끝나면 이 기기 전적에 한 줄 (포털 「내 기록」)
      const seat = v.members.find((m) => m.id === v.you)?.seat ?? -1;
      recordOutcome(client.id, client.title, v.code, seat, v.outcome);
    };
    const onKicked = (reason?: string) => {
      store.setToken(code, null);
      onExit(typeof reason === 'string' ? reason : '방에서 나왔어요');
    };
    const onErr = (m: string) => setToast(m);
    // 연결이 끊겼다가 다시 붙으면(무중단 배포로 새 서버로 옮겨졌을 때 포함) 토큰으로 같은 방에 재입장
    let wasDown = false;
    const onDown = () => {
      wasDown = true;
    };
    const onReconnect = async () => {
      if (!wasDown || !store.token(code)) return;
      wasDown = false;
      let err: string | null = null;
      // 새 서버가 방을 막 넘겨받는 중일 수 있어 몇 번 다시 시도
      for (let i = 0; i < 10; i++) {
        err = await enter({ name: store.name() });
        if (!err || !(err === DRAIN_MESSAGE || /찾을 수 없|연결이 잠깐/.test(err))) break;
        await new Promise((r) => setTimeout(r, 1000));
      }
      // 서버 재시작 등으로 방이 사라졌으면 멈춘 화면에 남지 말고 처음으로
      if (err) {
        store.setToken(code, null);
        onExit(`${err} 방이 닫혔을 수 있어요. 새 방을 만들어 주세요`);
      }
    };
    const onEmote = (e: EmoteEvent) => {
      // 같은 사람의 이전 말풍선은 새 것으로 교체, 3초 뒤 사라짐
      setEmotes((list) => [...list.filter((x) => x.from !== e.from), e]);
      setTimeout(() => setEmotes((list) => list.filter((x) => x.n !== e.n)), 3000);
    };
    socket.on('emote', onEmote);
    socket.on('room', onRoom);
    socket.on('kicked', onKicked);
    socket.on('error-message', onErr);
    socket.on('disconnect', onDown);
    socket.on('connect', onReconnect);
    return () => {
      socket.off('emote', onEmote);
      socket.off('room', onRoom);
      socket.off('kicked', onKicked);
      socket.off('error-message', onErr);
      socket.off('disconnect', onDown);
      socket.off('connect', onReconnect);
    };
  }, [code, enter, onExit]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const act = useCallback(async (event: string, payload: object = {}) => {
    const r = await call(event, payload);
    if (!r.ok) setToast(r.error);
    return r.ok;
  }, []);

  const leave = async () => {
    const r = await call('leave');
    if (!r.ok) return setToast(r.error);
    store.setToken(code, null);
    onExit();
  };

  if (phase.kind === 'connecting') return <main className="page narrow center muted">들어가는 중…</main>;
  if (phase.kind === 'form') return <JoinForm code={code} phase={phase} defaultPw={hashPw} onSubmit={enter} onCancel={() => onExit()} />;
  if (!view) return <main className="page narrow center muted">불러오는 중…</main>;

  const Game = client.Game;
  return (
    <>
      {view.game ? (
        <Game view={view} act={act} onLeave={leave} notify={setToast} emotes={emotes} onEmote={(id) => act('emote', { id })} />
      ) : (
        <Lobby view={view} act={act} onLeave={leave} emotes={emotes} onEmote={(id) => act('emote', { id })} />
      )}
      {toast && (
        // 게임 중에는 차례 띠(알림 영역) 위에 — 손패·판을 가리지 않게
        <NoticeSlot deps={toast}>
          <div className="toast" role="status">
            {toast}
          </div>
        </NoticeSlot>
      )}
      {!connected && <div className="offline">연결이 끊겼어요. 다시 연결하는 중이에요…</div>}
      <SiteNotice text={view.notice} maintenance={view.maintenance} />
      {relocating && (
        <div className="overlay" role="alertdialog" aria-label="게임 바꾸는 중">
          <div className="panel sheet center">
            <h2>
              <Icon name="swap" /> {relocating.title}(으)로 옮겨요
            </h2>
            <p className="muted small">방장이 게임을 바꿨어요. 새 방으로 함께 이동하는 중…</p>
          </div>
        </div>
      )}
    </>
  );
}

function JoinForm({
  code,
  phase,
  defaultPw,
  onSubmit,
  onCancel,
}: {
  code: string;
  phase: { hasPassword: boolean; inGame: boolean };
  defaultPw: string;
  onSubmit: (o: { name: string; password?: string; spectator?: boolean }) => Promise<string | null>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(store.name());
  const [password, setPassword] = useState(defaultPw);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (spectator = false) => {
    if (!name.trim()) return setError('닉네임을 입력해 주세요');
    store.setName(name.trim());
    setBusy(true);
    const err = await onSubmit({ name, password: password || undefined, spectator });
    setBusy(false);
    if (err) setError(err);
  };

  return (
    <HomeShell>
      <h2 className="home-card-title">
        방 <span className="code">{code}</span>에 초대받았어요
      </h2>
      {phase.inGame && <p className="muted small">게임이 이미 시작돼서 관전으로 들어가요.</p>}
      {error && <div className="alert">{error}</div>}
      <label className="field">
        <span>닉네임</span>
        <input value={name} maxLength={16} onChange={(e) => setName(e.target.value)} autoFocus onKeyDown={(e) => e.key === 'Enter' && submit()} />
      </label>
      {phase.hasPassword && (
        <label className="field">
          <span>방 암호</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} />
        </label>
      )}
      <div className="row">
        <button className="btn primary grow big-btn" disabled={busy} onClick={() => submit()}>
          들어가기
        </button>
        {!phase.inGame && (
          <button className="btn" disabled={busy} onClick={() => submit(true)}>
            관전하기
          </button>
        )}
      </div>
      <button className="btn ghost wide" onClick={onCancel}>
        첫 화면으로
      </button>
    </HomeShell>
  );
}

/** 표지용 부채꼴: 아이들을 가운데를 기준으로 기울여 펼친다 */
export function CoverFan({ children, spread = 8 }: { children: ReactNode[]; spread?: number }) {
  const mid = (children.length - 1) / 2;
  return (
    <div className="cover-fan">
      {children.map((ch, i) => (
        <span key={i} style={{ ['--i' as string]: i, ['--mid' as string]: mid, ['--d' as string]: Math.abs(i - mid) ** 1.6, transform: `rotate(${(i - mid) * spread}deg) translateY(${Math.abs(i - mid) ** 1.6 * 6}px)`, display: 'inline-block', transformOrigin: '50% 120%', marginLeft: i ? -18 : 0 }}>
          {ch}
        </span>
      ))}
    </div>
  );
}
