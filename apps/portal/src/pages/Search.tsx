import { useMemo } from 'react';
import { GameQuery, TAG_LABELS, searchGames } from '@bg/core';
import { SegmentedControl } from '@bg/ui';
import { GAMES } from '../catalog';
import { GameCard } from '../GameCard';
import { navigate } from '../router';

type Sort = NonNullable<GameQuery['sort']>;

/** 필터는 모두 주소(?q=&players=&time=&weight=&tag=&sort=)에 담아 공유·뒤로 가기가 되게 */
export function SearchPage({ search }: { search: string }) {
  const params = new URLSearchParams(search);
  const query: GameQuery = {
    q: params.get('q') ?? '',
    players: Number(params.get('players')) || undefined,
    maxMinutes: Number(params.get('time')) || undefined,
    weight: (params.get('weight') as GameQuery['weight']) || undefined,
    tags: params.getAll('tag'),
    sort: (params.get('sort') as Sort) || 'recommended',
    includeSoon: params.get('soon') === '1',
  };
  const results = useMemo(() => searchGames(GAMES, query, TAG_LABELS), [search]); // eslint-disable-line react-hooks/exhaustive-deps
  const allTags = [...new Set(GAMES.flatMap((g) => g.tags))];

  const update = (patch: Record<string, string | string[] | null>) => {
    const p = new URLSearchParams(search);
    for (const [k, v] of Object.entries(patch)) {
      p.delete(k);
      if (Array.isArray(v)) v.forEach((x) => p.append(k, x));
      else if (v) p.set(k, v);
    }
    const s = p.toString();
    history.replaceState(null, '', `/games${s ? `?${s}` : ''}`);
    navigate(`/games${s ? `?${s}` : ''}`);
  };
  const toggleTag = (t: string) => update({ tag: query.tags!.includes(t) ? query.tags!.filter((x) => x !== t) : [...query.tags!, t] });
  const filtered = !!(query.q || query.players || query.maxMinutes || query.weight || query.tags!.length);

  return (
    <div className="search-page">
      <header className="search-top">
        <h1>게임 찾기</h1>
        <form
          role="search"
          className="hero-search"
          onSubmit={(e) => {
            e.preventDefault();
            update({ q: String(new FormData(e.currentTarget).get('q') ?? '').trim() || null });
          }}
        >
          <input name="q" defaultValue={query.q} key={query.q} placeholder="게임 이름, 메커니즘, 분위기…" aria-label="게임 검색" />
          <button className="btn primary">찾기</button>
        </form>
      </header>
      <div className="search-body">
        <aside className="filters panel" aria-label="필터">
          <div className="f-group">
            <h3>인원</h3>
            <SegmentedControl
              label="인원"
              value={String(query.players ?? '')}
              options={[
                { value: '', label: '전체' },
                { value: '2', label: '2인' },
                { value: '3', label: '3인' },
                { value: '4', label: '4인' },
              ]}
              onChange={(v) => update({ players: v || null })}
            />
          </div>
          <div className="f-group">
            <h3>플레이 시간</h3>
            <SegmentedControl
              label="플레이 시간"
              value={String(query.maxMinutes ?? '')}
              options={[
                { value: '', label: '전체' },
                { value: '20', label: '~20분' },
                { value: '30', label: '~30분' },
                { value: '60', label: '~1시간' },
              ]}
              onChange={(v) => update({ time: v || null })}
            />
          </div>
          <div className="f-group">
            <h3>난이도</h3>
            <SegmentedControl
              label="난이도"
              value={query.weight ?? ''}
              options={[
                { value: '', label: '전체' },
                { value: 'light', label: '가벼움' },
                { value: 'medium', label: '보통' },
                { value: 'heavy', label: '무거움' },
              ]}
              onChange={(v) => update({ weight: v || null })}
            />
          </div>
          <div className="f-group">
            <h3>태그</h3>
            <div className="tag-cloud">
              {allTags.map((t) => (
                <button key={t} className={`chip ${query.tags!.includes(t) ? 'on' : ''}`} aria-pressed={query.tags!.includes(t)} onClick={() => toggleTag(t)}>
                  #{TAG_LABELS[t] ?? t}
                </button>
              ))}
            </div>
          </div>
          {filtered && (
            <button className="btn ghost wide" onClick={() => navigate('/games')}>
              필터 모두 지우기
            </button>
          )}
        </aside>
        <section className="results">
          <div className="results-head">
            <span className="muted small">
              <b>{results.length}</b>개 게임
            </span>
            <label className="small sort">
              정렬{' '}
              <select value={query.sort} onChange={(e) => update({ sort: e.target.value === 'recommended' ? null : e.target.value })}>
                <option value="recommended">추천순</option>
                <option value="new">새로 나온 순</option>
                <option value="short">짧은 게임 순</option>
                <option value="title">이름순</option>
              </select>
            </label>
          </div>
          {results.length ? (
            <div className="game-grid">
              {results.map((g) => (
                <GameCard key={g.id} game={g} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="es-icon">🔍</div>
              <h2>조건에 맞는 게임이 없어요</h2>
              <p className="muted">필터를 조금 풀어 보세요. 새 게임도 계속 추가되고 있어요.</p>
              <button className="btn" onClick={() => navigate('/games')}>
                필터 모두 지우기
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
