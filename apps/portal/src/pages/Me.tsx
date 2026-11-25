import { useMemo, useState } from 'react';
import { Icon } from '@bg/ui';
import { readStats, summarize, type MatchRecord } from '@bg/web';
import { gameById } from '../catalog';
import { Link } from '../router';

/** 이 기기의 전적 (가입 없음 — 각 게임이 매치를 끝낼 때 localStorage 에 남긴 기록을 모아 봄) */
export function MePage() {
  const [list, setList] = useState<MatchRecord[]>(readStats);
  const s = useMemo(() => summarize(list), [list]);
  const name = (() => {
    try {
      return localStorage.getItem('bg:name') ?? '';
    } catch {
      return '';
    }
  })();
  const clear = () => {
    if (!confirm('이 기기의 전적을 모두 지울까요? 되돌릴 수 없어요')) return;
    try {
      localStorage.removeItem('bg:stats');
    } catch {
      /* ignore */
    }
    setList([]);
  };
  if (!list.length)
    return (
      <section className="me-empty">
        <Icon name="trophy" size={44} />
        <h1>아직 기록이 없어요</h1>
        <p className="muted">게임을 끝까지 한 판 하면 여기에 쌓여요. 기록은 이 기기에만 저장돼요.</p>
        <Link href="/games" className="btn primary">
          게임 고르러 가기
        </Link>
      </section>
    );
  const pct = Math.round(s.winRate * 100);
  return (
    <section className="me">
      <header className="me-head">
        <h1>{name ? `${name} 님의 기록` : '내 기록'}</h1>
        <p className="muted small">이 기기에만 저장돼요 · 다른 기기나 브라우저와는 따로예요</p>
      </header>
      <div className="me-cards">
        <div className="me-card">
          <span>한 판</span>
          <b>{s.played}</b>
        </div>
        <div className="me-card">
          <span>이긴 판</span>
          <b>{s.wins}</b>
        </div>
        <div className="me-card">
          <span>승률</span>
          <b>{pct}%</b>
          <i className="me-meter" style={{ ['--p' as string]: `${pct}%` }} aria-hidden />
        </div>
        <div className="me-card">
          <span>지금 연승</span>
          <b>{s.streak}</b>
        </div>
        <div className="me-card">
          <span>사람끼리 한 판</span>
          <b>{s.withFriends}</b>
        </div>
      </div>

      <h2>게임별</h2>
      <ul className="me-games">
        {s.byGame.map((g) => {
          const meta = gameById(g.game);
          const rate = Math.round((g.wins / g.played) * 100);
          return (
            <li key={g.game}>
              <Link href={`/games/${g.game}`} className="me-game">
                {meta && <span className="me-icon" dangerouslySetInnerHTML={{ __html: `<svg viewBox="0 0 64 64" width="32" height="32">${meta.icon}</svg>` }} />}
                <span className="me-game-name">
                  <b>{meta?.subtitle ?? g.title}</b>
                  <small className="muted">
                    {g.played}판 · {g.wins}승 · 승률 {rate}%
                  </small>
                </span>
                <span className="me-bar" aria-hidden>
                  <i style={{ width: `${(g.played / s.byGame[0].played) * 100}%` }} />
                  <i className="won" style={{ width: `${(g.wins / s.byGame[0].played) * 100}%` }} />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <h2>최근 판</h2>
      <ol className="me-recent">
        {list.slice(0, 30).map((r) => (
          <li key={r.key} className={r.won ? 'won' : ''}>
            <span className="me-rank">{r.won ? <Icon name="trophy" /> : `${r.rank}등`}</span>
            <span className="me-recent-name">
              <b>{gameById(r.game)?.subtitle ?? r.title}</b>
              <small className="muted">
                {r.players}명{r.bots ? ` (봇 ${r.bots})` : ''} · {r.lowerWins ? '벌점' : '점수'} {r.score}
              </small>
            </span>
            <time className="muted small" dateTime={new Date(r.at).toISOString()}>
              {new Date(r.at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
            </time>
          </li>
        ))}
      </ol>
      <p className="me-clear">
        <button type="button" className="btn ghost small" onClick={clear}>
          <Icon name="trash" /> 이 기기 기록 지우기
        </button>
      </p>
    </section>
  );
}
