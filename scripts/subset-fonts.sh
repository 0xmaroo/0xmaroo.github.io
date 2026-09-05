#!/usr/bin/env bash
#
# Regenerate the self-hosted IBM Plex woff2 subsets in public/fonts/.
#
# Prereqs:
#   - pip install fonttools brotli
#   - The source TTFs, downloaded from:
#     https://github.com/IBM/plex  ->  packages/<family>/fonts/complete/ttf/
#   - The Arabic layout features below are REQUIRED. pyftsubset's defaults do not
#     keep the Arabic joining behaviour; without init/medi/fina/rlig/liga the AR
#     side loses its letter forms. mark/mkmk are GPOS features for shadda etc.
#
# After regenerating, verify with the shaping test in scripts/verify-arabic-font.py
# (lam-alef must ligate, shadda must get a mark offset).

set -euo pipefail

SRC_DIR="${1:-.}"            # directory holding the IBMPlex* TTF sources
OUT_DIR="${2:-public/fonts}" # where the woff2 files go

LATIN="U+0000-00FF,U+0100-024F,U+0300-036F,U+2000-206F,U+20A0-20CF,U+2100-214F,U+2190-21FF,U+2200-22FF,U+2300-23FF,U+2500-25FF,U+2600-26FF,U+2B00-2BFF,U+FEFF,U+FFFD"
ARAB="U+0000-00FF,U+0100-024F,U+0300-036F,U+2000-206F,U+20A0-20CF,U+2100-214F,U+2190-21FF,U+2200-22FF,U+2300-23FF,U+2500-25FF,U+2600-26FF,U+0600-06FF,U+0750-077F,U+FB50-FDFF,U+FE70-FEFF"
LATIN_FEATURES="kern,liga,clig,calt"
ARAB_FEATURES="init,medi,fina,isol,rlig,liga,calt,mark,mkmk"

mkdir -p "$OUT_DIR"

subset() {
  pyftsubset "$SRC_DIR/$1" \
    --flavor=woff2 \
    --layout-features="$2" \
    --unicodes="$3" \
    --no-hinting \
    --output-file="$OUT_DIR/$4"
}

subset IBMPlexSans-Regular.ttf      "$LATIN_FEATURES" "$LATIN" IBMPlexSans-400-latin.woff2
subset IBMPlexSans-Medium.ttf       "$LATIN_FEATURES" "$LATIN" IBMPlexSans-500-latin.woff2
subset IBMPlexSans-SemiBold.ttf     "$LATIN_FEATURES" "$LATIN" IBMPlexSans-600-latin.woff2
subset IBMPlexMono-Regular.ttf      "$LATIN_FEATURES" "$LATIN" IBMPlexMono-400-latin.woff2
subset IBMPlexMono-Medium.ttf       "$LATIN_FEATURES" "$LATIN" IBMPlexMono-500-latin.woff2
subset IBMPlexMono-SemiBold.ttf     "$LATIN_FEATURES" "$LATIN" IBMPlexMono-600-latin.woff2
subset IBMPlexMono-Bold.ttf         "$LATIN_FEATURES" "$LATIN" IBMPlexMono-700-latin.woff2
subset IBMPlexSansCondensed-Medium.ttf  "$LATIN_FEATURES" "$LATIN" IBMPlexSansCondensed-500-latin.woff2
subset IBMPlexSansCondensed-SemiBold.ttf "$LATIN_FEATURES" "$LATIN" IBMPlexSansCondensed-600-latin.woff2
subset IBMPlexSansArabic-Regular.ttf    "$ARAB_FEATURES" "$ARAB" IBMPlexSansArabic-400-arab.woff2
subset IBMPlexSansArabic-Medium.ttf     "$ARAB_FEATURES" "$ARAB" IBMPlexSansArabic-500-arab.woff2
subset IBMPlexSansArabic-SemiBold.ttf   "$ARAB_FEATURES" "$ARAB" IBMPlexSansArabic-600-arab.woff2
subset IBMPlexSansArabic-Bold.ttf       "$ARAB_FEATURES" "$ARAB" IBMPlexSansArabic-700-arab.woff2

# Language-switch badge: the single glyph ع (U+0639), nothing else.
#
# The switch and the command palette show the other language's short label on
# every page. Under the bare `[lang='ar']` rule in typography.css that one
# character resolved to the full Arabic family, so every ENGLISH page pulled a
# 38KB face to draw it. This 1.2KB face carries the glyph alone and its
# unicode-range keeps it the only candidate.
#
# An isolated ع has no joining behaviour, so `isol` is the only feature needed —
# none of the init/medi/fina machinery the running-text faces require.
subset IBMPlexSansArabic-SemiBold.ttf "isol" "U+0639" IBMPlexSansArabic-600-badge.woff2
