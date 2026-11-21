// Grafana 대시보드 JSON 만들기: node scripts/monitoring/dashboard.mjs
//   → apps/portal/deploy/monitoring/boardgame-dashboard.json
// 포털 deploy가 grafana_dashboard: "1" 라벨 ConfigMap으로 내보내면 Grafana 사이드카가 자동으로 불러온다.
// 지표 설명: docs/monitoring.md
import { mkdirSync, writeFileSync } from 'node:fs';

const DS = { type: 'prometheus', uid: '${datasource}' };
const G = 'game=~"$game"';
let id = 1;
let y = 0;
const panels = [];

function row(title) {
  panels.push({ id: id++, type: 'row', title, collapsed: false, gridPos: { h: 1, w: 24, x: 0, y }, panels: [] });
  y += 1;
}
/** 한 줄에 여러 패널: [[w, panel], ...] */
function line(h, items) {
  let x = 0;
  for (const [w, p] of items) {
    panels.push({ ...p, id: id++, datasource: DS, gridPos: { h, w, x, y } });
    x += w;
  }
  y += h;
}
const target = (expr, legend = '', extra = {}) => ({ datasource: DS, expr, legendFormat: legend, refId: String.fromCharCode(65 + Math.floor(Math.random() * 26)), ...extra });
const targets = (...ts) => ts.map((t, i) => ({ ...t, refId: String.fromCharCode(65 + i) }));

const stat = (title, expr, opts = {}) => ({
  type: 'stat',
  title,
  description: opts.description ?? '',
  targets: targets(target(expr, '', { instant: true })),
  options: { reduceOptions: { calcs: ['lastNotNull'] }, colorMode: 'value', graphMode: 'area', textMode: 'value' },
  fieldConfig: { defaults: { unit: opts.unit ?? 'short', decimals: opts.decimals ?? 0, color: { mode: 'thresholds' }, thresholds: { mode: 'absolute', steps: opts.steps ?? [{ color: 'green', value: null }] } }, overrides: [] },
});
const ts = (title, list, opts = {}) => ({
  type: 'timeseries',
  title,
  description: opts.description ?? '',
  targets: targets(...list.map(([e, l]) => target(e, l))),
  options: { legend: { displayMode: 'list', placement: 'bottom' }, tooltip: { mode: 'multi', sort: 'desc' } },
  fieldConfig: {
    defaults: { unit: opts.unit ?? 'short', custom: { drawStyle: opts.bars ? 'bars' : 'line', fillOpacity: opts.bars ? 80 : 15, lineWidth: 2, stacking: { mode: opts.stack ? 'normal' : 'none' }, showPoints: 'never' }, min: 0 },
    overrides: [],
  },
});
const bars = (title, expr, legend, opts = {}) => ({
  type: 'bargauge',
  title,
  description: opts.description ?? '',
  targets: targets(target(expr, legend, { instant: true })),
  options: { orientation: 'horizontal', displayMode: 'gradient', reduceOptions: { calcs: ['lastNotNull'] }, showUnfilled: true },
  fieldConfig: { defaults: { unit: 'short', decimals: 0, min: 0, color: { mode: 'continuous-BlYlRd' } }, overrides: [] },
});

// ---------- 한눈에 보기 ----------
row('한눈에 보기');
line(5, [
  [4, stat('지금 열린 방', `sum(bg_rooms{${G}})`, { description: '대기실·게임 중·결과 화면을 모두 합친 방 수' })],
  [4, stat('게임 중인 방', `sum(bg_rooms_by_state{${G},state="playing"})`)],
  [4, stat('접속한 사람', `sum(bg_members{${G},connected="true"})`, { description: '플레이어 + 관전 (연결된 사람만)' })],
  [4, stat('오늘 시작한 게임', `sum(increase(bg_matches_started_total{${G}}[24h]))`)],
  [4, stat('방 사용률', `sum(bg_rooms{${G}}) / sum(bg_room_capacity{${G}})`, { unit: 'percentunit', decimals: 0, steps: [{ color: 'green', value: null }, { color: 'orange', value: 0.8 }, { color: 'red', value: 1 }], description: '게임마다 MAX_ROOMS 대비 열린 방' })],
  [4, stat('준비된 게임 서버', `sum(bg_ready{${G}})`, { steps: [{ color: 'red', value: null }, { color: 'green', value: 1 }], description: '트래픽을 받는 게임 서버 수 (게임 수와 같아야 정상)' })],
]);

// ---------- 게임별 ----------
row('게임별 상황');
line(8, [
  [12, ts('방 상태', [[`sum by (game, state) (bg_rooms_by_state{${G}})`, '{{game}} · {{state}}']], { stack: true, description: 'lobby=대기실, playing=게임 중, round_over=판 결과, match_over=게임 결과, paused=멈춤' })],
  [12, ts('방에 있는 사람', [[`sum by (game, role) (bg_members{${G},connected="true"})`, '{{game}} · {{role}}'], [`sum by (game) (bg_members{${G},connected="false"})`, '{{game}} · 연결 끊김']])],
]);
line(8, [
  [8, ts('게임 시작·완료 (시간당)', [[`sum by (game) (increase(bg_matches_started_total{${G}}[1h]))`, '{{game}} 시작'], [`sum by (game) (increase(bg_matches_finished_total{${G}}[1h]))`, '{{game}} 완료']], { bars: true })],
  [8, ts('둔 수 (분당)', [[`sum by (game) (rate(bg_moves_total{${G}}[5m])) * 60`, '{{game}}'], [`sum by (game) (rate(bg_moves_rejected_total{${G}}[5m])) * 60`, '{{game}} 거절']], { description: '거절 = 규칙에 맞지 않아 안내가 뜬 수' })],
  [8, ts('게임 하나 걸린 시간', [[`histogram_quantile(0.5, sum by (le, game) (rate(bg_match_duration_seconds_bucket{${G}}[6h])))`, '{{game}} 중간값'], [`histogram_quantile(0.9, sum by (le, game) (rate(bg_match_duration_seconds_bucket{${G}}[6h])))`, '{{game}} 90%'], [`max by (game) (bg_longest_match_seconds{${G}})`, '{{game}} 지금 가장 긴 게임']], { unit: 's' })],
]);
line(8, [
  [6, bars('몇 명이서 하나요 (7일)', `sum by (players) (increase(bg_matches_started_total{${G}}[7d]))`, '{{players}}명')],
  [6, bars('지금 방 인원', `sum by (players) (bg_rooms_by_players{${G}})`, '{{players}}명 방')],
  [12, bars('감정 표현 TOP 10 (7일)', `topk(10, sum by (emote) (increase(bg_emotes_total{${G}}[7d])))`, '{{emote}}')],
]);
line(8, [
  [8, ts('입장 (시간당)', [[`sum by (kind) (increase(bg_joins_total{${G}}[1h]))`, '{{kind}}'], [`sum by (reason) (increase(bg_join_failures_total{${G}}[1h]))`, '실패 · {{reason}}']], { bars: true, description: 'player/spectator=새로 들어옴, rejoin=다시 접속' })],
  [8, ts('방 만들기·없어짐 (시간당)', [[`sum (increase(bg_rooms_created_total{${G}}[1h]))`, '만듦'], [`sum by (reason) (increase(bg_rooms_removed_total{${G}}[1h]))`, '없어짐 · {{reason}}'], [`sum (increase(bg_room_create_rejected_total{${G}}[1h]))`, '가득 차서 못 만듦']], { bars: true })],
  [8, ts('도움 기능 (시간당)', [[`sum by (cause) (increase(bg_auto_moves_total{${G}}[1h]))`, '자동 진행 · {{cause}}'], [`sum (increase(bg_kicks_total{${G}}[1h]))`, '내보내기'], [`sum (increase(bg_matches_paused_total{${G}}[1h]))`, '게임 멈춤'], [`sum (increase(bg_matches_resumed_total{${G}}[1h]))`, '이어서 하기']], { bars: true })],
]);

// ---------- 서버 ----------
row('서버');
line(7, [
  [6, ts('소켓 연결', [[`sum by (game) (bg_sockets{${G}})`, '{{game}}']])],
  [6, ts('메모리', [['sum by (game, app) (process_resident_memory_bytes{namespace=~"boardgame-.*"})', '{{game}}{{app}}']], { unit: 'bytes' })],
  [6, ts('이벤트 루프 지연 p99', [['max by (game, app) (nodejs_eventloop_lag_p99_seconds{namespace=~"boardgame-.*"})', '{{game}}{{app}}']], { unit: 's', description: '높으면 화면 반응이 늦어져요' })],
  [6, ts('CPU', [['sum by (game, app) (rate(process_cpu_seconds_total{namespace=~"boardgame-.*"}[5m]))', '{{game}}{{app}}']], { unit: 'percentunit' })],
]);
line(7, [
  [8, ts('무중단 배포로 넘긴 방', [[`sum by (game, direction) (increase(bg_handoff_rooms_total{${G}}[10m]))`, '{{game}} · {{direction}}']], { bars: true, description: 'out=이전 서버가 넘겨줌, in=새 서버가 받음 — 둘이 같아야 게임이 끊기지 않은 것' })],
  [8, ts('오류·재시작', [[`sum by (game) (increase(bg_server_errors_total{${G}}[1h]))`, '{{game}} 서버 오류'], ['sum by (namespace) (increase(kube_pod_container_status_restarts_total{namespace=~"boardgame-.*"}[1h]))', '{{namespace}} 재시작']], { bars: true })],
  [8, ts('포털 요청 (분당)', [['sum by (kind) (rate(bg_portal_requests_total[5m])) * 60', '{{kind}}'], ['sum (rate(bg_portal_requests_total{status="404"}[5m])) * 60', '404']])],
]);

const dashboard = {
  uid: 'boardgame-table',
  title: '보드게임 테이블',
  description: 'boardgame.shinkeonkim.com — 게임별 방·사람·게임 진행과 서버 상태 (scripts/monitoring/dashboard.mjs 로 생성)',
  tags: ['boardgame'],
  timezone: 'browser',
  refresh: '30s',
  time: { from: 'now-24h', to: 'now' },
  schemaVersion: 39,
  version: 1,
  editable: true,
  links: [{ title: '보드게임 테이블', url: 'https://boardgame.shinkeonkim.com', type: 'link', targetBlank: true }],
  templating: {
    list: [
      { name: 'datasource', label: '데이터 소스', type: 'datasource', query: 'prometheus', current: {}, hide: 0 },
      {
        name: 'game',
        label: '게임',
        type: 'query',
        datasource: DS,
        query: { query: 'label_values(bg_rooms, game)', refId: 'game' },
        definition: 'label_values(bg_rooms, game)',
        refresh: 2,
        includeAll: true,
        multi: true,
        allValue: '.*',
        current: { text: 'All', value: '$__all' },
        sort: 1,
      },
    ],
  },
  panels,
};

const out = new URL('../../apps/portal/deploy/monitoring/', import.meta.url).pathname;
mkdirSync(out, { recursive: true });
writeFileSync(`${out}boardgame-dashboard.json`, JSON.stringify(dashboard, null, 2) + '\n');
console.log(`대시보드: ${panels.length}개 패널 → ${out}boardgame-dashboard.json`);
