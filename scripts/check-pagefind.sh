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

echo "pagefind: $TOTAL indexed record(s)"
