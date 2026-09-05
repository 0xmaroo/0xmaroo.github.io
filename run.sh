#!/usr/bin/env bash
#
# run.sh — one command to see this site.
#
#   ./run.sh          Build it the way the deploy workflow does, then serve the
#                     built output the way GitHub Pages serves it. This is what
#                     a visitor actually gets: the meta CSP, the generated OG
#                     images, the Pagefind index, the pre-rendered filter routes.
#   ./run.sh dev      Live-reload dev server instead. Faster, and drafts are
#                     visible — but it is NOT what gets deployed.
#   ./run.sh stop     Stop a preview started earlier.
#
# Why not `astro preview`: it serves without compression and without the
# 404.html fallback, so it misreports both performance and missing-page
# behaviour. This server matches GitHub Pages on both.

set -euo pipefail
cd "$(dirname "$0")"

PORT="${PORT:-4321}"
MODE="${1:-prod}"
PIDFILE=".astro/run-preview.pid"

c_dim=$'\e[2m'; c_b=$'\e[1m'; c_y=$'\e[33m'; c_g=$'\e[32m'; c_r=$'\e[31m'; c_0=$'\e[0m'

stop_preview() {
  if [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
    kill "$(cat "$PIDFILE")" 2>/dev/null || true
    echo "${c_dim}stopped preview (pid $(cat "$PIDFILE"))${c_0}"
  fi
  rm -f "$PIDFILE"
}

case "$MODE" in
  stop) stop_preview; exit 0 ;;
  dev)
    [ -d node_modules ] || npm ci
    echo "${c_y}dev server — drafts are visible here and are NOT deployed${c_0}"
    exec npx astro dev --port "$PORT"
    ;;
  prod) ;;
  *) echo "${c_r}unknown mode:${c_0} $MODE   (use: prod | dev | stop)"; exit 2 ;;
esac

[ -d node_modules ] || npm ci
stop_preview

# The build fails on purpose while article bodies are still TODO(copy)
# (scripts/check-copy.mjs). For a local look that is noise, not a finding — the
# deploy workflow never sets this, so production stays protected.
echo "${c_b}building…${c_0} ${c_dim}(ALLOW_TODO_COPY=1 — placeholder copy is a warning locally, a build failure on deploy)${c_0}"
ALLOW_TODO_COPY=1 npm run build

node - "$PORT" <<'NODE' &
// Static server that behaves like GitHub Pages: gzip on text, directory
// indexes, and 404.html (with a real 404 status) for anything unknown.
const http = require('http'), fs = require('fs'), path = require('path'), zlib = require('zlib');
const ROOT = path.join(process.cwd(), 'dist');
const PORT = Number(process.argv[2]);
const TYPES = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript',
  '.json':'application/json', '.xml':'application/xml', '.txt':'text/plain; charset=utf-8',
  '.woff2':'font/woff2', '.png':'image/png', '.svg':'image/svg+xml', '.ico':'image/x-icon',
  '.wasm':'application/wasm', '.webmanifest':'application/manifest+json' };

const send = (req, res, file, status) => {
  const buf = fs.readFileSync(file);
  const type = TYPES[path.extname(file)] || 'application/octet-stream';
  const h = { 'Content-Type': type };
  if (/^(text\/|application\/(json|xml|javascript|manifest))/.test(type)
      && /gzip/.test(req.headers['accept-encoding'] || '')) {
    const gz = zlib.gzipSync(buf);
    res.writeHead(status, { ...h, 'Content-Encoding': 'gzip', 'Content-Length': gz.length });
    return res.end(gz);
  }
  res.writeHead(status, { ...h, 'Content-Length': buf.length });
  res.end(buf);
};

http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const candidates = [
    path.join(ROOT, url),
    path.join(ROOT, url, 'index.html'),
    path.join(ROOT, url.replace(/\/$/, '') + '.html'),
  ];
  for (const f of candidates) {
    try { if (fs.statSync(f).isFile()) return send(req, res, f, 200); } catch {}
  }
  // GitHub Pages serves the ROOT 404.html for every unknown path, including
  // Arabic ones — which is exactly why src/pages/404.astro carries that note.
  try { return send(req, res, path.join(ROOT, '404.html'), 404); } catch {}
  res.writeHead(404); res.end('404');
}).listen(PORT, () => console.error('ready'));
NODE

SRV=$!
mkdir -p .astro
echo "$SRV" > "$PIDFILE"
sleep 1

URL="http://localhost:${PORT}"
cat <<EOF

${c_g}${c_b}serving the built site${c_0} ${c_dim}— gzip + 404 fallback, same as GitHub Pages${c_0}

  ${c_b}$URL/${c_0}                          home
  ${c_dim}$URL/ar/${c_0}                       الصفحة الرئيسية

  $URL/writeups/                 case files      ${c_dim}·${c_0}  $URL/ar/writeups/
  $URL/projects/                 projects        ${c_dim}·${c_0}  $URL/ar/projects/
  $URL/arsenal/                  arsenal         ${c_dim}·${c_0}  $URL/ar/arsenal/
  $URL/journey/                  journey         ${c_dim}·${c_0}  $URL/ar/journey/
  $URL/labs/                     labs            ${c_dim}·${c_0}  $URL/ar/labs/
  $URL/search/                   search          ${c_dim}·${c_0}  $URL/ar/search/
  $URL/about/                    about           ${c_dim}·${c_0}  $URL/ar/about/
  $URL/uses/                     uses            ${c_dim}·${c_0}  $URL/ar/uses/

  ${c_dim}$URL/og/og-default-en.png       the LinkedIn preview image${c_0}
  ${c_dim}$URL/rss.xml  ·  $URL/sitemap-index.xml  ·  $URL/.well-known/security.txt${c_0}
  ${c_dim}$URL/nothing-here              404 page (real 404 status)${c_0}

  ${c_y}press ⌘K / Ctrl+K anywhere${c_0} to open the command palette
  ${c_dim}stop with:  ./run.sh stop${c_0}

EOF

command -v xdg-open >/dev/null && xdg-open "$URL/" >/dev/null 2>&1 || true
wait "$SRV"
