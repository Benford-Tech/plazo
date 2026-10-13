// App Store creative assets of Plazo and Plazo Pro (13/10/2026: App Store Connect asks for a product page header and a
// search results image). Style A, as the marketing images (brand colour full bleed, heavy title): the icon and the title
// sit in Apple's centred safe area, two phones with real screenshots on the sides are mood that may be cropped.
//
//   cd site && node ../brand/stores/tools/creative.mjs            (both apps, both placements)
//   SAFE=1 node ../brand/stores/tools/creative.mjs               (draws the safe areas, to check the layout)
//
// Output: brand/stores/creative/<app>/{header-3840x1646,search-3840x2560}.png (OUT to change the folder), opaque PNG.
// Sizes from Apple's « Creative assets specifications »: header 21:9, 3840 x 1646; search results 3:2, up to 3840 x 2560.
// Safe areas from Apple's templates as read by third parties (Apple does not publish them in text): header 1646 x 661 and
// search 2168 x 1030, both centred. No price, no address, nothing the apps do not do (fiches-stores.md).
import { mkdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const { chromium } = createRequire(path.join(ROOT, 'site', 'package.json'))(process.env.PLAYWRIGHT || 'playwright');
const FONTS = path.join(ROOT, 'mobile/assets/fonts');
const SHOTS = path.join(ROOT, 'brand/stores/screenshots');
const OUT = path.resolve(process.env.OUT || path.join(ROOT, 'brand/stores/creative'));
const SAFE = process.env.SAFE === '1';

const font = (file) => `url('data:font/ttf;base64,${readFileSync(path.join(FONTS, file)).toString('base64')}')`;
const png = (file) => 'data:image/png;base64,' + readFileSync(file).toString('base64');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const PLACEMENTS = {
  header: { width: 3840, height: 1646, safe: { width: 1646, height: 661 }, file: 'header-3840x1646.png' },
  search: { width: 3840, height: 2560, safe: { width: 2168, height: 1030 }, file: 'search-3840x2560.png' },
};

const APPS = {
  plazo: {
    folder: 'plazo',
    icon: 'mobile/assets/brand/app-icon.png',
    bg: '#FF6600', glow: 'rgba(255,170,110,0.55)', title: '#FFFFFF', sub: '#2C1A0E', frame: '#1C1210', shadow: 'rgba(90,30,0,0.45)',
    titleFont: "'Manrope'", titleWeight: 800, titleCase: 'none', titleShadow: '0 6px 28px rgba(110,35,0,0.35)', bodyFont: "'Manrope'",
    lines: ['Votre parking', 'à l’aéroport'],
    sub: 'Prix total affiché, navette, retour en direct.',
    shots: ['01-rechercher', '06-jour-du-retour'],
  },
  pro: {
    folder: 'plazo-pro',
    icon: 'mobile/assets/brand/app-icon-pro.png',
    bg: '#A3E635', glow: 'rgba(225,255,170,0.6)', title: '#0F2A14', sub: '#0F2A14', frame: '#0F2A14', shadow: 'rgba(15,42,20,0.4)',
    titleFont: "'Archivo Narrow'", titleWeight: 700, titleCase: 'uppercase', titleShadow: 'none', bodyFont: "'Inter'",
    lines: ['L’app des équipes', 'de parking'],
    sub: 'Réservations · places · clés · navette',
    shots: ['01-tableau-de-bord', '05-ma-tournee'],
  },
};

const fontFaces = `
@font-face { font-family: 'Manrope'; src: ${font('Manrope.ttf')}; font-weight: 200 800; }
@font-face { font-family: 'Inter'; src: ${font('Inter.ttf')}; font-weight: 100 900; }
@font-face { font-family: 'Archivo Narrow'; src: ${font('ArchivoNarrow.ttf')}; font-weight: 400 700; }
* { margin: 0; padding: 0; box-sizing: border-box; }
`;

/** A phone with a screenshot (440 x 956 points under a 30-point status bar), `w` pixels wide. */
function phone(app, shot, w, style) {
  const bezel = w * 0.032;
  const screenW = w - bezel * 2;
  const statusH = screenW * (30 / 440);
  const shotH = screenW * (956 / 440);
  const radius = w * 0.13;
  return `<div class="phone" style="${style}; width:${w}px; height:${statusH + shotH + bezel * 2}px; border-radius:${radius}px; padding:${bezel}px; background:${app.frame}; box-shadow: 0 ${w * 0.08}px ${w * 0.16}px -${w * 0.05}px ${app.shadow};">
    <div style="position:relative; width:100%; height:100%; border-radius:${radius - bezel}px; overflow:hidden; background:#fff;">
      <div style="position:absolute; top:${statusH * 0.18}px; left:50%; width:${screenW * 0.28}px; height:${statusH * 0.64}px; margin-left:-${screenW * 0.14}px; border-radius:999px; background:#000;"></div>
      <div style="height:${statusH}px"></div>
      <img src="${shot}" style="display:block; width:${screenW}px; height:${shotH}px;">
    </div></div>`;
}

function pageHtml(app, placement) {
  const { width: W, height: H, safe } = placement;
  const isHeader = placement === PLACEMENTS.header;
  const shots = app.shots.map((s) => png(path.join(SHOTS, app.folder, 'app-store', `${s}.png`)));
  const iconSize = isHeader ? 250 : 300;
  const titleSize = isHeader ? (app.titleCase === 'uppercase' ? 132 : 128) : app.titleCase === 'uppercase' ? 156 : 150;
  const subSize = isHeader ? 0 : 66;
  // Phones on both sides, in the mood area outside the safe area; they may be cropped.
  const phoneW = isHeader ? 760 : 820;
  const top = isHeader ? 230 : 560;
  const sideX = isHeader ? 210 : -40;
  const left = phone(app, shots[0], phoneW, `position:absolute; left:${sideX}px; top:${top}px; transform: rotate(-8deg)`);
  const right = phone(app, shots[1], phoneW, `position:absolute; right:${sideX}px; top:${top}px; transform: rotate(8deg)`);
  const safeBox = SAFE
    ? `<div style="position:absolute; left:${(W - safe.width) / 2}px; top:${(H - safe.height) / 2}px; width:${safe.width}px; height:${safe.height}px; outline: 8px dashed rgba(0,0,255,0.8); z-index:5;"></div>`
    : '';
  return `<!doctype html><html><head><meta charset="utf-8"><style>${fontFaces}
html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: ${app.bg}; }
.stage { position: relative; width: ${W}px; height: ${H}px; overflow: hidden;
  background: radial-gradient(ellipse ${safe.width * 1.1}px ${safe.height * 1.25}px at 50% 50%, ${app.glow}, transparent 70%), ${app.bg}; }
.center { position: absolute; left: ${(W - safe.width) / 2}px; top: ${(H - safe.height) / 2}px; width: ${safe.width}px; height: ${safe.height}px;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: ${isHeader ? 34 : 44}px; text-align: center; z-index: 2; }
.icon { width: ${iconSize}px; height: ${iconSize}px; border-radius: ${iconSize * 0.225}px; box-shadow: 0 0 0 ${iconSize * 0.035}px rgba(255,255,255,0.75), 0 30px 60px -24px ${app.shadow}; }
h1 { font-family: ${app.titleFont}, sans-serif; font-weight: ${app.titleWeight}; text-transform: ${app.titleCase}; font-size: ${titleSize}px;
  line-height: 1.02; letter-spacing: ${app.titleCase === 'uppercase' ? '0.005em' : '-0.02em'}; color: ${app.title}; text-shadow: ${app.titleShadow}; white-space: nowrap; }
p { font: 700 ${subSize}px/1.2 ${app.bodyFont}, sans-serif; color: ${app.sub}; white-space: nowrap; }
</style></head><body><div class="stage">
  ${left}${right}
  <div class="center">
    <img class="icon" src="${png(path.join(ROOT, app.icon))}">
    <h1>${app.lines.map(esc).join('<br>')}</h1>
    ${subSize ? `<p>${esc(app.sub)}</p>` : ''}
  </div>
  ${safeBox}
</div></body></html>`;
}

const pick = (env, all) => (process.env[env] ? process.env[env].split(',').map((s) => s.trim()).filter(Boolean) : all);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
let count = 0;
for (const key of pick('APPS', Object.keys(APPS))) {
  const app = APPS[key];
  const dir = path.join(OUT, app.folder);
  mkdirSync(dir, { recursive: true });
  for (const name of pick('PLACEMENTS', Object.keys(PLACEMENTS))) {
    const placement = PLACEMENTS[name];
    const page = await browser.newPage({ viewport: { width: placement.width, height: placement.height }, deviceScaleFactor: 1 });
    await page.setContent(pageHtml(app, placement), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    // The title and the line under it must stay inside the safe area.
    const overflow = await page.evaluate(() => {
      const box = document.querySelector('.center').getBoundingClientRect();
      return [...document.querySelectorAll('.center > *')].some((el) => {
        const r = el.getBoundingClientRect();
        return r.left < box.left - 1 || r.right > box.right + 1 || r.top < box.top - 1 || r.bottom > box.bottom + 1;
      });
    });
    if (overflow) console.warn(`outside the safe area: ${key}/${name}`);
    await page.screenshot({ path: path.join(dir, SAFE ? placement.file.replace('.png', '-safe.png') : placement.file) });
    await page.close();
    count++;
  }
}
await browser.close();
console.log(`${count} images in ${OUT}`);
