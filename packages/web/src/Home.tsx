import { SiteNotice } from './site-notice';
import { useEffect, useState } from 'react';
import type { RoomListing } from '@bg/core';
import { ORIGINAL_NOTE, originalLabel } from '@bg/core';
import { ThemeToggle, Icon, iconize } from '@bg/ui';
import { useGameClient } from './App';
import { GuideButton } from './Guide';
import { BASE, call, store } from './runtime';
import { readRulesParam } from './rules-link';

export function Brand({ small }: { small?: boolean }) {
  const client = useGameClient();
  return (
    <div className={`brand ${small ? 'small' : ''}`}>
      <span className="brand-logo" aria-hidden>
        {client.logo}
      </span>
      <div>
        <h1>{client.title}</h1>
        <p className="muted">{client.subtitle}</p>
        {client.original && !small && (
          <p className="brand-original" title={ORIGINAL_NOTE}>
            원작 · {originalLabel(client.original)}
          </p>
        )}
      </div>
    </div>
  );
}

/** 게임 첫 화면 위쪽 띠: 포털(전체 게임 목록)로 돌아가기 + 테마 전환 */
export function GameNav() {
  return (
    <nav className="game-nav">
      <a className="btn ghost tiny" href="/">
        ← 다른 게임 보기
      </a>
      <ThemeToggle />
    </nav>
  );
}

/** 첫 화면 공통 틀: 왼쪽 소개 + 오른쪽 카드 (좁으면 위아래) */
export function HomeShell({ children }: { children: React.ReactNode }) {
  const client = useGameClient();
  const Demo = client.Demo;
  return (
    <>
      <GameNav />
      <main className="home">
        <section className="home-hero">
          <Brand />
          <p className="home-lead">{client.lead}</p>
          <Demo />
          <ul className="home-chips">
            {client.chips.map((c) => (
              <li key={c}>{iconize(c)}</li>
            ))}
          </ul>
          {/* 봇과 함께 할 수 있는지 늘 같은 자리·같은 말로 */}
          <p className={`bot-note ${client.bots === false ? 'no-bots' : ''}`}>
            <Icon name={client.bots === false ? 'users' : 'bot'} />
            {client.bots === false ? (
              <span>
                <b>사람끼리만</b> · 봇 없이 하는 게임이에요. 방 코드나 링크로 친구를 불러 주세요
              </span>
            ) : (
              <span>
                <b>봇과 함께</b> · 사람이 모자라면 빈자리에 봇을 넣어 연습할 수 있어요
              </span>
            )}
          </p>
          <GuideButton className="btn guide-cta" label="게임 방법 보기" />
        </section>
        <section className="home-card panel">{children}</section>
      </main>
    </>
  );
}

export function Home({ onEnter, flash }: { onEnter: (code: string) => void; flash: string | null }) {
  const client = useGameClient();
  const [name, setName] = useState(store.name());
  const [usePw, setUsePw] = useState(false);
  const [password, setPassword] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState<string | null>(flash);
  const [busy, setBusy] = useState(false);
  // 친구가 보낸 하우스룰 링크(?rules=)로 들어왔으면 그 규칙으로 방을 만듦
  const [rules, setRules] = useState(() => readRulesParam());

  const create = async (practice = false) => {
    if (!name.trim()) return setError('닉네임을 입력해 주세요');
    setBusy(true);
    store.setName(name.trim());
    const pw = usePw ? password : '';
    const r = await call<{ code: string; token: string }>('create', { name, password: pw || undefined, ...(rules ? { config: rules } : {}) });
    setBusy(false);
    if (!r.ok) return setError(r.error);
    store.setToken(r.code, r.token);
    store.setPassword(r.code, pw || null);
    // 연습: 대기실에 들어가면 쉬운 봇을 채우고 바로 시작 (Lobby 가 이 표시를 보고 처리)
    if (practice) sessionStorage.setItem(`bg:practice:${r.code}`, '1');
    onEnter(r.code);
  };

  const join = () => {
    const c = joinCode.trim().toUpperCase();
    if (!/^[A-Z0-9]{4}$/.test(c)) return setError('방 코드 4자리를 입력해 주세요');
    if (name.trim()) store.setName(name.trim());
    onEnter(c);
  };

  return (
    <HomeShell>
      <h2 className="home-card-title">게임 시작하기</h2>
      {error && <div className="alert">{error}</div>}
      {rules && (
        <div className="notice rules-shared" role="status">
          <Icon name="link" />
          <span>
            <b>공유받은 하우스룰</b>로 방을 만들어요. 대기실에서 더 바꿀 수 있어요.
          </span>
          <button type="button" className="btn tiny ghost" onClick={() => setRules(null)}>
            기본 규칙으로
          </button>
        </div>
      )}
      <label className="field">
        <span>닉네임</span>
        <input value={name} maxLength={16} onChange={(e) => setName(e.target.value)} placeholder="예: 민지" />
      </label>
      <div className="entry-options">
        <div className="entry create">
          <div className="entry-head">
            <span className="entry-icon" aria-hidden>
              <Icon name="crown" />
            </span>
            <div>
              <h3>새 방 만들기</h3>
              <p>내가 방장이 되고, QR이나 링크로 친구를 초대해요.</p>
            </div>
          </div>
          <label className="check small">
            <input type="checkbox" checked={usePw} onChange={(e) => setUsePw(e.target.checked)} /> 암호 걸기
          </label>
          {usePw && <input value={password} maxLength={64} onChange={(e) => setPassword(e.target.value)} placeholder="암호" onKeyDown={(e) => e.key === 'Enter' && create()} />}
          <button className="btn primary wide big-btn" disabled={busy} onClick={() => create()}>
            방 만들기
          </button>
          {client.bots !== false && (
            <button className="btn wide practice-btn" disabled={busy} onClick={() => create(true)}>
              <Icon name="bot" /> 봇과 바로 연습하기
            </button>
          )}
        </div>
        <div className="entry-or" aria-hidden>
          <span>또는</span>
        </div>
        <div className="entry join">
          <div className="entry-head">
            <span className="entry-icon" aria-hidden>
              <Icon name="key" />
            </span>
            <div>
              <h3>친구 방에 들어가기</h3>
              <p>친구에게 받은 방 코드 4자리를 입력해 주세요. 링크로 받았다면 열기만 하면 돼요.</p>
            </div>
          </div>
          <div className="row">
            <input
              className="code-input big grow"
              value={joinCode}
              maxLength={4}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              onKeyDown={(e) => e.key === 'Enter' && join()}
              placeholder="ABCD"
              autoCapitalize="characters"
              aria-label="방 코드 4자리"
            />
            <button className="btn join-btn big-btn" onClick={join} disabled={joinCode.length !== 4}>
              들어가기
            </button>
          </div>
          <RoomList onPick={(code) => {
            if (name.trim()) store.setName(name.trim());
            onEnter(code);
          }} />
        </div>
      </div>
    </HomeShell>
  );
}

/** 지금 열려 있는 방 목록 (방장이 「목록에 보이기」를 끈 방은 빠짐). 5초마다 새로 고침 */
function RoomList({ onPick }: { onPick: (code: string) => void }) {
  const [rooms, setRooms] = useState<RoomListing[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [notice, setNotice] = useState<{ text: string | null; maintenance: boolean }>({ text: null, maintenance: false });
  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch(`${BASE}/api/rooms`, { cache: 'no-store' })
        .then((r) => r.json())
        .then((d: { rooms: RoomListing[]; notice?: string | null; maintenance?: boolean }) => {
          if (!alive) return;
          setRooms(d.rooms);
          setNotice({ text: d.notice ?? null, maintenance: !!d.maintenance });
          setFailed(false);
        })
        .catch(() => alive && setFailed(true));
    load();
    const t = setInterval(() => document.visibilityState === 'visible' && load(), 5000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);
  if (failed && !rooms) return null;
  return (
    <div className="room-list">
      <SiteNotice text={notice.text} maintenance={notice.maintenance} />
      <div className="room-list-head">
        <span>지금 열린 방</span>
        <span className="muted small">{rooms ? `${rooms.length}개` : '불러오는 중…'}</span>
      </div>
      {rooms && rooms.length === 0 && <p className="muted small room-list-empty">아직 열린 방이 없어요. 새 방을 만들어 친구를 불러 보세요.</p>}
      {rooms && rooms.length > 0 && (
        <ul>
          {rooms.map((r) => (
            <li key={r.code}>
              <button className={`room-row ${r.open ? 'open' : ''}`} onClick={() => onPick(r.code)}>
                <span className="code">{r.code}</span>
                <span className="grow room-row-main">
                  <span className="room-row-host">
                    {r.host} 님의 방 {r.hasPassword && <Icon name="lock" title="암호 걸린 방" />}
                  </span>
                  <span className="muted small">
                    {r.state === 'playing' ? `게임 중 · ${r.round}/${r.rounds}판` : r.state === 'paused' ? '잠깐 멈춤' : '대기실'} · 플레이어 {r.players}/{r.maxPlayers}명
                    {r.bots > 0 ? ` (봇 ${r.bots})` : ''}
                    {r.spectators > 0 ? ` · 관전 ${r.spectators}` : ''}
                  </span>
                </span>
                <span className={`tag ${r.open ? 'ready' : ''}`}>{r.open ? '들어가기' : '관전하기'}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
