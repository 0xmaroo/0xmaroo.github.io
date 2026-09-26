#!/usr/bin/env bash
set -euo pipefail

# Fail the build if Pagefind produced an empty index.
# Once `data-pagefind-body` lands (Phase 2), a site with markup in place but no
# content yet would otherwise ship an empty search index silently.
# See plan/08-quality-bar.md §8.6.
INDEX="dist/pagefind/pagefind-entry.json"

if [ ! -f "$INDEX" ]; then
  echo "ERROR: pagefind index missing ($INDEX). Did pagefind run after astro build?" >&2
  exit 1
fi

TOTAL=$(node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('$INDEX', 'utf8'));
const total = Object.values(data.languages || {}).reduce((sum, l) => sum + (l.page_count || 0), 0);
process.stdout.write(String(total));
")

if [ -z "$TOTAL" ] || [ "$TOTAL" -eq 0 ]; then
  echo "ERROR: pagefind index has 0 records — check data-pagefind-body markup." >&2
  exit 1
fi

# The other edge: "not empty" says nothing about "not too much". With zero
# pages carrying data-pagefind-body, Pagefind silently indexes EVERY page
# (404, search, noindex placeholders) — see the writeup
# search-index-leaked-hidden-pages. So the index must hold exactly the pages
# that opted in, and no page may opt in while telling crawlers noindex.
OPTED=$(grep -rlE --include='*.html' '<[a-z][^<>]* data-pagefind-body(=""|[ >])' dist | wc -l)
if [ "$TOTAL" -ne "$OPTED" ]; then
  echo "ERROR: pagefind indexed $TOTAL page(s) but $OPTED carry data-pagefind-body — fallback indexing?" >&2
  exit 1
fi

CONFLICT=$(grep -rlE --include='*.html' '<[a-z][^<>]* data-pagefind-body(=""|[ >])' dist | xargs -r grep -l 'name="robots" content="noindex' || true)
if [ -n "$CONFLICT" ]; then
  echo "ERROR: noindex page(s) opted into search:" >&2
  echo "$CONFLICT" >&2
  exit 1
fi

echo "pagefind: $TOTAL indexed record(s), all opted in, none noindex"
