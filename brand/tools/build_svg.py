#!/usr/bin/env python3
"""Builds the Plazo logo SVGs (option E-A, the parking sign) with the glyphs converted to paths.

The product name (the wordmark) is read from ../../product.json; the font is the app's Inter
(OFL, variable) in mobile/assets/fonts, at weight 800 like the "P" of a parking sign. Run `python3 brand/tools/build_svg.py` from
the repository root after a change of name or geometry, then `node brand/tools/export_png.mjs`.
Requires: pip install fonttools uharfbuzz
"""
import json
import os
import re
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
FONTS = os.path.join(ROOT, "mobile", "assets", "fonts")
OUT = os.path.join(ROOT, "brand")
NAME = json.load(open(os.path.join(ROOT, "product.json"), encoding="utf-8"))["name"]

DARK = "#2c1a0e"     # the dark neutral (no purple since 03/10/2026): mono variant, letters alone, social card
PEACH = "#f0a36b"
ORANGE = "#FF6600"  # easyJet-inspired orange: the sign's colour (choice O-D, 03/10/2026)
WHITE = "#ffffff"

# Geometry (viewBox units). The sign is 100 high, its corners 17 % of the height; the symbol
# (icons, favicon) is the same sign reduced to its "P", a 100 x 100 square.
S = 100
RADIUS = 17
P_CAP = 58          # cap height of the "P" inside the square (centred: 21..79)
WM_CAP = 56         # cap height of the wordmark inside the sign (centred: 22..78)
PAD = 24            # space between the sign's edge and the wordmark
TRACKING = -0.03    # letter spacing of the wordmark, in em (tight, like a road sign)
WEIGHT = 800
OPSZ = 32           # Inter's optical size axis: display cut
FONT = "Inter.ttf"


def load(name, weight):
    vf = TTFont(os.path.join(FONTS, name))
    axes = {"wght": weight}
    if "fvar" in vf and any(a.axisTag == "opsz" for a in vf["fvar"].axes):
        axes["opsz"] = OPSZ
    return instantiateVariableFont(vf, axes, inplace=True)


def shape(font_path, text, weight):
    """Glyph ids with positions (font units) for `text`, shaped by HarfBuzz at the given weight."""
    blob = hb.Blob.from_file_path(font_path)
    face = hb.Face(blob)
    font = hb.Font(face)
    font.set_variations({"wght": weight, "opsz": OPSZ})
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(font, buf, {"kern": True, "liga": True})
    x = 0
    out = []
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        out.append((info.codepoint, x + pos.x_offset, pos.y_offset))
        x += pos.x_advance
    return out, x


def glyph_path(tt, gid, scale, dx, dy):
    """SVG path data of glyph `gid`, scaled to viewBox units, y flipped, moved by (dx, dy)."""
    glyph_set = tt.getGlyphSet()
    name = tt.getGlyphOrder()[gid]
    pen = SVGPathPen(glyph_set, ntos=lambda v: f"{v:.2f}".rstrip("0").rstrip("."))
    glyph_set[name].draw(TransformPen(pen, (scale, 0, 0, -scale, dx, dy)))
    return pen.getCommands()


def glyph_bounds(tt, gid):
    glyph_set = tt.getGlyphSet()
    pen = BoundsPen(glyph_set)
    glyph_set[tt.getGlyphOrder()[gid]].draw(pen)
    return pen.bounds


def text_path(font_file, text, weight, cap_height, x, baseline, tracking=0.0):
    """Path data for `text` with its cap height scaled to `cap_height`, its left edge at `x` and
    `tracking` em added between the letters."""
    tt = load(font_file, weight)
    upm = tt["head"].unitsPerEm
    cap = tt["OS/2"].sCapHeight
    scale = cap_height / cap
    glyphs, advance = shape(os.path.join(FONTS, font_file), text, weight)
    glyphs = [(gid, gx + i * tracking * upm, gy) for i, (gid, gx, gy) in enumerate(glyphs)]
    # Align the first glyph's ink (not its side bearing) on x.
    left = glyph_bounds(tt, glyphs[0][0])[0] + glyphs[0][1]
    parts = []
    xmin, xmax, ymin, ymax = 1e9, -1e9, 1e9, -1e9
    for gid, gx, gy in glyphs:
        dx = x + (gx - left) * scale
        dy = baseline - gy * scale
        parts.append(glyph_path(tt, gid, scale, dx, dy))
        b = glyph_bounds(tt, gid)
        xmin = min(xmin, dx + b[0] * scale); xmax = max(xmax, dx + b[2] * scale)
        ymin = min(ymin, dy - b[3] * scale); ymax = max(ymax, dy - b[1] * scale)
    return " ".join(parts), (xmin, ymin, xmax, ymax)


def rounded_rect_path(x, y, w, h, r):
    return (f"M{x + r} {y} H{x + w - r} A{r} {r} 0 0 1 {x + w} {y + r} V{y + h - r} "
            f"A{r} {r} 0 0 1 {x + w - r} {y + h} H{x + r} A{r} {r} 0 0 1 {x} {y + h - r} "
            f"V{y + r} A{r} {r} 0 0 1 {x + r} {y} Z")


def svg(view_w, view_h, body, title):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {view_w:g} {view_h:g}" '
            f'role="img" aria-label="{title}">\n{body}\n</svg>\n')


def main():
    # The symbol: the sign reduced to its "P" (Inter 800), centred in the square.
    p_path, pb = text_path(FONT, "P", WEIGHT, P_CAP, 0, (S + P_CAP) / 2)
    p_x = (S - (pb[2] - pb[0])) / 2
    p_path, pb = text_path(FONT, "P", WEIGHT, P_CAP, p_x, (S + P_CAP) / 2)

    def symbol(bg, fg, x=0, y=0, rounded=True, scale=1.0):
        g = f'<g transform="translate({x:g} {y:g}) scale({scale:g})">' if (x or y or scale != 1) else "<g>"
        rect = ("" if bg == "none" else
                f'<rect width="{S}" height="{S}" rx="{RADIUS}" fill="{bg}"/>' if rounded
                else f'<rect width="{S}" height="{S}" fill="{bg}"/>')
        return f'{g}\n  {rect}\n  <path d="{p_path}" fill="{fg}"/>\n</g>'

    def symbol_mono(colour, x=0, y=0):
        # One colour for print: the square is filled, the P is cut out of it.
        d = f"{rounded_rect_path(0, 0, S, S, RADIUS)} {p_path}"
        return f'<path transform="translate({x:g} {y:g})" d="{d}" fill="{colour}" fill-rule="evenodd"/>'

    # The sign: the whole name inside one rounded rectangle.
    wm_path, wb = text_path(FONT, NAME, WEIGHT, WM_CAP, PAD, (S + WM_CAP) / 2, TRACKING)
    total_w = round(wb[2] + PAD)

    def sign(bg, fg):
        return (f'<rect width="{total_w}" height="{S}" rx="{RADIUS}" fill="{bg}"/>\n'
                f'<path d="{wm_path}" fill="{fg}"/>')

    def sign_mono(colour):
        d = f"{rounded_rect_path(0, 0, total_w, S, RADIUS)} {wm_path}"
        return f'<path d="{d}" fill="{colour}" fill-rule="evenodd"/>'

    def wordmark(colour, x=0, y=0):
        return f'<path transform="translate({x:g} {y:g})" d="{wm_path}" fill="{colour}"/>'

    # The letters alone, cropped to their ink (a touch of air around them).
    wm_w, wm_h = round(wb[2] - wb[0] + 2), round(wb[3] - wb[1] + 2)

    files = {
        "logo-horizontal-light.svg": svg(total_w, S, sign(ORANGE, WHITE), NAME),
        "logo-horizontal-dark.svg": svg(total_w, S, sign(ORANGE, WHITE), NAME),
        "logo-mono.svg": svg(total_w, S, sign_mono(DARK), NAME),
        "symbol.svg": svg(S, S, symbol(ORANGE, WHITE), NAME),
        "symbol-dark.svg": svg(S, S, symbol(ORANGE, WHITE), NAME),
        "symbol-mono.svg": svg(S, S, symbol_mono(DARK), NAME),
        "wordmark.svg": svg(wm_w, wm_h, wordmark(DARK, -wb[0] + 1, -wb[1] + 1), NAME),
        "wordmark-dark.svg": svg(wm_w, wm_h, wordmark(WHITE, -wb[0] + 1, -wb[1] + 1), NAME),
        "favicon.svg": svg(S, S, symbol(ORANGE, WHITE), NAME),
        # Maskable icon: full bleed, the P inside the inner 80 % safe circle.
        "icon-maskable.svg": svg(S, S,
            f'<rect width="{S}" height="{S}" fill="{ORANGE}"/>\n'
            + symbol("none", WHITE, x=S * 0.1, y=S * 0.1, rounded=False, scale=0.8), NAME),
        # Android adaptive foreground: transparent; flutter_launcher_icons insets it by 16 %, so the
        # P is drawn at 92 % here to land in the inner ~66 % of the 108 dp layer.
        "android-foreground.svg": svg(S, S,
            symbol("none", WHITE, x=S * 0.04, y=S * 0.04, rounded=False, scale=0.92), NAME),
        # Social card 1200 x 630: the orange sign on dark brown.
        "social-card.svg": svg(1200, 630,
            f'<rect width="1200" height="630" fill="{DARK}"/>\n'
            f'<g transform="translate({(1200 - total_w * 2.6) / 2:.1f} {(630 - S * 2.6) / 2:.1f}) scale(2.6)">\n'
            + sign(ORANGE, WHITE) + "\n</g>", NAME),
    }
    for name, content in files.items():
        with open(os.path.join(OUT, name), "w", encoding="utf-8") as f:
            f.write(content)
        print("wrote", name)
    print("P bounds", [round(v, 1) for v in pb], "wordmark bounds", [round(v, 1) for v in wb], "width", total_w)


if __name__ == "__main__":
    main()
