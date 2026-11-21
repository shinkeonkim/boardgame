import { useState } from 'react';
import { TAG_LABELS, searchGames } from '@bg/core';
import { GAMES } from '../catalog';
import { GameCard } from '../GameCard';
import { Link, navigate } from '../router';

const QUICK = [
  { label: '👥 2명', href: '/games?players=2' },
  { label: '👥 3명', href: '/games?players=3' },
  { label: '👥 4명', href: '/games?players=4' },
  { label: '⏱ 20분 안쪽', href: '/games?time=20' },
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
          <p className="eyebrow">가입도 설치도 필요 없어요</p>
          <h1>
            친구들과 각자 폰으로
            <br />
            <span className="hl">같이 하는 보드게임</span>
          </h1>
          <p className="hero-sub">방을 만들고 QR 코드를 보여 주세요. 친구들이 각자 폰으로 들어오면 바로 시작할 수 있어요.</p>
          <form
            className="hero-search"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              navigate(`/games${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`);
            }}
          >
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="게임 이름이나 특징으로 찾아보세요" aria-label="게임 검색" />
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
          <h2>지금 할 수 있는 게임</h2>
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
        <h2>이렇게 시작해요</h2>
        <ol className="steps-row">
          <li>
            <span className="step-n">1</span>
            <b>방 만들기</b>
            <span className="muted small">게임을 고르고 닉네임만 정하면 방이 생겨요. 원하면 암호도 걸 수 있어요.</span>
          </li>
          <li>
            <span className="step-n">2</span>
            <b>QR로 초대하기</b>
            <span className="muted small">QR 코드나 링크를 보내 주세요. 친구는 열기만 하면 들어와요.</span>
          </li>
          <li>
            <span className="step-n">3</span>
            <b>각자 폰으로 하기</b>
            <span className="muted small">내 차례가 되면 알려 줘요. 연결이 끊겨도 다시 열면 이어서 할 수 있어요.</span>
          </li>
        </ol>
      </section>

      <section className="section">
        <h2>특징으로 찾기</h2>
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
