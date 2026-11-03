// Plazo Pro launch screen, direction A « Citron » (02/11/2026): the login screen's wordmark (name in lime on a dark
// green plate, « PRO » beside it) centred on lime, « by <company> » at the bottom. Renders the native images:
//   Android (flavor pro): drawable-*dpi/splash_wordmark.png (Android ≤ 11, layer-list), splash_icon.png (Android 12+
//   animated icon, 288 dp with the wordmark inside the 192 dp circle), splash_branding.png (Android 12+ branding, 200 × 80 dp);
//   iOS: Assets.xcassets/LaunchPro.imageset and LaunchProBy.imageset (@1x, @2x, @3x), used by LaunchScreenPro.storyboard.
// Name and company come from product.json. Run from the repo root: node brand/app/tools/splash_pro.mjs
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const { chromium } = createRequire(path.join(ROOT, 'site', 'package.json'))('playwright');
const FONTS = path.join(ROOT, 'mobile/assets/fonts');
const product = JSON.parse(readFileSync(path.join(ROOT, 'product.json'), 'utf8'));
const font = (file) => `url('data:font/ttf;base64,${readFileSync(path.join(FONTS, file)).toString('base64')}')`;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

const LIME = '#A3E635';
const DEEP = '#1E5E2E';

const page = (body) => `<!doctype html><html><head><style>
@font-face{font-family:Inter;src:${font('Inter.ttf')};font-weight:100 900}
@font-face{font-family:Narrow;src:${font('ArchivoNarrow.ttf')};font-weight:400 700}
html,body{margin:0;background:transparent}
#box{display:inline-flex;align-items:center;justify-content:center}
.mark{display:inline-flex;align-items:center;gap:10px}
.plate{background:${DEEP};border-radius:10px;padding:6px 14px;font:800 30px/1.1 Inter;letter-spacing:-0.4px;color:${LIME}}
.pro{font:700 26px/1 Narrow;letter-spacing:0.3px;color:${DEEP}}
.by{font:500 13px/1 Inter;letter-spacing:1px;color:${DEEP}}
.by b{font-weight:700}
</style></head><body>${body}</body></html>`;

const MARK = `<div class="mark"><div class="plate">${esc(product.name)}</div><div class="pro">PRO</div></div>`;
const BY = `<div class="by">by <b>${esc(product.company.name)}</b></div>`;

// Each image: its CSS (dp / pt) box and content.
const IMAGES = {
  wordmark: { body: `<div id="box">${MARK}</div>` },
  icon: { body: `<div id="box" style="width:288px;height:288px"><div style="transform:none">${MARK}</div></div>` },
  branding: { body: `<div id="box" style="width:200px;height:80px">${BY}</div>` },
  by: { body: `<div id="box">${BY}</div>` },
};

const ANDROID = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
const IOS = { '': 1, '@2x': 2, '@3x': 3 };

const browser = await chromium.launch();
const shot = async (name, scale) => {
  const ctx = await browser.newContext({ deviceScaleFactor: scale });
  const tab = await ctx.newPage();
  await tab.setContent(page(IMAGES[name].body));
  await tab.evaluate(() => document.fonts.ready);
  const png = await tab.locator('#box').screenshot({ omitBackground: true });
  await ctx.close();
  return png;
};

const res = path.join(ROOT, 'mobile/android/app/src/pro/res');
for (const [dir, scale] of Object.entries(ANDROID)) {
  mkdirSync(path.join(res, `drawable-${dir}`), { recursive: true });
  for (const [name, file] of [['wordmark', 'splash_wordmark'], ['icon', 'splash_icon'], ['branding', 'splash_branding']]) {
    writeFileSync(path.join(res, `drawable-${dir}`, `${file}.png`), await shot(name, scale));
  }
}

const assets = path.join(ROOT, 'mobile/ios/Runner/Assets.xcassets');
for (const [set, name] of [['LaunchPro', 'wordmark'], ['LaunchProBy', 'by']]) {
  const dir = path.join(assets, `${set}.imageset`);
  mkdirSync(dir, { recursive: true });
  const images = [];
  for (const [suffix, scale] of Object.entries(IOS)) {
    writeFileSync(path.join(dir, `${set}${suffix}.png`), await shot(name, scale));
    images.push({ idiom: 'universal', filename: `${set}${suffix}.png`, scale: `${scale}x` });
  }
  writeFileSync(path.join(dir, 'Contents.json'), JSON.stringify({ images, info: { version: 1, author: 'xcode' } }, null, 2) + '\n');
}

await browser.close();
console.log('Plazo Pro launch screen images written.');
