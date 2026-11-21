"use strict";

// server/main.ts
var import_node_http = require("node:http");
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

// server/main.ts
var PORT = Number(process.env.PORT ?? 3e3);
var DIR = process.env.STATIC_DIR ?? (0, import_node_path2.join)(process.cwd(), "web");
(0, import_node_http.createServer)((req, res) => {
  const path = new URL(req.url ?? "/", "http://x").pathname;
  if (path === "/healthz" || path === "/readyz") return void res.writeHead(200, { "content-type": "text/plain" }).end("ok");
  serveStatic(req, res, { dir: DIR, basePath: "" });
}).listen(PORT, () => console.log(`portal listening on :${PORT} (static: ${DIR})`));
process.on("SIGTERM", () => process.exit(0));
