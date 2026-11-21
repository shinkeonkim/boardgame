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
  const cache = isAsset ? "public, max-age=31536000, immutable" : (0, import_node_path.extname)(file) === ".mp4" ? "public, max-age=86400" : "no-cache";
  if (range && /^bytes=\d*-\d*$/.test(range)) {
    const [a, b] = range.slice(6).split("-");
    const start = a ? Number(a) : 0;
    const end = b ? Math.min(Number(b), size - 1) : size - 1;
    res.writeHead(206, { "content-type": type, "content-range": `bytes ${start}-${end}/${size}`, "accept-ranges": "bytes", "content-length": end - start + 1, "cache-control": cache });
    (0, import_node_fs.createReadStream)(file, { start, end }).pipe(res);
    return true;
  }
  res.writeHead(200, { "content-type": type, "cache-control": cache, "accept-ranges": "bytes", "content-length": size });
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
  /** 내부 포트에 /metrics 띄우기 */
  serve(port) {
    const s = (0, import_node_http.createServer)((req, res) => {
      if (req.url !== "/metrics") return void res.writeHead(404).end();
      res.writeHead(200, { "content-type": "text/plain; version=0.0.4; charset=utf-8" }).end(this.render());
    });
    s.listen(port, () => console.log(`metrics listening on :${port}/metrics`));
    return s;
  }
};
var wrap = (k) => k ? `{${k}}` : "";
var noMetrics = new Metrics();

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
  serveStatic(req, res, { dir: DIR, basePath: "" });
}).listen(PORT, () => console.log(`portal listening on :${PORT} (static: ${DIR})`));
process.on("SIGTERM", () => process.exit(0));
