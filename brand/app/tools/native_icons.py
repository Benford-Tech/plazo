#!/usr/bin/env python3
"""Writes the app's launcher icons from brand/app/png without the Flutter SDK.

Same files as `dart run flutter_launcher_icons` (and `-f flutter_launcher_icons-pro.yaml`) would write:
the copies in mobile/assets/brand, the Android mipmaps and adaptive foregrounds of the main and pro
flavors, the two iOS icon sets (sizes read from their Contents.json) and the web icons. Requires Pillow.
Run from the repository root after `node brand/app/tools/export_png.mjs`.
"""
import json
import os
import shutil
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
PNG = os.path.join(ROOT, "brand", "app", "png")
MOBILE = os.path.join(ROOT, "mobile")
ANDROID_RES = os.path.join(MOBILE, "android", "app", "src", "{flavor}", "res")
LAUNCHER = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}        # 48 dp
FOREGROUND = {"mdpi": 108, "hdpi": 162, "xhdpi": 216, "xxhdpi": 324, "xxxhdpi": 432}  # 108 dp adaptive layer
WEB = {"icons/Icon-192.png": 192, "icons/Icon-512.png": 512, "icons/Icon-maskable-192.png": 192,
       "icons/Icon-maskable-512.png": 512, "favicon.png": 16}


def resized(src, size, mode):
    im = Image.open(src)
    if mode == "RGB" and im.mode != "RGB":
        flat = Image.new("RGB", im.size, (255, 255, 255))
        flat.paste(im, mask=im.split()[-1] if im.mode in ("RGBA", "LA") else None)
        im = flat
    elif mode == "RGBA":
        im = im.convert("RGBA")
    return im.resize((size, size), Image.LANCZOS) if im.size != (size, size) else im


def write(src, dest, size, mode):
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    resized(src, size, mode).save(dest, optimize=True)
    print("wrote", os.path.relpath(dest, ROOT), size)


def android(flavor, icon, foreground):
    res = ANDROID_RES.format(flavor=flavor)
    for density, size in LAUNCHER.items():
        write(icon, os.path.join(res, f"mipmap-{density}", "ic_launcher.png"), size, "RGB")
    for density, size in FOREGROUND.items():
        write(foreground, os.path.join(res, f"drawable-{density}", "ic_launcher_foreground.png"), size, "RGBA")


def ios(appiconset, icon):
    folder = os.path.join(MOBILE, "ios", "Runner", "Assets.xcassets", appiconset)
    with open(os.path.join(folder, "Contents.json"), encoding="utf-8") as f:
        images = json.load(f)["images"]
    done = set()
    for image in images:
        name = image["filename"]
        if name in done:
            continue
        done.add(name)
        points = float(image["size"].split("x")[0])
        scale = int(image["scale"].rstrip("x"))
        write(icon, os.path.join(folder, name), round(points * scale), "RGB")  # iOS icons carry no alpha


def main():
    icon = os.path.join(PNG, "app-icon-1024.png")
    icon_pro = os.path.join(PNG, "app-icon-pro-1024.png")
    fg = os.path.join(PNG, "android-foreground-1024.png")
    fg_pro = os.path.join(PNG, "android-foreground-pro-1024.png")
    assets = os.path.join(MOBILE, "assets", "brand")
    for src, name in [(icon, "app-icon.png"), (icon_pro, "app-icon-pro.png"),
                      (fg, "app-icon-foreground.png"), (fg_pro, "app-icon-pro-foreground.png")]:
        shutil.copyfile(src, os.path.join(assets, name))
        print("copied", name)
    android("main", icon, fg)
    android("pro", icon_pro, fg_pro)
    ios("AppIcon.appiconset", icon)
    ios("AppIcon-pro.appiconset", icon_pro)
    for name, size in WEB.items():
        write(icon, os.path.join(MOBILE, "web", name), size, "RGB")


if __name__ == "__main__":
    main()
