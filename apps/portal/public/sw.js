// 보드게임 테이블 서비스 워커 (도메인 전체: 포털 + /<게임>/ 앱).
// 원칙: 화면(HTML)은 늘 네트워크 먼저 → 배포하면 바로 새 화면. 끊겼을 때만 마지막 화면이나 오프라인 안내.
//       해시가 붙은 정적 파일(assets/)·표지·아이콘만 캐시 (내용이 바뀌면 이름이 바뀌므로 안전).
//       소켓·API·관리자 화면은 건드리지 않음.
const VERSION = 'bg-v1';
const STATIC = `${VERSION}-static`;
const PAGES = `${VERSION}-pages`;
const OFFLINE = '/offline.html';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(STATIC).then((c) => c.addAll([OFFLINE, '/favicon.svg', '/icons/icon-192.png'])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const skip = (url) => url.origin !== location.origin || /\/(socket\.io|api)\//.test(url.pathname) || url.pathname.startsWith('/admin') || url.pathname.endsWith('/sw.js');
const isStatic = (url) => /\/assets\/|^\/covers\/|^\/icons\/|^\/og\/|\.(woff2|svg|png|jpg|webp)$/.test(url.pathname);

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (skip(url)) return;
  if (req.mode === 'navigate') {
    // 방 주소(/r/)는 남겨 둘 필요 없음 (금방 사라짐) — 끊겼으면 오프라인 안내
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok && !/\/r\//.test(url.pathname)) {
            const copy = res.clone();
            caches.open(PAGES).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(async () => (await caches.match(req)) ?? (await caches.match(OFFLINE))),
    );
    return;
  }
  if (isStatic(url)) {
    e.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ??
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(STATIC).then((c) => c.put(req, copy));
            }
            return res;
          }),
      ),
    );
  }
});
