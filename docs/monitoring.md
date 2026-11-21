# 모니터링

홈랩의 kube-prometheus-stack(Prometheus + Grafana + Alertmanager)으로 본다.

- **대시보드:** Grafana의 「보드게임 테이블」 (`uid: boardgame-table`). `scripts/monitoring/dashboard.mjs`로 만든 JSON이 `apps/portal/deploy/monitoring/`에 있고, 포털 배포가 `grafana_dashboard: "1"` 라벨 ConfigMap으로 내보내면 Grafana 사이드카가 불러온다.
- **수집:** 각 서브 프로젝트의 `deploy/servicemonitor.yaml`이 담당한다. 지표는 내부 포트 `9464`의 `/metrics`로만 내보내고, Ingress·터널에는 연결하지 않는다. 네트워크 정책은 oh-my-homelab에서 `monitoring` 네임스페이스만 허용한다.
- **알림:** `apps/portal/deploy/prometheusrule.yaml`에 있다. 규칙은 서버 준비 안 됨, 방 가득 참, 서버 오류, 배포 중 방 유실 넷이다.
- **로컬:** `npm run build && npm run local` 후 포털은 http://localhost:9460/metrics, 게임은 http://localhost:9461/metrics 부터 순서대로 본다.

## 지표 (모든 게임 서버, 라벨 `game`)

| 지표 | 종류 | 뜻 |
|---|---|---|
| `bg_rooms` | 게이지 | 지금 있는 방 |
| `bg_rooms_by_state{state}` | 게이지 | lobby(대기실)·playing·round_over·match_over·paused |
| `bg_rooms_by_players{players}` | 게이지 | 플레이어 수별 방 |
| `bg_members{role,connected}` | 게이지 | 방에 있는 사람 (player/spectator × 접속 여부) |
| `bg_rooms_with_password` | 게이지 | 암호 걸린 방 |
| `bg_room_capacity` | 게이지 | MAX_ROOMS |
| `bg_longest_match_seconds` | 게이지 | 지금 가장 오래 하는 게임 |
| `bg_sockets` | 게이지 | 열린 소켓 연결 |
| `bg_ready` · `bg_draining` | 게이지 | 트래픽 받는 중 · 배포로 방을 넘기고 종료 대기 |
| `bg_rooms_created_total` · `bg_rooms_removed_total{reason}` · `bg_room_create_rejected_total` | 카운터 | 방 만듦 · 없어짐(closed/empty/idle) · 가득 차서 못 만듦 |
| `bg_joins_total{kind}` · `bg_join_failures_total{reason}` | 카운터 | 입장(player/spectator/rejoin) · 실패(not_found/password/password_limit) |
| `bg_matches_started_total{players}` · `bg_matches_finished_total{players}` · `bg_rounds_finished_total` | 카운터 | 게임 시작 · 끝까지 마침 · 끝난 판 |
| `bg_match_duration_seconds` | 히스토그램 | 게임 하나 걸린 시간 |
| `bg_moves_total` · `bg_moves_rejected_total` | 카운터 | 둔 수 · 규칙에 맞지 않아 거절된 수 |
| `bg_auto_moves_total{cause}` · `bg_kicks_total` · `bg_matches_paused_total` · `bg_matches_resumed_total` | 카운터 | 자동 진행(timer/nudge) · 내보내기 · 멈춤 · 이어서 하기 |
| `bg_emotes_total{emote}` | 카운터 | 보낸 감정 표현 |
| `bg_handoff_rooms_total{direction}` | 카운터 | 무중단 배포로 넘겨준(out)·받은(in) 방 |
| `bg_server_errors_total` | 카운터 | 처리하지 못한 오류 |
| `process_resident_memory_bytes` · `nodejs_heap_used_bytes` · `process_cpu_seconds_total` · `process_uptime_seconds` · `nodejs_eventloop_lag_p99_seconds` | 게이지 | 프로세스 상태 |

포털(라벨 `app="portal"`): `bg_portal_requests_total{kind,status}` (page/asset/cover/other) + 프로세스 지표.

## 새 지표를 더할 때

1. `Rooms`(공통)나 게임 서버에서 `metrics.counter(...)`·`metrics.set(...)`을 쓴다. 이름은 `bg_` 접두사, 단위는 `_seconds`·`_bytes`·`_total`.
2. `packages/server/src/metrics.test.ts`에 기대 출력을 추가한다.
3. `scripts/monitoring/dashboard.mjs`에 패널을 넣고 다시 생성한다. 이 문서의 표에 한 줄 더한다.
