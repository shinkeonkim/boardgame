"use strict";

// server/main.ts
var import_node_http2 = require("node:http");
var import_node_path2 = require("node:path");

// ../../packages/server/src/static.ts
var import_node_fs = require("node:fs");
var import_node_path = require("node:path");
var MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".ico": "image/x-icon",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".woff2": "font/woff2"
};
function serveStatic(req, res, opts) {
  const dir = (0, import_node_path.resolve)(opts.dir);
  const url = new URL(req.url ?? "/", "http://x");
  const base = opts.basePath.replace(/\/$/, "");
  let path = decodeURIComponent(url.pathname);
  if (base) {
    if (path === base) {
      res.writeHead(308, { location: `${base}/${url.search}` }).end();
      return true;
    }
    if (!path.startsWith(`${base}/`)) return false;
    path = path.slice(base.length);
  }
  let file = (0, import_node_path.normalize)((0, import_node_path.join)(dir, path));
  if (!file.startsWith(dir)) file = (0, import_node_path.join)(dir, "index.html");
  else if (!(0, import_node_fs.existsSync)(file) || (0, import_node_fs.statSync)(file).isDirectory()) {
    if ((0, import_node_path.extname)(path) && (0, import_node_path.extname)(path) !== ".html") {
      res.writeHead(404, { "content-type": "text/plain" }).end("not found");
      return true;
    }
    file = (0, import_node_path.join)(dir, "index.html");
  }
  if (!(0, import_node_fs.existsSync)(file)) {
    res.writeHead(404).end("web build not found \u2014 run `npm run build`");
    return true;
  }
  const isAsset = file.includes(`${dir}/assets/`);
  const range = req.headers.range;
  const size = (0, import_node_fs.statSync)(file).size;
  const type = MIME[(0, import_node_path.extname)(file)] ?? "application/octet-stream";
  const cache2 = isAsset ? "public, max-age=31536000, immutable" : (0, import_node_path.extname)(file) === ".mp4" ? "public, max-age=86400" : "no-cache";
  if (range && /^bytes=\d*-\d*$/.test(range)) {
    const [a, b] = range.slice(6).split("-");
    const start = a ? Number(a) : 0;
    const end = b ? Math.min(Number(b), size - 1) : size - 1;
    res.writeHead(206, { "content-type": type, "content-range": `bytes ${start}-${end}/${size}`, "accept-ranges": "bytes", "content-length": end - start + 1, "cache-control": cache2 });
    (0, import_node_fs.createReadStream)(file, { start, end }).pipe(res);
    return true;
  }
  res.writeHead(200, { "content-type": type, "cache-control": cache2, "accept-ranges": "bytes", "content-length": size });
  (0, import_node_fs.createReadStream)(file).pipe(res);
  return true;
}

// ../../packages/server/src/metrics.ts
var import_node_http = require("node:http");
var import_node_perf_hooks = require("node:perf_hooks");
var esc = (v) => v.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
var key = (labels = {}) => Object.keys(labels).sort().map((k) => `${k}="${esc(String(labels[k]))}"`).join(",");
var Metrics = class {
  constructor(base = {}) {
    this.base = base;
    this.loop.enable();
  }
  families = /* @__PURE__ */ new Map();
  collectors = [];
  loop = (0, import_node_perf_hooks.monitorEventLoopDelay)({ resolution: 20 });
  started = Date.now();
  family(name, type, help, buckets) {
    let f = this.families.get(name);
    if (!f) this.families.set(name, f = { type, help, values: /* @__PURE__ */ new Map(), buckets });
    return f;
  }
  /** 카운터 정의 (help를 처음 한 번만 넘기면 된다) */
  counter(name, help) {
    this.family(name, "counter", help);
    return (labels = {}, by = 1) => this.inc(name, labels, by);
  }
  inc(name, labels = {}, by = 1) {
    const f = this.family(name, "counter", "");
    const k = key({ ...this.base, ...labels });
    f.values.set(k, (f.values.get(k) ?? 0) + by);
  }
  /** 게이지 값 설정 (collect 콜백 안에서 부른다) */
  set(name, help, value, labels = {}) {
    this.family(name, "gauge", help).values.set(key({ ...this.base, ...labels }), value);
  }
  histogram(name, help, buckets) {
    this.family(name, "histogram", help, buckets);
    return (value, labels = {}) => {
      const f = this.families.get(name);
      const lb = { ...this.base, ...labels };
      for (const b of f.buckets) this.bump(f, key({ ...lb, le: b }), value <= b ? 1 : 0);
      this.bump(f, key({ ...lb, le: "+Inf" }), 1);
      this.bump(f, `__sum|${key(lb)}`, value);
      this.bump(f, `__count|${key(lb)}`, 1);
    };
  }
  bump(f, k, by) {
    f.values.set(k, (f.values.get(k) ?? 0) + by);
  }
  /** 수집할 때마다 불리는 콜백 (게이지를 새로 계산) */
  onCollect(fn) {
    this.collectors.push(fn);
  }
  render() {
    for (const f of this.families.values()) if (f.type === "gauge") f.values.clear();
    this.collectProcess();
    for (const c of this.collectors) c();
    const out = [];
    for (const [name, f] of this.families) {
      if (f.help) out.push(`# HELP ${name} ${f.help}`);
      out.push(`# TYPE ${name} ${f.type}`);
      for (const [k, v] of f.values) {
        if (k.startsWith("__sum|")) out.push(`${name}_sum${wrap(k.slice(6))} ${v}`);
        else if (k.startsWith("__count|")) out.push(`${name}_count${wrap(k.slice(8))} ${v}`);
        else out.push(`${name}${f.type === "histogram" ? "_bucket" : ""}${wrap(k)} ${v}`);
      }
    }
    return out.join("\n") + "\n";
  }
  collectProcess() {
    const mem = process.memoryUsage();
    this.set("process_resident_memory_bytes", "\uD504\uB85C\uC138\uC2A4 \uBA54\uBAA8\uB9AC(RSS)", mem.rss);
    this.set("nodejs_heap_used_bytes", "V8 \uD799 \uC0AC\uC6A9\uB7C9", mem.heapUsed);
    const cpu = process.cpuUsage();
    this.set("process_cpu_seconds_total", "CPU \uC0AC\uC6A9 \uC2DC\uAC04(\uB204\uC801, \uCD08)", (cpu.user + cpu.system) / 1e6);
    this.set("process_uptime_seconds", "\uD504\uB85C\uC138\uC2A4\uAC00 \uB72C \uC9C0 \uBA87 \uCD08", (Date.now() - this.started) / 1e3);
    this.set("nodejs_eventloop_lag_p99_seconds", "\uC774\uBCA4\uD2B8 \uB8E8\uD504 \uC9C0\uC5F0 p99(\uCD08)", this.loop.percentile(99) / 1e9);
    this.loop.reset();
  }
  /** 내부 포트에 /metrics 띄우기 (extra: 같은 내부 포트에 붙일 다른 경로 — 관리자 API) */
  serve(port, extra) {
    const s = (0, import_node_http.createServer)((req, res) => {
      if (extra?.(req, res)) return;
      if (req.url !== "/metrics") return void res.writeHead(404).end();
      res.writeHead(200, { "content-type": "text/plain; version=0.0.4; charset=utf-8" }).end(this.render());
    });
    s.listen(port, () => console.log(`metrics listening on :${port}/metrics`));
    return s;
  }
};
var wrap = (k) => k ? `{${k}}` : "";
var noMetrics = new Metrics();

// server/access.ts
var import_node_crypto = require("node:crypto");
var b64 = (s) => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");
var cache = null;
var fetchKeys = async (team) => {
  if (cache && cache.team === team && Date.now() - cache.at < 10 * 6e4) return cache.keys;
  const r = await fetch(`https://${team}/cdn-cgi/access/certs`, { signal: AbortSignal.timeout(5e3) });
  if (!r.ok) throw new Error(`certs ${r.status}`);
  const keys = (await r.json()).keys;
  cache = { at: Date.now(), team, keys };
  return keys;
};
function tokenFrom(req) {
  const h = req.headers["cf-access-jwt-assertion"];
  if (typeof h === "string" && h) return h;
  const cookie = req.headers.cookie ?? "";
  const m = cookie.match(/(?:^|;\s*)CF_Authorization=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}
async function verifyAccessJwt(token, opts) {
  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false, status: 401, error: "\uB85C\uADF8\uC778 \uC815\uBCF4\uAC00 \uC774\uC0C1\uD574\uC694" };
  let header;
  let payload;
  try {
    header = JSON.parse(b64(parts[0]).toString("utf8"));
    payload = JSON.parse(b64(parts[1]).toString("utf8"));
  } catch {
    return { ok: false, status: 401, error: "\uB85C\uADF8\uC778 \uC815\uBCF4\uAC00 \uC774\uC0C1\uD574\uC694" };
  }
  if (header.alg !== "RS256") return { ok: false, status: 401, error: "\uC9C0\uC6D0\uD558\uC9C0 \uC54A\uB294 \uC11C\uBA85 \uBC29\uC2DD\uC774\uC5D0\uC694" };
  const keys = await (opts.keys ?? fetchKeys)(opts.team);
  const jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) return { ok: false, status: 401, error: "\uC11C\uBA85 \uD0A4\uB97C \uCC3E\uC9C0 \uBABB\uD588\uC5B4\uC694" };
  const good = (0, import_node_crypto.verify)("RSA-SHA256", Buffer.from(`${parts[0]}.${parts[1]}`), (0, import_node_crypto.createPublicKey)({ key: jwk, format: "jwk" }), b64(parts[2]));
  if (!good) return { ok: false, status: 401, error: "\uC11C\uBA85\uC774 \uB9DE\uC9C0 \uC54A\uC544\uC694" };
  const now = Math.floor((opts.now ?? Date.now()) / 1e3);
  const auds = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!auds.includes(opts.aud)) return { ok: false, status: 403, error: "\uC774 \uC571\uC758 \uB85C\uADF8\uC778\uC774 \uC544\uB2C8\uC5D0\uC694" };
  if (payload.iss !== `https://${opts.team}`) return { ok: false, status: 403, error: "\uBC1C\uAE09\uCC98\uAC00 \uB2EC\uB77C\uC694" };
  if (!payload.exp || payload.exp < now - 30) return { ok: false, status: 401, error: "\uB85C\uADF8\uC778\uC774 \uB9CC\uB8CC\uB410\uC5B4\uC694. \uC0C8\uB85C \uACE0\uCE68\uD574 \uC8FC\uC138\uC694" };
  if (payload.nbf && payload.nbf > now + 30) return { ok: false, status: 401, error: "\uC544\uC9C1 \uC4F8 \uC218 \uC5C6\uB294 \uB85C\uADF8\uC778\uC774\uC5D0\uC694" };
  const email = String(payload.email ?? "").toLowerCase();
  if (opts.emails?.length && !opts.emails.includes(email)) return { ok: false, status: 403, error: "\uAD00\uB9AC\uC790\uB85C \uB4F1\uB85D\uB41C \uACC4\uC815\uC774 \uC544\uB2C8\uC5D0\uC694" };
  return { ok: true, email };
}
async function checkAdmin(req) {
  if (process.env.ADMIN_DEV === "1") return { ok: true, email: "dev@local" };
  const team = process.env.CF_ACCESS_TEAM_DOMAIN;
  const aud = process.env.CF_ACCESS_AUD;
  if (!team || !aud) return { ok: false, status: 503, error: "\uAD00\uB9AC\uC790 \uD398\uC774\uC9C0\uAC00 \uC544\uC9C1 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC5B4\uC694 (CF_ACCESS_TEAM_DOMAIN \xB7 CF_ACCESS_AUD)" };
  const token = tokenFrom(req);
  if (!token) return { ok: false, status: 401, error: "Cloudflare Access \uB85C\uADF8\uC778\uC774 \uD544\uC694\uD574\uC694" };
  const emails = (process.env.ADMIN_EMAILS ?? "").split(",").map((x) => x.trim().toLowerCase()).filter(Boolean);
  try {
    return await verifyAccessJwt(token, { team, aud, emails });
  } catch (e) {
    console.error("access: \uD0A4\uB97C \uAC00\uC838\uC624\uC9C0 \uBABB\uD568", e);
    return { ok: false, status: 503, error: "\uB85C\uADF8\uC778 \uD655\uC778 \uC11C\uBC84\uC5D0 \uB2FF\uC9C0 \uBABB\uD588\uC5B4\uC694" };
  }
}

// server/admin.ts
var send = (res, status, body) => void res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }).end(JSON.stringify(body));
function gameUrl(id) {
  try {
    const map = JSON.parse(process.env.ADMIN_GAME_URLS ?? "{}");
    if (map[id]) return map[id];
  } catch {
  }
  return (process.env.ADMIN_GAME_URL ?? "http://{id}.boardgame-{id}.svc.cluster.local:9464").replaceAll("{id}", id);
}
function readBody(req) {
  return new Promise((resolve2, reject) => {
    let body = "";
    req.on("data", (c) => {
      body += c;
      if (body.length > 8192) reject(new Error("too large"));
    });
    req.on("end", () => resolve2(body));
    req.on("error", reject);
  });
}
async function toGame(id, path, init) {
  const r = await fetch(`${gameUrl(id)}${path}`, {
    method: init.method,
    body: init.body,
    headers: { "content-type": "application/json", ...process.env.ADMIN_TOKEN ? { "x-admin-token": process.env.ADMIN_TOKEN } : {} },
    signal: AbortSignal.timeout(4e3)
  });
  return { status: r.status, body: await r.json().catch(() => ({ error: `\uAC8C\uC784 \uC11C\uBC84 \uC751\uB2F5 ${r.status}` })) };
}
async function prom(query, by = "game") {
  const base = process.env.PROMETHEUS_URL ?? "http://prometheus-operated.monitoring.svc:9090";
  const r = await fetch(`${base}/api/v1/query?query=${encodeURIComponent(query)}`, { signal: AbortSignal.timeout(4e3) });
  const d = await r.json();
  const out = {};
  for (const x of d.data?.result ?? []) out[x.metric[by] ?? "all"] = Number(x.value[1]) || 0;
  return out;
}
async function promRange(query, hours) {
  const base = process.env.PROMETHEUS_URL ?? "http://prometheus-operated.monitoring.svc:9090";
  const end = Math.floor(Date.now() / 1e3);
  const r = await fetch(`${base}/api/v1/query_range?query=${encodeURIComponent(query)}&start=${end - hours * 3600}&end=${end}&step=3600`, { signal: AbortSignal.timeout(4e3) });
  const d = await r.json();
  return (d.data?.result?.[0]?.values ?? []).map((v) => Math.round(Number(v[1]) || 0));
}
async function stats() {
  const [started, finished, rooms, people, durSum, durCount, hourly] = await Promise.all([
    prom("sum by (game) (increase(bg_matches_started_total[24h]))"),
    prom("sum by (game) (increase(bg_matches_finished_total[24h]))"),
    prom("sum by (game) (bg_rooms)"),
    prom('sum by (game) (bg_members{connected="true"})'),
    prom("sum(increase(bg_match_duration_seconds_sum[24h]))", "none"),
    prom("sum(increase(bg_match_duration_seconds_count[24h]))", "none"),
    promRange("sum(increase(bg_matches_started_total[1h]))", 24)
  ]);
  const total = (o) => Math.round(Object.values(o).reduce((a, b) => a + b, 0));
  const avgMin = durCount.all ? durSum.all / durCount.all / 60 : null;
  const top = Object.entries(started).map(([game, n]) => ({ game, started: Math.round(n), finished: Math.round(finished[game] ?? 0) })).filter((x) => x.started > 0).sort((a, b) => b.started - a.started).slice(0, 8);
  return { started24h: total(started), finished24h: total(finished), roomsNow: total(rooms), peopleNow: total(people), avgMinutes: avgMin, top, hourly };
}
function handleAdmin(req, res, path) {
  if (!path.startsWith("/admin/api/")) return false;
  (async () => {
    const who = await checkAdmin(req);
    if (!who.ok) return send(res, who.status, { error: who.error });
    if (req.method !== "GET" && req.headers["x-bg-admin"] !== "1") return send(res, 403, { error: "\uAD00\uB9AC\uC790 \uD654\uBA74\uC5D0\uC11C\uB9CC \uD560 \uC218 \uC788\uC5B4\uC694" });
    const sub = path.slice("/admin/api".length);
    try {
      if (sub === "/me") return send(res, 200, { email: who.email });
      if (sub === "/stats") return send(res, 200, await stats().catch((e) => ({ error: `Prometheus\uC5D0 \uB2FF\uC9C0 \uBABB\uD588\uC5B4\uC694 (${e instanceof Error ? e.message : e})` })));
      const m = sub.match(/^\/games\/([a-z0-9-]{2,40})(\/.*)$/);
      if (!m) return send(res, 404, { error: "\uC5C6\uB294 \uAD00\uB9AC \uAE30\uB2A5\uC774\uC5D0\uC694" });
      const [, id, rest] = m;
      const allowed = req.method === "GET" ? rest === "/state" : /^\/(rooms\/[A-Za-z0-9]{3,8}\/(close|kick)|notice|maintenance)$/.test(rest);
      if (!allowed) return send(res, 404, { error: "\uC5C6\uB294 \uAD00\uB9AC \uAE30\uB2A5\uC774\uC5D0\uC694" });
      const body = req.method === "GET" ? void 0 : await readBody(req);
      const r = await toGame(id, `/admin${rest}`, { method: req.method ?? "GET", body });
      if (req.method !== "GET") console.log(`admin(${who.email}): ${id} ${rest}`);
      return send(res, r.status, r.body);
    } catch (e) {
      return send(res, 502, { error: `\uAC8C\uC784 \uC11C\uBC84\uC5D0 \uB2FF\uC9C0 \uBABB\uD588\uC5B4\uC694 (${e instanceof Error ? e.message : e})` });
    }
  })();
  return true;
}

// server/main.ts
var PORT = Number(process.env.PORT ?? 3e3);
var DIR = process.env.STATIC_DIR ?? (0, import_node_path2.join)(process.cwd(), "web");
var metrics = new Metrics({ app: "portal" });
var requests = metrics.counter("bg_portal_requests_total", "\uD3EC\uD138 \uC694\uCCAD (kind: page|asset|cover|other, status)");
var METRICS_PORT = Number(process.env.METRICS_PORT ?? 9464) || 0;
if (METRICS_PORT) metrics.serve(METRICS_PORT);
var kindOf = (path) => path.startsWith("/assets/") ? "asset" : path.startsWith("/covers/") ? "cover" : /\.[a-z0-9]+$/i.test(path) ? "other" : "page";
(0, import_node_http2.createServer)((req, res) => {
  const path = new URL(req.url ?? "/", "http://x").pathname;
  if (path === "/healthz" || path === "/readyz") return void res.writeHead(200, { "content-type": "text/plain" }).end("ok");
  res.on("finish", () => requests({ kind: kindOf(path), status: res.statusCode }));
  if (handleAdmin(req, res, path)) return;
  serveStatic(req, res, { dir: DIR, basePath: "" });
}).listen(PORT, () => console.log(`portal listening on :${PORT} (static: ${DIR})`));
process.on("SIGTERM", () => process.exit(0));
