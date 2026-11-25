import { Suspense, lazy, useEffect } from 'react';
import { ThemeToggle, Icon } from '@bg/ui';
import { useInstallPrompt } from '@bg/web';
import { Link, useRoute } from './router';
import { HomePage } from './pages/Home';
import { SearchPage } from './pages/Search';
import { GamePage } from './pages/Game';
import { DesignPage } from './pages/Design';
import { gameById } from './catalog';

// 관리자 화면은 따로 불러옴 (일반 방문자 묶음에 넣지 않음)
const AdminPage = lazy(() => import('./pages/Admin').then((m) => ({ default: m.AdminPage })));

const ORIGIN = 'https://boardgame.shinkeonkim.com';
function upsert(selector: string, make: () => HTMLElement, attr: string, value: string) {
  let el = document.head.querySelector<HTMLElement>(selector);
  if (!el) {
    el = make();
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}
function setHead(path: string, description: string | undefined, noindex: boolean) {
  const url = ORIGIN + (path === '' ? '/' : path.replace(/\/$/, '') || '/');
  upsert('link[rel="canonical"]', () => Object.assign(document.createElement('link'), { rel: 'canonical' }), 'href', url);
  upsert(
    'meta[property="og:url"]',
    () => {
      const m = document.createElement('meta');
      m.setAttribute('property', 'og:url');
      return m;
    },
    'content',
    url,
  );
  upsert('meta[name="robots"]', () => Object.assign(document.createElement('meta'), { name: 'robots' }), 'content', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');
  if (description) upsert('meta[name="description"]', () => Object.assign(document.createElement('meta'), { name: 'description' }), 'content', description);
}

export function App() {
  const { path, search } = useRoute();
  const detail = path.match(/^\/games\/([a-z0-9-]+)\/?$/);
  let page;
  let title = '보드게임 테이블';
  if (path === '/' || path === '') page = <HomePage />;
  else if (path === '/games' || path === '/games/') {
    page = <SearchPage search={search} />;
    title = '게임 찾기 · 보드게임 테이블';
  } else if (detail && gameById(detail[1])) {
    page = <GamePage id={detail[1]} />;
    title = `${gameById(detail[1])!.title} · 보드게임 테이블`;
  } else if (path === '/design' || path === '/design/') {
    page = <DesignPage />;
    title = '디자인 시스템 · 보드게임 테이블';
  } else if (path === '/admin' || path === '/admin/') {
    page = (
      <Suspense fallback={<p className="muted">불러오는 중…</p>}>
        <AdminPage />
      </Suspense>
    );
    title = '관리자 · 보드게임 테이블';
  } else page = <NotFound />;
  // 주소가 바뀌면 head 도 맞춤 (빌드 때 미리 그린 head 는 첫 화면용, 화면 안에서 이동하면 여기서)
  const description = detail && gameById(detail[1]) ? gameById(detail[1])!.tagline : undefined;
  const noindex = path.startsWith('/admin') || path.startsWith('/design');
  useEffect(() => {
    document.title = title;
    setHead(path, description, noindex);
  }, [title, path, description, noindex]);
  return (
    <>
      <Header path={path} />
      <main className="portal-main">{page}</main>
      <Footer />
    </>
  );
}

function Header({ path }: { path: string }) {
  return (
    <header className="portal-header">
      <div className="ph-inner">
        <Link href="/" className="ph-brand" aria-label="보드게임 테이블 홈">
          <img src="/favicon.svg" alt="" width={32} height={32} />
          <span>보드게임 테이블</span>
        </Link>
        <nav className="ph-nav" aria-label="주 메뉴">
          <Link href="/games" className={path.startsWith('/games') ? 'on' : ''}>
            게임 찾기
          </Link>
        </nav>
        <InstallButton />
        <ThemeToggle className="ph-theme" />
      </div>
    </header>
  );
}

/** 브라우저가 설치를 제안할 수 있을 때만 보이는 「앱으로 설치」 */
function InstallButton() {
  const pwa = useInstallPrompt();
  if (!pwa.canInstall) return null;
  return (
    <button type="button" className="btn small ph-install" onClick={pwa.install}>
      <Icon name="phone" /> 앱으로 설치
    </button>
  );
}

function Footer() {
  return (
    <footer className="portal-footer">
      <div className="pf-inner">
        <div>
          <b>보드게임 테이블</b>
          <p className="muted small">친구들과 각자 폰으로 같이 하는 온라인 보드게임이에요. 가입 없이 방을 만들고 QR로 초대해 보세요.</p>
        </div>
        <div className="muted small">
          게임 방식은 고전 보드게임에서 영감을 받았어요. 이름·그림·화면은 모두 직접 만들었어요.
          <br />
          <a href="https://github.com/shinkeonkim/boardgame">GitHub</a> · <Link href="/design">디자인 시스템</Link>
        </div>
      </div>
    </footer>
  );
}

function NotFound() {
  return (
    <section className="empty-state">
      <div className="es-icon">
            <Icon name="compass" size={48} />
          </div>
      <h1>페이지를 찾을 수 없어요</h1>
      <p className="muted">주소가 바뀌었을 수 있어요. 게임 찾기에서 다시 찾아보세요.</p>
      <Link className="btn primary" href="/games">
        게임 찾기
      </Link>
    </section>
  );
}
