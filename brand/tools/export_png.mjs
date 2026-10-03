// Renders the brand SVGs to PNG with Chromium (Playwright). Run from the repository root:
//   node brand/tools/export_png.mjs [path/to/playwright] [chromium executable]
// Writes brand/png/* and the favicons in brand/.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const pwPath = process.argv[2] || 'playwright';
const executablePath = process.argv[3] || process.env.CHROMIUM || undefined;
const { chromium } = require(pwPath);
const brand = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const png = path.join(brand, 'png');
fs.mkdirSync(png, { recursive: true });

// [svg, output, width, height, transparent?]
const jobs = [
  ['logo-horizontal-light.svg', 'png/logo-horizontal-light@1x.png', 317, 100, true],
  ['logo-horizontal-light.svg', 'png/logo-horizontal-light@2x.png', 634, 200, true],
  ['logo-horizontal-light.svg', 'png/logo-horizontal-light@4x.png', 1268, 400, true],
  ['logo-horizontal-dark.svg', 'png/logo-horizontal-dark@1x.png', 317, 100, true],
  ['logo-horizontal-dark.svg', 'png/logo-horizontal-dark@2x.png', 634, 200, true],
  ['logo-horizontal-dark.svg', 'png/logo-horizontal-dark@4x.png', 1268, 400, true],
  ['logo-mono.svg', 'png/logo-mono@2x.png', 634, 200, true],
  ['symbol.svg', 'png/symbol-512.png', 512, 512, true],
  ['symbol.svg', 'png/symbol-1024.png', 1024, 1024, true],
  ['symbol-dark.svg', 'png/symbol-dark-512.png', 512, 512, true],
  ['social-card.svg', 'png/social-card-1200x630.png', 1200, 630, false],
  ['favicon.svg', 'favicon-32.png', 32, 32, true],
  ['favicon.svg', 'favicon-180.png', 180, 180, false],
  ['icon-maskable.svg', 'icon-192.png', 192, 192, false],
  ['icon-maskable.svg', 'icon-512.png', 512, 512, false],
  ['icon-maskable.svg', 'png/app-icon-1024.png', 1024, 1024, false],
  ['android-foreground.svg', 'png/android-foreground-1024.png', 1024, 1024, true],
];

const browser = await chromium.launch({ executablePath });
for (const [svg, out, w, h, transparent] of jobs) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const data = fs.readFileSync(path.join(brand, svg), 'utf8');
  await page.setContent(`<!doctype html><html><body style="margin:0;background:${transparent ? 'transparent' : '#fff'}">
    <img src="data:image/svg+xml;base64,${Buffer.from(data).toString('base64')}" width="${w}" height="${h}" style="display:block"></body></html>`);
  await page.screenshot({ path: path.join(brand, out), omitBackground: transparent, clip: { x: 0, y: 0, width: w, height: h } });
  await page.close();
  console.log('wrote', out);
}
await browser.close();
