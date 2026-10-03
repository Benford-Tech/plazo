// Renders the app's brand SVGs to PNG with Chromium (Playwright). Run from the repository root:
//   node brand/app/tools/export_png.mjs [path/to/playwright] [chromium executable]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require(process.argv[2] || 'playwright');
const executablePath = process.argv[3] || process.env.CHROMIUM || undefined;
const brand = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
fs.mkdirSync(path.join(brand, 'png'), { recursive: true });

// [svg, output, size, transparent?]
const jobs = [
  ['symbol.svg', 'png/symbol-512.png', 512, true],
  ['icon-maskable.svg', 'png/app-icon-1024.png', 1024, false],
  ['android-foreground.svg', 'png/android-foreground-1024.png', 1024, true],
  ['icon-maskable.svg', 'icon-192.png', 192, false],
];

const browser = await chromium.launch({ executablePath });
for (const [svg, out, size, transparent] of jobs) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  const data = fs.readFileSync(path.join(brand, svg), 'utf8');
  await page.setContent(`<!doctype html><html><body style="margin:0;background:${transparent ? 'transparent' : '#fff'}">
    <img src="data:image/svg+xml;base64,${Buffer.from(data).toString('base64')}" width="${size}" height="${size}" style="display:block"></body></html>`);
  await page.screenshot({ path: path.join(brand, out), omitBackground: transparent });
  await page.close();
  console.log('wrote', out);
}
await browser.close();
