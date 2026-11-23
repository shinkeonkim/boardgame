import { Icon } from '@bg/ui';
import { ORIGINAL_NOTE, TAG_LABELS, originalLabel, botsText } from '@bg/core';
import { GAMES, gameById } from '../catalog';
import { GameArt, GameCard, GameIcon, GameShot, GameStats } from '../GameCard';
import { Link } from '../router';
import { GuideCard } from '../GuideCard';

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
              {g.original && <div className="gd-original">원작 · {originalLabel(g.original)}</div>}
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
                ▶ 시작하기
              </a>
            ) : (
              <button className="btn big-btn" disabled>
                준비 중
              </button>
            )}
            <a className="btn ghost" href="#how-to-play">
              게임 방법 보기
            </a>
          </div>
        </div>
      </header>

      <div className="gd-body">
        <section className="panel">
          <h2>어떤 게임이에요?</h2>
          {g.description.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          <GameShot game={g} />
          <p className="muted small">{g.original ? `원작: ${originalLabel(g.original)}. ${ORIGINAL_NOTE}` : `${g.inspiredBy}에서 영감을 받았어요. 이름·그림·화면은 직접 만들었어요.`}</p>
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
            <h2>
              <Icon name={g.bots === false ? 'users' : 'bot'} /> 봇 · {botsText(g).short}
            </h2>
            <p className="small">{botsText(g).long}</p>
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

      <GuideCard game={g} />

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
