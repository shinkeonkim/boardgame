import { TAG_LABELS } from '@bg/core';
import { GAMES, gameById } from '../catalog';
import { GameArt, GameCard, GameIcon, GameStats } from '../GameCard';
import { Link } from '../router';

export function GamePage({ id }: { id: string }) {
  const g = gameById(id)!;
  const related = GAMES.filter((x) => x.id !== id && x.tags.some((t) => g.tags.includes(t))).slice(0, 3);
  return (
    <article className="game-detail" style={{ ['--accent-game' as string]: g.accent }}>
      <nav className="crumbs small">
        <Link href="/games">게임 찾기</Link> <span className="muted">/</span> {g.title}
      </nav>
      <header className="gd-hero">
        <GameArt game={g} className="gd-art" />
        <div className="gd-info">
          <div className="gd-title">
            <GameIcon game={g} size={52} />
            <div>
              <h1>{g.title}</h1>
              <span className="muted">{g.subtitle}</span>
            </div>
          </div>
          <p className="gd-tagline">{g.tagline}</p>
          <GameStats game={g} />
          <div className="gc-tags">
            {g.tags.map((t) => (
              <Link key={t} href={`/games?tag=${t}`} className="chip small-chip">
                #{TAG_LABELS[t] ?? t}
              </Link>
            ))}
          </div>
          <div className="gd-actions">
            {g.status === 'live' ? (
              <a className="btn primary big-btn" href={`/${g.id}/`}>
                ▶ 방 만들고 플레이
              </a>
            ) : (
              <button className="btn big-btn" disabled>
                준비 중
              </button>
            )}
            <span className="muted small">게임 화면의 “📖 게임 방법”에서 그림과 영상으로 규칙을 볼 수 있어요.</span>
          </div>
        </div>
      </header>

      <div className="gd-body">
        <section className="panel">
          <h2>어떤 게임인가요</h2>
          {g.description.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          <p className="muted small">{g.inspiredBy}에서 영감을 받았고, 이름·그림·화면은 직접 만들었어요.</p>
        </section>
        <div className="gd-side">
          <section className="panel">
            <h2>이런 점이 재밌어요</h2>
            <ul className="check-list">
              {g.highlights.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </section>
          <section className="panel">
            <h2>방장이 바꿀 수 있는 규칙</h2>
            <div className="tag-cloud">
              {g.customizable.map((c) => (
                <span key={c} className="chip small-chip static">
                  {c}
                </span>
              ))}
            </div>
          </section>
        </div>
      </div>

      {related.length > 0 && (
        <section className="section">
          <h2>비슷한 게임</h2>
          <div className="game-grid">
            {related.map((x) => (
              <GameCard key={x.id} game={x} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
