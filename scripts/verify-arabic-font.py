#!/usr/bin/env python3
"""
Verify an IBM Plex Sans Arabic subset keeps its joining behaviour.

This shapes a lam-alef pair and a shadda with HarfBuzz (the same engine
browsers use) and fails if:
  - the lam-alef ligature does not collapse to a single glyph, or
  - the shadda does not get a mark (GPOS) x/y offset.

Run after scripts/subset-fonts.sh:
    python3 scripts/verify-arabic-font.py public/fonts/IBMPlexSansArabic-400-arab.woff2

Requires: pip install fonttools uharfbuzz
"""
import sys

import uharfbuzz as hb
from fontTools.ttLib import woff2


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: verify-arabic-font.py <font.woff2>")
        return 2

    src = sys.argv[1]
    if src.endswith(".woff2"):
        tmp = src + ".ttf"
        woff2.decompress(src, tmp)
        path = tmp
    else:
        path = src

    face = hb.Face(hb.Blob.from_file_path(path))
    font = hb.Font(face)
    font.scale = (face.upem, face.upem)

    def shape(text: str) -> list:
        buf = hb.Buffer()
        buf.add_str(text)
        buf.guess_segment_properties()
        hb.shape(font, buf)  # default features == what browsers apply
        return [(g.codepoint, p.x_offset, p.y_offset) for g, p in zip(buf.glyph_infos, buf.glyph_positions)]

    lamalef = shape("\u0644\u0627")  # لا
    shadda = shape("\u0625\u0646\u0651")  # إنّ

    ok = True
    if len(lamalef) != 1:
        print(f"FAIL: lam-alef shaped to {len(lamalef)} glyphs, expected 1 (ligature)")
        ok = False
    else:
        print(f"ok: lam-alef ligature -> gid {lamalef[0][0]}")

    marks = [m for m in shadda if m[1] or m[2]]
    if not marks:
        print("FAIL: shadda got no mark offset (mark/mkmk GPOS missing?)")
        ok = False
    else:
        print(f"ok: shadda mark offset x={marks[0][1]} y={marks[0][2]}")

    print("PASS" if ok else "FAIL")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
