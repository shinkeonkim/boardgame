import { useState } from 'react';
import { Icon } from '@bg/ui';
import type { GameMeta } from '@bg/core';
import { TAG_LABELS } from '@bg/core';
import { minutesText, playersText, weightText } from './catalog';
import { Link } from './router';

/** 게임 그림: 녹화한 표지(/covers/<id>.webp)가 있으면 그것, 없으면 게임 색 + 아이콘 */
export function GameArt({ game, className = '' }: { game: GameMeta; className?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={`game-art ${className}`} style={{ ['--accent-game' as string]: game.accent }}>
      {!failed ? (
        <img src={`/covers/${game.id}.jpg`} alt={`${game.title} 표지`} loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <svg viewBox="0 0 64 64" className="game-art-icon" aria-hidden dangerouslySetInnerHTML={{ __html: game.icon }} />
      )}
    </div>
  );
}

/** 실제 게임 화면 캡처 (봇끼리 두는 장면). 없으면 숨김 */
export function GameShot({ game }: { game: GameMeta }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <figure className="game-shot">
      <img src={`/covers/${game.id}-play.jpg`} alt={`${game.title} 실제 게임 화면`} loading="lazy" onError={() => setFailed(true)} />
      <figcaption className="muted small">실제 게임 화면</figcaption>
    </figure>
  );
}

export function GameIcon({ game, size = 40 }: { game: GameMeta; size?: number }) {
  return <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden dangerouslySetInnerHTML={{ __html: game.icon }} />;
}

export function GameStats({ game }: { game: GameMeta }) {
  return (
    <ul className="game-stats">
      <li title="인원">
          <Icon name="users" /> {playersText(game)}
        </li>
      <li title="걸리는 시간">
          <Icon name="timer" /> {minutesText(game)}
        </li>
      <li title="난이도">
          <Icon name="scale" /> {weightText(game)}
        </li>
    </ul>
  );
}

export function GameCard({ game }: { game: GameMeta }) {
  return (
    <article className="game-card" style={{ ['--accent-game' as string]: game.accent }}>
      <Link href={`/games/${game.id}`} className="gc-link" aria-label={`${game.title} 자세히`}>
        <GameArt game={game} />
      </Link>
      <div className="gc-body">
        <div className="gc-title">
          <GameIcon game={game} size={34} />
          <div>
            <h3>
              <Link href={`/games/${game.id}`}>{game.title}</Link>
            </h3>
            <span className="muted small">{game.subtitle}</span>
            {game.original && (
              <span className="gc-original" title={`${game.original.en} · ${game.original.by}`}>
                원작 {game.original.ko}
              </span>
            )}
          </div>
          {game.status === 'soon' && <span className="tag">준비 중</span>}
        </div>
        <p className="gc-tagline">{game.tagline}</p>
        <GameStats game={game} />
        <div className="gc-tags">
          {game.tags.slice(0, 4).map((t) => (
            <Link key={t} href={`/games?tag=${t}`} className="chip small-chip">
              #{TAG_LABELS[t] ?? t}
            </Link>
          ))}
        </div>
        <div className="gc-actions">
          {game.status === 'live' ? (
            <a className="btn primary" href={`/${game.id}/`}>
              ▶ 시작하기
            </a>
          ) : (
            <button className="btn" disabled>
              준비 중
            </button>
          )}
          <Link className="btn ghost" href={`/games/${game.id}`}>
            자세히 보기
          </Link>
        </div>
      </div>
    </article>
  );
}
