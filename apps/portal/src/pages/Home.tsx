import { useState } from 'react';
import { TAG_LABELS, searchGames } from '@bg/core';
import { GAMES } from '../catalog';
import { GameCard } from '../GameCard';
import { Link, navigate } from '../router';

const QUICK = [
  { label: '👥 2인', href: '/games?players=2' },
  { label: '👥 3인', href: '/games?players=3' },
  { label: '👥 4인', href: '/games?players=4' },
  { label: '⏱ 20분 이내', href: '/games?time=20' },
  { label: '🤝 팀전', href: '/games?tag=teams' },
  { label: '🃏 카드', href: '/games?tag=card' },
];

export function HomePage() {
  const [q, setQ] = useState('');
  const live = searchGames(GAMES, { sort: 'recommended' });
  const tags = [...new Set(GAMES.flatMap((g) => g.tags))];
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">회원가입 없이 · 설치 없이</p>
          <h1>
            친구들과 각자 휴대폰으로,
            <br />
            <span className="hl">지금 바로 보드게임</span>
          </h1>
          <p className="hero-sub">방을 만들고 QR을 보여 주면 끝. 모두 자기 휴대폰으로 같은 판에 들어와요. 규칙은 방장이 마음대로 바꿀 수 있어요.</p>
          <form
            className="hero-search"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              navigate(`/games${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`);
            }}
          >
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="게임 이름, 카드, 영역 다툼…" aria-label="게임 검색" />
            <button className="btn primary">찾기</button>
          </form>
          <div className="quick-chips">
            {QUICK.map((c) => (
              <Link key={c.href} href={c.href} className="chip">
                {c.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="hero-art" aria-hidden>
          <div className="ha-card c1" />
          <div className="ha-card c2" />
          <div className="ha-card c3" />
          <div className="ha-stone s1" />
          <div className="ha-stone s2" />
          <div className="ha-phone">
            <div className="ha-qr" />
            <span>방 코드 K7QM</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>지금 플레이할 수 있는 게임</h2>
          <Link href="/games" className="muted small">
            전체 보기 →
          </Link>
        </div>
        <div className="game-grid">
          {live.map((g) => (
            <GameCard key={g.id} game={g} />
          ))}
        </div>
      </section>

      <section className="section">
        <h2>이렇게 즐겨요</h2>
        <ol className="steps-row">
          <li>
            <span className="step-n">1</span>
            <b>방 만들기</b>
            <span className="muted small">게임을 고르고 닉네임만 넣으면 방이 생겨요. 암호도 걸 수 있어요.</span>
          </li>
          <li>
            <span className="step-n">2</span>
            <b>QR로 초대</b>
            <span className="muted small">화면의 QR이나 링크를 친구에게. 친구는 열기만 하면 바로 입장.</span>
          </li>
          <li>
            <span className="step-n">3</span>
            <b>각자 폰으로 플레이</b>
            <span className="muted small">내 차례에는 알림이 와요. 끊겨도 다시 열면 그대로 이어져요.</span>
          </li>
        </ol>
      </section>

      <section className="section">
        <h2>분위기로 찾기</h2>
        <div className="tag-cloud">
          {tags.map((t) => (
            <Link key={t} href={`/games?tag=${t}`} className="chip">
              #{TAG_LABELS[t] ?? t}
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
