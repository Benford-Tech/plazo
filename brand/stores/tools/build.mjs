// Google Play graphics of Plazo and Plazo Pro (11/10/2026): the feature graphics (1024 x 500) rendered by Chromium
// from the HTML below, then flattened to 24-bit PNG by tools/finish.py, which also makes the 512 x 512 icons.
// Run from site/ (Playwright lives there): `node ../brand/stores/tools/build.mjs && python3 ../brand/stores/tools/finish.py`.
// Fonts: the app's own files (mobile/assets/fonts). Vectors: the launcher foregrounds of brand/app (P + paper plane).
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
// Playwright is a dependency of site/: resolve it from there, wherever this script is run from.
const { chromium } = createRequire(path.join(ROOT, 'site', 'package.json'))('playwright');
const FONTS = path.join(ROOT, 'mobile/assets/fonts');
const OUT = path.join(ROOT, 'brand/stores');
const svg = (file) => readFileSync(path.join(ROOT, 'brand/app', file), 'utf8');
const icon = (file) => 'data:image/png;base64,' + readFileSync(path.join(ROOT, 'mobile/assets/brand', file)).toString('base64');

// The page is set with setContent (about:blank), where file:// fonts are refused: embed them as data URIs.
const font = (file) => `url('data:font/ttf;base64,${readFileSync(path.join(FONTS, file)).toString('base64')}')`;
const fontFaces = `
@font-face { font-family: 'Manrope'; src: ${font('Manrope.ttf')}; font-weight: 100 900; }
@font-face { font-family: 'Playfair Display'; src: ${font('PlayfairDisplay-Italic.ttf')}; font-style: italic; font-weight: 400 900; }
@font-face { font-family: 'Archivo Narrow'; src: ${font('ArchivoNarrow.ttf')}; font-weight: 100 900; }
@font-face { font-family: 'Inter'; src: ${font('Inter.ttf')}; font-weight: 100 900; }
* { margin: 0; box-sizing: border-box; }
html, body { width: 1024px; height: 500px; overflow: hidden; }
.stage { position: relative; width: 1024px; height: 500px; display: flex; align-items: center; }
.mark { position: absolute; }
.mark svg { display: block; }
.tile { border-radius: 54px; box-shadow: 0 30px 60px -30px rgba(44, 26, 14, 0.45); display: block; }
`;

const VARIANTS = {
  // A: what mobile/fiches-stores.md proposes (orange, the P and the plane, one line).
  'plazo-feature-A': `
    <div class="stage" style="background:#FF6600; font-family:'Manrope';">
      <div class="mark" style="left:92px; top:70px; width:360px; height:360px;">${svg('android-foreground.svg').replace('<svg ', '<svg width="360" height="360" ')}</div>
      <div style="position:absolute; left:470px; top:0; height:500px; display:flex; flex-direction:column; justify-content:center; gap:22px; width:500px;">
        <div style="font-family:'Playfair Display'; font-style:italic; font-weight:500; font-size:64px; line-height:1.05; color:#fff; text-wrap:balance;">Votre parking à l'aéroport</div>
        <div style="font-weight:600; font-size:24px; color:rgba(255,255,255,0.88); letter-spacing:0.01em;">Prix total affiché, navette, retour en direct.</div>
      </div>
    </div>`,
  // B: the app's own ground (light grey, white tile, one orange touch), as on the Rechercher tab.
  'plazo-feature-B': `
    <div class="stage" style="background:#ECECEE; font-family:'Manrope';">
      <img class="tile" src="${icon('app-icon.png')}" width="250" height="250" style="position:absolute; left:110px; top:125px;">
      <div style="position:absolute; left:440px; top:0; height:500px; display:flex; flex-direction:column; justify-content:center; gap:20px; width:540px;">
        <div style="font-weight:800; font-size:17px; letter-spacing:0.14em; text-transform:uppercase; color:#6f6a66;">Parking aéroport · Lyon Saint-Exupéry</div>
        <div style="font-family:'Playfair Display'; font-style:italic; font-weight:500; font-size:60px; line-height:1.05; color:#2c1a0e; text-wrap:balance;">Votre parking, du dépôt au retour.</div>
        <div style="display:inline-flex; align-self:flex-start; align-items:center; height:50px; padding:0 24px; border-radius:999px; background:#FF6600; color:#fff; font-weight:800; font-size:20px; box-shadow:0 12px 26px -10px rgba(255,102,0,0.55);">Prix total affiché</div>
      </div>
    </div>`,
  // A: what mobile/fiches-stores.md proposes (lime, dark green text, one line).
  'plazo-pro-feature-A': `
    <div class="stage" style="background:#A3E635; font-family:'Inter';">
      <div class="mark" style="left:92px; top:70px; width:360px; height:360px;">${svg('android-foreground-pro.svg').replace('<svg ', '<svg width="360" height="360" ')}</div>
      <div style="position:absolute; left:470px; top:0; height:500px; display:flex; flex-direction:column; justify-content:center; gap:18px; width:500px;">
        <div style="font-family:'Archivo Narrow'; font-weight:700; font-size:66px; line-height:1.0; color:#0F2A14; text-transform:uppercase; letter-spacing:0.01em; text-wrap:balance;">L'app des équipes de parking</div>
        <div style="font-weight:600; font-size:24px; color:#1E5E2E;">Réservations · places · clés · navette</div>
      </div>
    </div>`,
  // B: the pro ground (light grey-green, white tile, lime action).
  'plazo-pro-feature-B': `
    <div class="stage" style="background:#EEF0EE; font-family:'Inter';">
      <img class="tile" src="${icon('app-icon-pro.png')}" width="250" height="250" style="position:absolute; left:110px; top:125px; box-shadow:0 30px 60px -30px rgba(15,42,20,0.45);">
      <div style="position:absolute; left:440px; top:0; height:500px; display:flex; flex-direction:column; justify-content:center; gap:18px; width:540px;">
        <div style="font-weight:800; font-size:17px; letter-spacing:0.14em; text-transform:uppercase; color:#1E5E2E;">Plazo Pro · parkings partenaires</div>
        <div style="font-family:'Archivo Narrow'; font-weight:700; font-size:62px; line-height:1.0; color:#1A1D1A; text-transform:uppercase; text-wrap:balance;">Arrivées, retours, places et navette</div>
        <div style="display:inline-flex; align-self:flex-start; align-items:center; height:50px; padding:0 24px; border-radius:999px; background:#A3E635; color:#0F2A14; font-weight:800; font-size:20px;">Le travail du jour, au même endroit</div>
      </div>
    </div>`,
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
const page = await browser.newPage({ viewport: { width: 1024, height: 500 }, deviceScaleFactor: 1 });
for (const [name, body] of Object.entries(VARIANTS)) {
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${fontFaces}</style></head><body>${body}</body></html>`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  // A face a variant does not use stays 'unloaded'; only a failed load is a problem.
  const failed = await page.evaluate(() => [...document.fonts].filter((f) => f.status === 'error').map((f) => f.family));
  if (failed.length) throw new Error(`fonts failed to load for ${name}: ${failed.join(', ')}`);
  await page.screenshot({ path: path.join(OUT, `${name}.raw.png`), clip: { x: 0, y: 0, width: 1024, height: 500 } });
  console.log('rendered', name);
}
await browser.close();
