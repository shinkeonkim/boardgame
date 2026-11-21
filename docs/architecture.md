# 구조

```
            Cloudflare Tunnel (boardgame.shinkeonkim.com)
                              │
                           Traefik  ── 경로로 나눔 ──┐
          /  (나머지 전부)    │                      │  /<게임id>/…  (/socket.io 포함)
                ▼                                    ▼
   ns boardgame-portal                     ns boardgame-<게임id>
   portal ×2 (정적 SPA)                    game ×1 (방 상태는 메모리)
                                           └─ <id>-handoff:9090 (무중단 배포 때만)
```

## 계층

| 계층 | 패키지 | 하는 일 | 게임이 늘 때 |
|---|---|---|---|
| 계약 | `@bg/core` | `GameModule`, `RoomView`, 감정 표현, `GameMeta`, `searchGames` | 그대로 |
| 방 서버 | `@bg/server` | `Rooms`(방 흐름 전부), `createGameServer`, handoff, 정적 파일 | 그대로 |
| 디자인 시스템 | `@bg/ui` | 토큰·테마·공용/게임 컴포넌트 | 쓸 만한 새 UI만 올림 |
| 게임 웹 키트 | `@bg/web` | `mountGame(GameClient)`: 첫 화면·초대·로비·재접속·게임 방법 틀 | 그대로 |
| 게임 | `games/<id>/{engine,server,web}` | 규칙 · 4줄 서버 · 게임 화면/설정/안내 | **새로 만드는 부분** |
| 포털 | `apps/portal` | 홈 · 게임 찾기 · 상세 · /design | `meta.ts`만 추가하면 자동 |

## 게임 하나의 흐름

1. 브라우저 `/<id>/` → 게임 서버의 정적 웹(Vite base `/<id>/`).
2. 소켓 `/<id>/socket.io`로 `create`/`join`(토큰 재접속)/`move`… → `Rooms`가 `GameModule`로 규칙 적용 → 방 안 모두에게 `room`(각자에게 맞춘 `RoomView`).
3. 숨겨야 할 정보는 `viewFor(match, seat)`에서 지운다. 서버가 모든 수를 검증한다(클라이언트를 믿지 않음).

## 무중단 배포 (게임 서버)

RollingUpdate(maxSurge 1, maxUnavailable 0) + 상태 넘겨받기:
새 파드가 `HANDOFF_PEER`(Ready 파드만 가리키는 내부 Service = 이전 파드)에 `POST /handoff` → 이전 파드는 방 전체를 JSON으로 주고 draining(Ready 내림·상태 변경 거절·타이머 정지) → 새 파드가 등록 후 `/readyz` 200 → 트래픽 전환 → 이전 파드 SIGTERM에 `io.engine.close()` → 브라우저 자동 재접속 → 토큰으로 같은 방. 이전 파드가 없으면 5초 뒤 빈 상태로 시작.

## 배포 단위

서브 프로젝트(포털, 각 게임)마다 이미지 `ghcr.io/shinkeonkim/boardgame-<target>`, `deploy/`(kustomize), `release-<target>.yml`, ArgoCD Application, 네임스페이스, 네트워크 정책이 따로다. 공통 패키지(`packages/**`)가 바뀌면 모두 다시 배포된다.
