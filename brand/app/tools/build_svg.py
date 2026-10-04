#!/usr/bin/env python3
"""Builds the mobile app's logo SVGs (option L-B, kept for the app on 03/10/2026) with the glyphs converted to paths.

The product name (the wordmark) is read from ../../product.json; the fonts are the app's
Playfair Display (OFL) in mobile/assets/fonts. Run `python3 brand/app/tools/build_svg.py` from
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

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
FONTS = os.path.join(ROOT, "mobile", "assets", "fonts")
OUT = os.path.join(ROOT, "brand", "app")
NAME = json.load(open(os.path.join(ROOT, "product.json"), encoding="utf-8"))["name"]

DARK = "#2c1a0e"     # the dark neutral of the app (no purple since T-A, 03/10/2026)
PEACH = "#f0a36b"   # the app's highlight colour (unused in the logo since O-A)
ORANGE = "#FF6600"  # the plane, inspired by easyJet's orange (choice O-A, 03/10/2026)
WHITE = "#ffffff"

# Geometry (viewBox units). The symbol is a 100 x 100 square, radius 22 % of the side.
S = 100
RADIUS = 22
P_CAP = 52          # cap height of the "P" inside the square
WM_CAP = 58         # cap height of the wordmark
GAP = 20            # space between the square and the wordmark
BASELINE = 76       # shared baseline of the "P" and the wordmark (P centred: 24..76)


def load(name, weight):
    vf = TTFont(os.path.join(FONTS, name))
    return instantiateVariableFont(vf, {"wght": weight}, inplace=True)


def shape(font_path, text, weight):
    """Glyph ids with positions (font units) for `text`, shaped by HarfBuzz at the given weight."""
    blob = hb.Blob.from_file_path(font_path)
    face = hb.Face(blob)
    font = hb.Font(face)
    font.set_variations({"wght": weight})
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


def text_path(font_file, text, weight, cap_height, x, baseline):
    """Path data for `text` with its cap height scaled to `cap_height` and its left edge at `x`."""
    tt = load(font_file, weight)
    upm = tt["head"].unitsPerEm
    cap = tt["OS/2"].sCapHeight
    scale = cap_height / cap
    glyphs, advance = shape(os.path.join(FONTS, font_file), text, weight)
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


def plane_path(cx, cy, size, angle_deg):
    """A paper plane pointing to the right in local units (nose at +x), rotated and moved."""
    import math
    pts_outer = [(26, 0), (-14, -13), (-6, 0), (-14, 13)]      # nose, upper tail, notch, lower tail
    fold = [(-6, 0), (26, 0), (-8, 7)]                        # the lower wing fold, cut out
    a = math.radians(angle_deg)
    def tr(p):
        x, y = p[0] * size / 26, p[1] * size / 26
        return (cx + x * math.cos(a) - y * math.sin(a), cy + x * math.sin(a) + y * math.cos(a))
    def poly(pts):
        return "M" + " L".join(f"{x:.2f} {y:.2f}" for x, y in map(tr, pts)) + " Z"
    return poly(pts_outer), poly(fold)


def rounded_rect_path(x, y, w, h, r):
    return (f"M{x + r} {y} H{x + w - r} A{r} {r} 0 0 1 {x + w} {y + r} V{y + h - r} "
            f"A{r} {r} 0 0 1 {x + w - r} {y + h} H{x + r} A{r} {r} 0 0 1 {x} {y + h - r} "
            f"V{y + r} A{r} {r} 0 0 1 {x + r} {y} Z")


def svg(view_w, view_h, body, title):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {view_w:g} {view_h:g}" '
            f'role="img" aria-label="{title}">\n{body}\n</svg>\n')


def main():
    # The "P": Playfair Display regular, weight 500, centred in the square.
    p_path, pb = text_path("PlayfairDisplay.ttf", "P", 500, P_CAP, 0, BASELINE)
    p_w = pb[2] - pb[0]
    # Optical centre: a touch to the left, the plane adds weight on the right.
    p_x = (S - p_w) / 2 - 1.5
    p_path, pb = text_path("PlayfairDisplay.ttf", "P", 500, P_CAP, p_x, BASELINE)
    # The plane takes off from the top-right corner of the bowl of the P.
    plane_outer, plane_fold = plane_path(pb[2] + 3.5, pb[1] - 1, 15, -40)

    def symbol(bg, fg, plane, x=0, y=0, rounded=True, scale=1.0):
        g = f'<g transform="translate({x:g} {y:g}) scale({scale:g})">' if (x or y or scale != 1) else "<g>"
        rect = (f'<rect width="{S}" height="{S}" rx="{RADIUS}" fill="{bg}"/>' if rounded
                else f'<rect width="{S}" height="{S}" fill="{bg}"/>')
        return (f'{g}\n  {rect}\n  <path d="{p_path}" fill="{fg}"/>\n'
                f'  <path d="{plane_outer} {plane_fold}" fill="{plane}" fill-rule="evenodd"/>\n</g>')

    def symbol_mono(colour, x=0, y=0):
        # One colour for print: the square is filled, the P and the plane are cut out of it.
        d = f"{rounded_rect_path(0, 0, S, S, RADIUS)} {p_path} {plane_outer}"
        return f'<path transform="translate({x:g} {y:g})" d="{d}" fill="{colour}" fill-rule="evenodd"/>'

    wm_x = S + GAP
    wm_path, wb = text_path("PlayfairDisplay-Italic.ttf", NAME, 500, WM_CAP, wm_x, BASELINE)
    total_w = round(wb[2] + 2)   # the italic "o" overhangs a little

    def wordmark(colour, x=0):
        return f'<path transform="translate({x:g} 0)" d="{wm_path}" fill="{colour}"/>'

    files = {
        "logo-horizontal-light.svg": svg(total_w, S, symbol(ORANGE, WHITE, DARK) + "\n" + wordmark(DARK), NAME),
        "logo-horizontal-dark.svg": svg(total_w, S, symbol(WHITE, ORANGE, ORANGE) + "\n" + wordmark(WHITE), NAME),
        "logo-mono.svg": svg(total_w, S, symbol_mono(DARK) + "\n" + wordmark(DARK), NAME),
        "symbol.svg": svg(S, S, symbol(ORANGE, WHITE, DARK), NAME),
        "symbol-dark.svg": svg(S, S, symbol(WHITE, ORANGE, ORANGE), NAME),
        "symbol-mono.svg": svg(S, S, symbol_mono(DARK), NAME),
        "wordmark.svg": svg(round(wb[2] - wm_x + 2), S, wordmark(DARK, -wm_x), NAME),
        "favicon.svg": svg(S, S, symbol(ORANGE, WHITE, DARK), NAME),
        # Maskable icon (choice O-B): orange full bleed, white P and prune plane inside the inner 80 % safe circle.
        "icon-maskable.svg": svg(S, S,
            f'<rect width="{S}" height="{S}" fill="{ORANGE}"/>\n'
            + symbol("none", WHITE, DARK, x=S * 0.1, y=S * 0.1, rounded=False, scale=0.8), NAME),
        # Android adaptive foreground: transparent; flutter_launcher_icons insets it by 16 %, so the
        # glyphs are drawn at 92 % here to land in the inner ~66 % of the 108 dp layer.
        "android-foreground.svg": svg(S, S,
            symbol("none", WHITE, DARK, x=S * 0.04, y=S * 0.04, rounded=False, scale=0.92), NAME),
        # "Plazo Pro" app icon (A-B, 04/10/2026): the same mark, inverted — dark brown full bleed,
        # white P, orange plane — so the two apps tell apart on a home screen.
        "icon-maskable-pro.svg": svg(S, S,
            f'<rect width="{S}" height="{S}" fill="{DARK}"/>\n'
            + symbol("none", WHITE, ORANGE, x=S * 0.1, y=S * 0.1, rounded=False, scale=0.8), NAME + " Pro"),
        "android-foreground-pro.svg": svg(S, S,
            symbol("none", WHITE, ORANGE, x=S * 0.04, y=S * 0.04, rounded=False, scale=0.92), NAME + " Pro"),
        # Social card 1200 x 630: the dark logo on prune.
        "social-card.svg": svg(1200, 630,
            f'<rect width="1200" height="630" fill="{ORANGE}"/>\n'
            f'<g transform="translate({(1200 - total_w * 2.6) / 2:.1f} {(630 - S * 2.6) / 2:.1f}) scale(2.6)">\n'
            + symbol(WHITE, ORANGE, ORANGE) + "\n" + wordmark(WHITE) + "\n</g>", NAME),
    }
    for name, content in files.items():
        with open(os.path.join(OUT, name), "w", encoding="utf-8") as f:
            f.write(content)
        print("wrote", name)
    print("P bounds", [round(v, 1) for v in pb], "wordmark bounds", [round(v, 1) for v in wb], "width", total_w)


if __name__ == "__main__":
    main()
