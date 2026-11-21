---
name: new-boardgame
description: 보드게임 플랫폼(boardgame 모노레포)에 새 게임을 추가하거나 기존 게임·공통 플랫폼(방 서버·디자인 시스템·포털·배포)을 고칠 때 따르는 절차와 노하우. "보드게임 추가", "새 게임 만들기", "○○ 보드게임을 온라인으로", "게임 규칙 조사", "3~4인 확장", "디자인 시스템", "포털", "무중단 배포", "시연 GIF" 같은 요청이면 먼저 읽는다.
---

# 새 보드게임 추가 · 플랫폼 작업 가이드

이 저장소는 **여러 온라인 보드게임을 한 도메인(boardgame.shinkeonkim.com)에서 서비스하는 모노레포**다.
멀티플레이 공통 부분(방·암호·관전·재접속·방장·타이머·중지/이어하기·무중단 배포·감정 표현·로비·첫 화면·게임 방법 모달)은
플랫폼이 이미 갖고 있고, **새 게임은 규칙(엔진)과 게임 화면만** 만든다.
Expedition Lines(로스트 시티 메커니즘)와 Crown March(장미전쟁 메커니즘)를 만들며 겪은 문제와 해법을 아래에 녹였다.

## 0. 먼저 알아 둘 구조

```
packages/
  core/     GameModule 계약 · RoomView 타입 · 공통 감정 표현 · GameMeta(포털 카탈로그) · searchGames
  server/   Rooms(게임 무관 방 관리) · createGameServer(정적+Socket.IO+handoff) · serveStatic
  ui/       디자인 시스템: tokens.css(라이트/다크) · 공용 컴포넌트 · 게임 컴포넌트(TurnBanner, AlertBanner …)
  web/      게임 웹 키트: mountGame(GameClient) → 첫 화면·초대 입장·로비·재접속·게임 방법 모달 틀
games/<id>/
  engine/   순수 규칙 (config.ts · game.ts · view.ts · module.ts · *.test.ts)
  server/   src/main.ts 4줄: createGameServer({ game, extraEmotes })
  web/      GameClient 슬롯: ConfigPanel · Game · Demo · guide · client.tsx · game.css
  meta.ts   포털 카탈로그 정보 (자동 수집)
  deploy/   kustomize (게임마다 따로 배포)
apps/portal/  홈 · 게임 찾기 · 상세 · /design(디자인 시스템 진열장) · deploy/
scripts/  local.mjs(운영과 같은 경로 게이트웨이) · bundle.mjs(이미지 묶음) · typecheck.mjs · media/
```

- URL: 포털 `/`, 게임 `/<id>/`(방은 `/<id>/r/CODE`), 소켓 `/<id>/socket.io`. Traefik이 경로로 나누므로 **게임을 늘려도 Cloudflare는 건드리지 않는다.**
- localStorage는 같은 도메인을 공유한다 → 키는 `bg:<id>:…`(토큰·암호), 공유값은 `bg:name`·`bg:mute`·`bg:theme`.
- 명령: `npm test` · `npm run typecheck` · `npm run build && npm run local`(→ http://localhost:8080) · `npm run media`.

## 0-1. 문구는 docs/ux-writing.md를 따른다

화면 문구·오류·게임 방법·감정 표현을 쓰기 전에 **`docs/ux-writing.md`**를 읽는다(토스 8가지 라이팅 원칙 + 에러 메시지 6원칙 기반).
- 제품이 하는 말은 해요체, 버튼은 "무엇을 하는지" 동사형(시작하기·들어가기·관전하기), 오류는 상황 → 이유 → 할 일.
- 용어표를 지킨다: 방·방장·대기실·차례·판·명·넘기기·관전 (로비·턴·인·패스 ✕).
- 엔진의 `MoveError`·`validateConfig` 문장도 사용자에게 그대로 뜨므로 같은 규칙으로 쓴다. 테스트 정규식은 바뀐 문장에 맞춘다.
- 감정 표현은 "친구에게 실제로 하는 말"(반말 허용, 6글자 안팎, 이모지 끝에 하나). 게임 전용은 그 게임의 순간에 맞게 2~3개만.

## 1. 규칙 조사 (docs/games/<id>/01-rules.md)

1. 사용자가 준 링크(나무위키·보드엠 등)를 web-fetch로 **세부 규칙 위주로** 읽게 한다: 구성물 수량, 준비, 차례 행동, 금지 조건, 덱 소진·재섞기, 종료 조건, 점수, 동점, 변형.
2. 페이지에 없는 항목은 "확인 필요"로 표시하고 널리 알려진 원작 규칙으로 채운다. 위키 산수 오류도 있었다(장미전쟁 점수 예시) — 숫자는 직접 검산.
3. 온라인에 맞게 **해석을 명시**: 예) 카드 방향은 보드 기준 절대 방향(물리적 좌석 방향 대신).
4. **이름·그림·문장은 자체 제작.** 메커니즘만 빌린다. 원작 이름·캐릭터·아트·로고를 쓰지 않는다. 포털 상세에는 "○○ 메커니즘에서 영감"만 적는다.

## 2. 커스텀·인원 확장 설계 (docs/games/<id>/02-custom.md)

- 모든 원작 수치는 `GameConfig` 필드 + `LIMITS` + `CLASSIC`(원작) + `PRESETS`(2인 원작 / 3인 / 4인 / 팀전 / 빠른 게임 …)로.
- **3~4인 확장 패턴**
  - 자원 부족: 같은 세트를 `deckCopies/cardCopies` 벌 섞기, 보드 키우기, 공용 자원 늘리기(원작 비율 유지 → 로비에 "추천값으로 맞추기" 버튼).
  - 검증: 시작 불가 조건을 `validateConfig`로 문장화 (예: 카드 ≥ 인원 × (손패 + 2), 돌 ≤ 빈 칸, 거리 < 보드). 4인에 원작 덱이면 손패만으로 덱이 바닥나는 식의 함정을 막는다.
  - 2인 전용 상호작용(뒤집기·버림 줍기)은 "아무 상대"로 일반화하고, 종료 조건은 "모두 연속 패스" 같은 인원 무관 형태로.
  - 2:2 팀전: 좌석 0·2 vs 1·3. 같은 팀끼리 공격 금지·점수 합산(영역 게임은 같은 팀 돌을 한 영역으로).
- 판 수(`rounds`, 기본 1), 턴 제한시간(`turnTimerSec`, 0=없음)은 모든 게임에 넣는다 — 플랫폼이 쓴다.

## 3. 엔진 (games/<id>/engine)

- `game.ts`는 **순수 함수 + JSON 직렬화 가능한 상태**. 클래스 인스턴스·Map·함수·Date를 상태에 넣지 않는다 (무중단 배포 때 JSON으로 다음 파드에 넘어간다).
- 난수는 `rng` 인자 또는 상태에 저장한 시드(mulberry32)로만. 규칙 위반은 `class MoveError extends RuleError`로 던진다 (메시지가 그대로 사용자에게 뜬다 → 친절한 한국어로).
- "왜 안 되는지"를 돌려주는 함수(`playBlockReason`, `playOutcome`)를 따로 둔다 → 화면이 안내 문구로 쓴다.
- `view.ts`: 플레이어별로 숨길 정보를 지운 뷰 + 지금 할 수 있는 것(`can`)을 미리 계산해 준다.
- `module.ts`: `GameModule` 어댑터 (`status`, `turn`, `round`(1부터!), `totals`, `continueMatch`, `autoMove`…) + `EXTRA_EMOTES`.
- 테스트: 원작 구성 수치, 각 금지 조건, 점수 예시(손으로 검산한 값), 종료·다음 판, 숨김 뷰, 그리고 **퍼즈 테스트**(프리셋 전부 × 시드 15개, 불법 수 섞어 끝까지 진행하며 매 수마다 불변식: 카드/돌 총량 보존·중복 없음·손패 상한·종료 보장).
- `autoMove`는 항상 합법이어야 한다(시간 초과·대신 진행에 쓰임) — 퍼즈에서 같이 검증.

## 4. 서버 (games/<id>/server)

`createGameServer({ game, extraEmotes })` 4줄이면 끝. 플랫폼이 이미 처리하는 것(다시 만들지 말 것):
방 코드·QR용 `PUBLIC_URL`·암호(scrypt, 방 단위 5분 10회)·토큰 재접속·관전·방장 승계/강퇴/순서·설정·시작(결과 보는 사람 기다리기/force)·다음 판(중복 요청 무시)·각자 로비 복귀·중지/이어하기·턴 타이머(남은 ms로 전송)·끊긴 차례 20초 뒤 대신 진행·감정 표현(허용 목록·도배 방지)·방 최대 개수/1시간 유휴 정리·`/healthz` `/readyz` `/api/info`·무중단 배포 handoff.
새 게임 때문에 플랫폼을 고쳐야 하면 `packages/server/src/rooms.test.ts`(Crown March)·`rooms.expedition.test.ts`(Expedition Lines) 둘 다 통과시킨다.

## 5. 웹 (games/<id>/web)

`client.tsx`에서 `GameClient`를 채우고 `main.tsx`에서 `mountGame(client)`. 슬롯:
`logo · lead · chips · Demo(첫 화면 시연 애니메이션) · ConfigPanel · Game · seatBadge/seatLabel · teamsEnabled · Globals(SVG defs 등) · guide(sections)`.

**ConfigPanel**: `configFields({config,set,isHost,limits})`의 `f.num`/`f.bool` + `<PresetChips>` + 게임 미리보기(보드 크기·색 띠).

**Game 화면 원칙 (실제로 사용자 피드백을 받아 고친 것들)**
- 상단 `TurnBanner`: 누구 차례인지 + 지금 할 일 + 단계(`TurnSteps`) + `TurnTimer` + 끊긴 사람 "대신 진행". 내 차례는 강조색.
- 안 되는 행동을 하면 조용히 무시하지 말고 **이유 토스트 + 배너 흔들기**("지금은 ○○ 님의 차례예요", "먼저 카드를 1장 가져오세요", "방금 버린 카드는 바로 못 가져와요"…).
- 차례 전환: `TurnSplash`(내 차례 크게) + `sound.play('myTurn')` + 진동 + 다른 탭이면 탭 제목 알림.
- 판이 곧 끝나면 `AlertBanner`(남은 돌/남은 덱, 인원 수 이하면 critical)를 **패널 맨 위에 눈에 띄게.**
- 레이아웃은 **기기 화면에 고정**(`.page.game` 100dvh, 페이지 스크롤 0). 보드는 컨테이너 쿼리(`width: min(100cqw, 100cqh)`)로 남은 공간 최대, 정보 패널·보드 목록만 따로 스크롤. 좁거나 세로 화면은 아래로 쌓고 **내 손패를 보드 바로 아래**에. 가로로 눕힌 휴대폰(높이 ≤520)은 배너 힌트 숨기기.
- 조작은 **클릭 2번(고르기→실행)과 끌어다 놓기 둘 다**. 고르면 결과를 미리 보여 준다(경로·도착 칸·막힌 이유).
- 감정 표현 말풍선은 이름 **옆**(위로 띄우면 차례 배너를 가림). 버튼은 덱/패널 근처.
- 진행 문구(ticker)와 보드 사이 여백, 결과 화면은 점수 풀이("5² + 3² + …")까지.
- 테마: 게임 전용 색은 게임 CSS에 토큰으로(`:root` + `[data-theme='dark']` + 시스템 다크 미디어쿼리 3곳). 다크에서 안 보이는 요소(막힌 칸 등)는 두 테마 모두 같은 강한 색으로.

**게임 방법**(`guide.tsx` + `guide-entry.tsx`): 같은 내용이 **게임 안 모달**과 **포털 게임 상세 페이지(카드 안에 펼침)** 두 곳에 나온다.
`guide-entry.tsx`는 `import './game.css'; export { guide } from './guide';`(+ 카드 SVG defs 같은 `Globals`)만 — 포털이 이것만 필요할 때 불러온다(소켓 없음).
그래서 guide.tsx는 `@bg/web/guide-kit`(Clip·GuideSection)만 import하고 `@bg/web` 본체(소켓)를 import하지 않는다.
구성: 8~10개 섹션(목표·구성·차례·특수 규칙·금지·점수·끝·3~4인·설정·화면 사용법). 그림은 **실제 게임 컴포넌트로** 작게 그리고(카드·돌·보드), 점수 예시는 엔진 함수로 계산해 틀릴 수 없게. 짧은 영상은 `<Clip src="guide/move.mp4">` (파일은 `web/public/guide/`, `npm run media`가 만든다).

**meta.ts**: 포털 카드·검색·상세에 쓰인다 (players, minutes, weight, tags, accent, icon SVG, highlights, customizable). 태그는 `TAG_LABELS`에 있는 것을 우선 쓰고 새 태그면 거기에 한국어 이름을 추가.

## 6. 디자인 시스템 규칙 (packages/ui, 문서: packages/ui/README.md, 진열장: /design)

- 색·간격·반경은 토큰만 쓴다(`--bg --panel --ink --muted --line --accent --gold --info --ok --danger`, `--sp-*`, `--r-*`). 하드코딩한 색은 게임 고유 그림(카드 무늬 등)에만.
- 테마는 `<html data-theme>` + `bg:theme`. 게임·포털 모두 `ThemeToggle`(포털·첫 화면은 세 가지 segmented, 게임 상단 바는 icon).
- **게임에 새 UI가 필요하면**: 한 게임 전용이면 그 게임 폴더에, 두 번째 게임도 쓸 만하면 `packages/ui`로 올리고(`game.tsx`/`components.tsx` + CSS) `/design`에 예시를 추가한다. (`TurnSteps`, `AlertBanner`가 이렇게 올라왔다.)
- 모달은 `Modal`, 두 번 눌러 확인은 `ConfirmButton`, 설정 줄은 `Stepper`/`Toggle`, 고르기는 `SegmentedControl`.

## 7. 배포 (서브 프로젝트마다 따로)

1. `games/<id>/deploy/`를 기존 게임에서 복사해 이름만 바꾼다 (Namespace `boardgame-<id>`, Ingress path `/<id>`, handoff Service, `/readyz` 1초 프로브, RollingUpdate maxSurge 1 / maxUnavailable 0).
2. `.github/workflows/release-<id>.yml` 복사 (paths: 자기 폴더 + packages/** + Dockerfile …, `!deploy/**`). 이미지는 `ghcr.io/shinkeonkim/boardgame-<id>`. 첫 빌드 후 GitHub Packages에서 **Public**인지 확인(풀 시크릿 없음 — 익명 매니페스트 조회 200이면 OK).
3. oh-my-homelab에 PR (사람이 merge, main 직접 push·kubectl apply 금지):
   - `helm-charts/apps/boardgame-<id>.yaml` (sources: 이 레포 `games/<id>/deploy` + `helm-charts/network-policies/boardgame-<id>`)
   - `helm-charts/network-policies/boardgame-<id>/networkpolicy.yaml`: ingress는 traefik 네임스페이스에서 8080, **같은 네임스페이스 파드끼리 9090(handoff)**, egress는 DNS + 같은 네임스페이스 9090.
4. merge 후 ArgoCD 루트 앱이 늦으면 `kubectl -n argocd annotate application root argocd.argoproj.io/refresh=normal --overwrite`(이미 커밋된 상태 재동기화만 허용).
5. 확인: `curl https://boardgame.shinkeonkim.com/<id>/readyz`, 포털 목록에 나타나는지, 실제 브라우저로 한 판.
- 이 세션 환경에서는 main push가 자동 모드 분류기에 막힐 수 있다 → 사용자에게 `! git push` 를 부탁한다.

## 7-1. 모니터링 (docs/monitoring.md)

- 공통 지표(방·사람·게임 시작/완료·수·입장 실패·감정 표현·무중단 배포·프로세스)는 플랫폼이 이미 낸다 — 새 게임은 아무것도 안 해도 Grafana「보드게임 테이블」 대시보드의 `game` 변수에 나타난다.
- 새 게임 deploy/에 `servicemonitor.yaml`(포트 `metrics` 9464)을 복사하고, oh-my-homelab 네트워크 정책에 `monitoring` 네임스페이스 → 9464 허용을 넣는다.
- 게임만의 지표가 필요하면(예: 기사 사용 수) 게임 서버 쪽에서 `metrics.counter`를 더하고 dashboard.mjs에 패널을 추가한다.

## 8. QA 체크리스트 (자동화 스크립트로 반복)

- `npm test`(엔진·퍼즈·방 흐름) · `npm run typecheck` · `npm run build`.
- `npm run local` + 헤드리스 Chrome + 봇(Socket.IO 클라이언트, `path: '/<id>/socket.io'`)으로 **한 판을 끝까지**: 첫 화면 → 방 만들기 → 봇 입장 → 프리셋 → 시작 → 클릭/드래그 → 특수 행동 → 경고 → 결과 → 로비 복귀.
- 크기: 1440×900, 1024×768, 768×1024, 390×844, 360×640, 844×390 각각 `scrollWidth - innerWidth == 0`, 페이지 세로 스크롤 0(게임 화면).
- **`isMobile: true` 에뮬레이션으로도** 확인 — 로비가 몇 px만 넘쳐도 휴대폰이 화면을 축소해 이후 게임 화면까지 잘린다(실제 겪음).
- 라이트/다크/시스템 세 가지로 포털·첫 화면·로비·게임 캡처.
- 무중단 배포: 서버 2개 + 프록시로 "게임 중 이전 서버 SIGTERM → 새 서버가 방 받음 → 브라우저·봇 자동 재접속 → 같은 보드로 계속" 확인.

## 9. 시연 영상·GIF (README, 포털 표지, 게임 방법 영상)

- `npm run build && npm run media` (Playwright + ffmpeg, `PW_CHROMIUM=크롬 경로`).
- **CDP screencast는 기기 배율을 무시하고 CSS 픽셀로만 보낸다 → 글자가 흐리다.** `Page.captureScreenshot`에 `clip: {…, scale: 2}`를 반복 호출해(약 15fps) 2배 픽셀 프레임을 받고, 찍은 시각으로 ffconcat 길이를 복원한다.
- GIF: 256색 `palettegen stats_mode=diff` + `paletteuse dither=sierra2_4a`, 너비 840~960(휴대폰 390), 10~15fps. **파일당 8MB 이하**(GitHub README 렌더 한계) — 길면 fps를 낮추거나 앞부분을 자른다.
- 녹화 루프는 페이지가 닫히면 멈추게(`page.isClosed()`) — 안 그러면 한 장면이 실패했을 때 프로세스가 영원히 안 끝난다.
- 헤드리스에는 커서가 안 보이므로 가짜 커서·탭 표시를 주입한다. 데스크톱 녹화는 1280×800(세로가 너무 길면 고정 레이아웃이 텅 빈다).

## 10. 겪은 함정 모음 (같은 실수 반복 금지)

| 증상 | 원인 → 해법 |
|---|---|
| 서버 번들 "Dynamic require of http" | ESM 번들 → esbuild `--format=cjs` (`server.cjs`) |
| 배포 후 클라이언트가 재접속을 안 함 | 서버가 `socket.disconnect()` → 클라이언트는 재접속 안 함. `io.engine.close()`로 전송 계층만 닫는다 |
| 재배포하면 게임이 사라짐 | 새 파드가 이전 파드의 `/handoff`에서 상태를 **당겨온 뒤** Ready (push 방식은 "방 없음" 틈이 생김) |
| 타이머가 기기마다 다름 / 91초로 보임 | 서버는 절대 시각 대신 남은 ms 전송, 화면은 렌더 시점 기준 계산 |
| 두 명이 동시에 "다음 판" → 오류 | 클라이언트가 본 판 번호(1부터)·상태를 같이 보내 이미 진행됐으면 무시 |
| 차례인 사람이 나가 게임 정지 | 20초 뒤 다른 사람이 "대신 진행"(autoMove) |
| 11×11 보드가 9칸으로 잘림 | 부모 CSS 변수(`--n`)를 자식에서 기본값으로 덮어씀 → 기본값 제거 |
| 휴대폰에서 손패를 보려면 스크롤 | 좁은 화면에서 손패를 보드 바로 아래로(order) |
| 말풍선이 차례 배너를 가림 | 이름 오른쪽에 배치 |
| 다크 모드에서 막힌 칸이 안 보임 | 두 테마 공통의 강한 색(빨간 빗금) |
| 첫 화면에서 "방 만들기/들어가기" 헷갈림 | 탭 대신 색·아이콘이 다른 카드 두 개 + "또는" |
| Vite 설정이 워크스페이스 TS를 못 읽음 | 설정용 도우미는 순수 JS(.js + .d.ts)로 (`@bg/web/vite`, `@bg/ui/theme-boot`) |
| 없는 그림이 index.html로 200 | serveStatic: 확장자 있는 경로는 404 |
| 같은 도메인에서 게임끼리 토큰 충돌 | 저장 키에 게임 id |
| CI 태그 갱신 커밋이 다시 배포를 부름 | release paths에 `!<dir>/deploy/**` + 커밋 메시지 `[skip ci]` |
| 홈랩 문서와 실제가 다름(shinkeonkim.com 터널) | 문서를 믿기 전에 실제 동작(`curl`)으로 확인 |
| 셸(zsh)로 매니페스트를 만들 때 `$id:latest`의 `:l`이 소문자 수식어로 먹힘 → 이미지 이름이 `…linesatest` | 변수는 `${id}`로 감싼다, 만든 뒤 `kubectl kustomize`로 이미지 줄 확인 |
| 포털이 `@bg/web`을 import하면 소켓이 열림 | 포털·게임 방법은 `@bg/web/guide-kit`만 |
| ffmpeg에 webp 인코더가 없음 | 표지는 JPEG(`covers/<id>.jpg`) |
| 모바일 녹화가 영원히 안 끝남 | 캡처 호출에 3초 제한, stop은 4초까지만 기다림 |
| 문구가 딱딱·어색 (합니다체·명사형·개발 용어·"2인/로비/패스") | docs/ux-writing.md 기준으로 한 번에 정리 |

## 11. 새 게임 체크리스트 (복사해서 쓰기)

- [ ] docs/games/<id>/01-rules.md, 02-custom.md
- [ ] engine: config(LIMITS·CLASSIC·PRESETS·validate·sanitize) · game · view · module · 테스트(단위+퍼즈)
- [ ] server/src/main.ts, package.json(이름 `@bg/<id>-server`)
- [ ] web: client.tsx · ConfigPanel · Game · Demo · guide.tsx · guide-entry.tsx · game.css(토큰 3곳) · index.html · vite.config.ts(`gameViteConfig('<id>')`)
- [ ] 모든 문구를 docs/ux-writing.md 체크리스트로 확인 (해요체·동사 버튼·용어표)
- [ ] meta.ts (포털에 자동 표시)
- [ ] `npm test && npm run typecheck && npm run build && npm run local` 로 한 판 + QA 크기·테마
- [ ] deploy/(servicemonitor 포함) · release-<id>.yml · `npm run media`(포털 표지 `apps/portal/public/covers/<id>.jpg`, 게임 방법 영상)
- [ ] oh-my-homelab PR (ArgoCD 앱 + 네트워크 정책) → merge 후 확인
- [ ] 쓸 만한 새 UI는 packages/ui로 올리고 /design에 예시 추가, 새 함정은 이 문서 10절에 추가
