# 관리자 페이지

`https://boardgame.shinkeonkim.com/admin`에서 모든 게임의 방을 보고 관리한다.

## 할 수 있는 것
- **통계**: Prometheus 24시간 요약을 보여 준다. 시작한 게임, 끝까지 마친 게임, 평균 시간, 시간대별 시작, 인기 게임, 지금 열린 방과 사람이 나온다.
- **모든 방에 공지**: 모든 게임의 방 화면과 첫 화면 위에 띠로 뜬다. 지우기 전까지 남는다.
- **점검 모드**: 새 방 만들기를 막는다. 지금 하던 게임은 끝까지 이어진다.
- **방 관리**: 게임별로 열린 방의 상태, 판, 사람, 봇, 접속, 마지막 활동을 본다.
  - **방 닫기**: 모두에게 「관리자가 방을 닫았어요」를 띄운다.
  - **한 사람 내보내기**: 게임 중인 플레이어는 내보낼 수 없다. 그때는 방을 닫는다. 방장을 내보내면 다른 사람이 방장이 된다.

## 구조
```
브라우저 ─(Cloudflare Access 로그인)→ 포털 /admin, /admin/api/*
  포털 서버 (apps/portal/server/access.ts): Cf-Access-Jwt-Assertion JWT를 팀 공개키로 확인 (aud·iss·exp·이메일)
  포털 서버 (admin.ts) → 게임 서버 내부 포트 :9464 /admin/* (packages/server/src/admin.ts)
                       → Prometheus (통계)
```
- 게임 서버의 관리자 API는 지표와 같은 **내부 포트(9464)**에만 있다. Ingress와 터널에는 연결하지 않는다.
- NetworkPolicy로 그 포트에는 Prometheus(monitoring)와 포털(boardgame-portal)만 들어오게 한다.
- 상태를 바꾸는 요청에는 관리자 화면만 붙이는 `x-bg-admin` 헤더가 필요하다. 다른 사이트에서 몰래 보내는 요청(CSRF)을 막는다.
- 선택: 게임 서버와 포털 모두에 `ADMIN_TOKEN`을 주면 서버끼리 토큰도 확인한다.
- 공지와 점검 모드는 무중단 배포 때 새 파드로 함께 넘어간다.

## 처음 설정 (Cloudflare — 직접)
1. Cloudflare Zero Trust → Access → Applications → **Self-hosted** 앱을 만든다.
   - 도메인: `boardgame.shinkeonkim.com`, 경로: `admin` (`/admin`과 `/admin/api/*`가 모두 보호된다)
   - 정책: Allow, Include → Emails에 관리자 이메일
2. 앱 개요의 **Application Audience (AUD) Tag**와 팀 도메인(`<팀>.cloudflareaccess.com`)을 `apps/portal/deploy/deployment.yaml`의 `CF_ACCESS_AUD`와 `CF_ACCESS_TEAM_DOMAIN`에 넣는다.
3. (선택) `ADMIN_EMAILS`로 앱 안에서도 이메일을 한 번 더 제한한다.

설정 전에는 관리자 API가 503이다(꺼짐).

## 로컬
`npm run build && npm run local` 하면 `ADMIN_DEV=1`(로그인 생략)과 게임별 내부 포트 주소로 `/admin`이 열린다. 통계는 Prometheus가 없어 비어 있다.
