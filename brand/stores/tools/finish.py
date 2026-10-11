"""Flatten the rendered feature graphics to 24-bit PNG (Google refuses alpha) and make the 512 x 512 Play icons
(32-bit PNG) from the launcher icon sources. Run after build.mjs."""
import os
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
OUT = os.path.join(ROOT, "brand", "stores")
for name in ("plazo-feature-A", "plazo-feature-B", "plazo-pro-feature-A", "plazo-pro-feature-B"):
    raw = os.path.join(OUT, f"{name}.raw.png")
    img = Image.open(raw).convert("RGB")
    assert img.size == (1024, 500), img.size
    img.save(os.path.join(OUT, f"{name}.png"), optimize=True)
    os.remove(raw)
for src, dst in (("app-icon.png", "play-icon-plazo-512.png"), ("app-icon-pro.png", "play-icon-plazo-pro-512.png")):
    img = Image.open(os.path.join(ROOT, "mobile", "assets", "brand", src)).convert("RGBA")
    img = img.resize((512, 512), Image.LANCZOS)
    img.save(os.path.join(OUT, dst), optimize=True)
for f in sorted(os.listdir(OUT)):
    if f.endswith(".png"):
        p = os.path.join(OUT, f); im = Image.open(p)
        print(f, im.size, im.mode, f"{os.path.getsize(p) // 1024} Ko")
