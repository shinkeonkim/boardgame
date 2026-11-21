import { useState } from 'react';
import { ThemeToggle } from '@bg/ui';
import { useGameClient } from './App';
import { GuideButton } from './Guide';
import { call, store } from './runtime';

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
              <li key={c}>{c}</li>
            ))}
          </ul>
          <GuideButton className="btn guide-cta" label="게임 방법 보기" />
        </section>
        <section className="home-card panel">{children}</section>
      </main>
    </>
  );
}

export function Home({ onEnter, flash }: { onEnter: (code: string) => void; flash: string | null }) {
  const [name, setName] = useState(store.name());
  const [usePw, setUsePw] = useState(false);
  const [password, setPassword] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState<string | null>(flash);
  const [busy, setBusy] = useState(false);

  const create = async () => {
    if (!name.trim()) return setError('닉네임을 입력해 주세요');
    setBusy(true);
    store.setName(name.trim());
    const pw = usePw ? password : '';
    const r = await call<{ code: string; token: string }>('create', { name, password: pw || undefined });
    setBusy(false);
    if (!r.ok) return setError(r.error);
    store.setToken(r.code, r.token);
    store.setPassword(r.code, pw || null);
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
      <label className="field">
        <span>닉네임</span>
        <input value={name} maxLength={16} onChange={(e) => setName(e.target.value)} placeholder="예: 민지" />
      </label>
      <div className="entry-options">
        <div className="entry create">
          <div className="entry-head">
            <span className="entry-icon" aria-hidden>
              👑
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
          <button className="btn primary wide big-btn" disabled={busy} onClick={create}>
            방 만들기
          </button>
        </div>
        <div className="entry-or" aria-hidden>
          <span>또는</span>
        </div>
        <div className="entry join">
          <div className="entry-head">
            <span className="entry-icon" aria-hidden>
              🔑
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
        </div>
      </div>
    </HomeShell>
  );
}
