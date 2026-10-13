// Store marketing images of Plazo and Plazo Pro (13/10/2026, « il faut plutôt des images d'illustration commerciale »):
// each real screenshot of brand/stores/screenshots/*/app-store/ (iPhone 6,9") set in a drawn phone, under a headline,
// rendered by Chromium at the store sizes. Two looks for Joanny's choice (STYLE): `A` brand colour full bleed (orange
// for Plazo, lime for Plazo Pro, like the feature graphic A), `B` the app's own ground with a white phone shadow.
//
//   cd site && node ../brand/stores/tools/marketing.mjs                    (every style, app, size and screen)
//   STYLE=A APPS=plazo SIZES=appstore69 SCREENS=01,04 node ../brand/stores/tools/marketing.mjs
//
// Output: brand/stores/marketing/<style>/<app>/<size>/<screen>.png (OUT to change the folder). Sizes: appstore69
// (1320 x 2868, iPhone 6,9"), appstore63 (1206 x 2622, iPhone 6,3"), play (1080 x 1920, Google Play phone).
// Fonts: the app's own files (mobile/assets/fonts), embedded as data URIs. No text here promises what the apps do not
// do: every line restates mobile/fiches-stores.md.
import { mkdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const { chromium } = createRequire(path.join(ROOT, 'site', 'package.json'))(process.env.PLAYWRIGHT || 'playwright');
const FONTS = path.join(ROOT, 'mobile/assets/fonts');
const SHOTS = path.join(ROOT, 'brand/stores/screenshots');
const OUT = path.resolve(process.env.OUT || path.join(ROOT, 'brand/stores/marketing'));

const font = (file) => `url('data:font/ttf;base64,${readFileSync(path.join(FONTS, file)).toString('base64')}')`;
const png = (file) => 'data:image/png;base64,' + readFileSync(file).toString('base64');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const SIZES = {
  appstore69: { width: 1320, height: 2868 },
  appstore63: { width: 1206, height: 2622 },
  play: { width: 1080, height: 1920 },
};

// One headline (title) and one line under it (sub) per screen, in the order of the listings (fiches-stores.md 5.2).
const APPS = {
  plazo: {
    folder: 'plazo',
    screens: [
      ['01-rechercher', 'Votre parking à l’aéroport', 'Lyon Saint\u2011Exupéry : les parkings partenaires et leur prix total pour vos dates.'],
      ['02-resultats', 'Comparez avant de réserver', 'Prix total, durée de navette, services : triez et filtrez.'],
      ['03-fiche-parking', 'Tout savoir sur le parking', 'Photos, services, navette, accès et annulation.'],
      ['04-reservation-confirmee', 'Réservé en deux étapes', 'Sans compte, payé en ligne. Rien à régler au parking.'],
      ['05-jour-du-depot', 'Prévenez le parking de votre arrivée', 'Partagez votre position, ou dites « J’arrive dans 10 min ».'],
      ['06-jour-du-retour', 'Votre retour, suivi en direct', 'Compte à rebours jusqu’à l’atterrissage, puis la navette.'],
      ['07-retrouver-ma-voiture', 'Retrouvez votre voiture', 'Sa place ou sa file, et l’itinéraire à pied.'],
    ],
  },
  pro: {
    folder: 'plazo-pro',
    screens: [
      ['01-tableau-de-bord', 'Votre journée en un écran', 'Sur le parking, arrivées, retours, navettes et points à traiter.'],
      ['02-planning', 'Les arrivées et les retours du jour', 'Avec l’état du vol de chaque client.'],
      ['03-reservation', 'Une étape, un bouton', 'Placer, déposer, récupérer, rendre.'],
      ['04-occupation', 'Chaque voiture dans la bonne file', 'La file conseillée suit le jour du retour.'],
      ['05-ma-tournee', 'La navette, réglée sur les vols', 'Ligne du jour, à récupérer, en route, rendus.'],
      ['06-trajet-en-cours', 'Un trajet, partagé avec l’équipe', 'La position n’est partagée que pendant le trajet.'],
      ['07-poste-du-jour', 'Chacun son poste', 'Gérant, accueil, chauffeur ou voiturier : les onglets suivent.'],
    ],
  },
};

// Colours and type of each look, per app (CLAUDE.md, « Direction visuelle »).
const LOOKS = {
  A: {
    plazo: { bg: '#FF6600', title: '#FFFFFF', sub: 'rgba(255,255,255,0.9)', titleFont: "'Playfair Display'", titleStyle: 'italic', titleWeight: 600, titleCase: 'none', bodyFont: "'Manrope'", frame: '#1C1210', shadow: 'rgba(90,30,0,0.45)', eyebrow: null },
    pro: { bg: '#A3E635', title: '#0F2A14', sub: '#1E5E2E', titleFont: "'Archivo Narrow'", titleStyle: 'normal', titleWeight: 700, titleCase: 'uppercase', bodyFont: "'Inter'", frame: '#0F2A14', shadow: 'rgba(15,42,20,0.4)', eyebrow: null },
  },
  B: {
    plazo: { bg: '#ECECEE', title: '#2C1A0E', sub: '#5E554F', titleFont: "'Playfair Display'", titleStyle: 'italic', titleWeight: 600, titleCase: 'none', bodyFont: "'Manrope'", frame: '#FFFFFF', shadow: 'rgba(44,26,14,0.28)', eyebrow: { bg: '#FF6600', fg: '#FFFFFF', text: 'Plazo · Lyon Saint\u2011Exupéry' } },
    pro: { bg: '#EEF0EE', title: '#1A1D1A', sub: '#4B5563', titleFont: "'Archivo Narrow'", titleStyle: 'normal', titleWeight: 700, titleCase: 'uppercase', bodyFont: "'Inter'", frame: '#FFFFFF', shadow: 'rgba(26,29,26,0.25)', eyebrow: { bg: '#A3E635', fg: '#0F2A14', text: 'Plazo Pro · équipes de parking' } },
  },
};

const fontFaces = `
@font-face { font-family: 'Manrope'; src: ${font('Manrope.ttf')}; font-weight: 200 800; }
@font-face { font-family: 'Inter'; src: ${font('Inter.ttf')}; font-weight: 100 900; }
@font-face { font-family: 'Archivo Narrow'; src: ${font('ArchivoNarrow.ttf')}; font-weight: 400 700; }
@font-face { font-family: 'Playfair Display'; src: ${font('PlayfairDisplay-Italic.ttf')}; font-style: italic; font-weight: 400 900; }
* { margin: 0; padding: 0; box-sizing: border-box; }
`;

/** The page of one image, laid out in a 1000-unit-wide frame and scaled to the exact pixel size of the store. */
function pageHtml({ look, title, sub, shot, topColor, size }) {
  const k = size.width / 1000;
  const unitH = size.height / k;
  // Units: the canvas is 1000 wide and unitH high (unitH = 1000 * height / width).
  const isTall = unitH > 2000; // iPhone (≈ 2173) or Play (≈ 1778)
  const pad = 78;
  const titleSize = look.titleCase === 'uppercase' ? 92 : 98;
  const textTop = isTall ? 150 : 104;
  // The text block keeps one height in a set (eyebrow, two lines of title, up to three lines under it), so every
  // phone of the set sits at the same height.
  const textH = (look.eyebrow ? 88 : 0) + 2 * titleSize * 1.04 + 30 + 3 * 40 * 1.3;
  // Phone: screenshot (440 x 956 points) under a status bar of 30 points; the frame is a 22-unit bezel.
  const phoneW = isTall ? 800 : 640;
  const bezel = phoneW * 0.032;
  const screenW = phoneW - bezel * 2;
  const statusH = screenW * (30 / 440);
  const shotH = screenW * (956 / 440);
  const phoneH = statusH + shotH + bezel * 2;
  const radius = phoneW * 0.13;
  const time = '14:05';
  return `<!doctype html><html><head><meta charset="utf-8"><style>${fontFaces}
html, body { width: ${size.width}px; height: ${size.height}px; overflow: hidden; background: ${look.bg}; }
.stage { position: relative; width: 1000px; height: ${unitH}px; overflow: hidden; transform: scale(${k}); transform-origin: 0 0; display: flex; flex-direction: column; align-items: center; padding-top: ${textTop}px; }
.text { padding: 0 ${pad}px; height: ${textH}px; flex-shrink: 0; display: flex; flex-direction: column; gap: 30px; align-items: center; text-align: center; }
.eyebrow { display: inline-flex; align-items: center; height: 58px; padding: 0 28px; border-radius: 999px; font: 800 26px/1 ${look.bodyFont}, sans-serif; letter-spacing: 0.04em; }
h1 { font-family: ${look.titleFont}, serif; font-style: ${look.titleStyle}; font-weight: ${look.titleWeight}; text-transform: ${look.titleCase}; font-size: ${titleSize}px; line-height: 1.04; letter-spacing: ${look.titleCase === 'uppercase' ? '0.005em' : '-0.01em'}; color: ${look.title}; text-wrap: balance; }
p { font: 600 40px/1.3 ${look.bodyFont}, sans-serif; color: ${look.sub}; text-wrap: balance; max-width: 780px; }
.phone { position: relative; flex-shrink: 0; margin-top: ${isTall ? 96 : 72}px; width: ${phoneW}px; height: ${phoneH}px; border-radius: ${radius}px; background: ${look.frame}; padding: ${bezel}px; box-shadow: 0 60px 110px -40px ${look.shadow}, 0 0 0 2px rgba(0,0,0,0.06); }
.screen { position: relative; width: 100%; height: 100%; border-radius: ${radius - bezel}px; overflow: hidden; background: ${topColor}; }
.status { height: ${statusH}px; display: flex; align-items: center; justify-content: space-between; padding: 0 ${screenW * 0.085}px; font: 700 ${statusH * 0.46}px/1 'Inter', sans-serif; color: ${topColor === '#000000' || isDark(topColor) ? '#fff' : '#111'}; }
.island { position: absolute; top: ${statusH * 0.18}px; left: 50%; width: ${screenW * 0.28}px; height: ${statusH * 0.64}px; margin-left: -${screenW * 0.14}px; border-radius: 999px; background: #000; }
.icons { display: flex; gap: ${statusH * 0.18}px; align-items: center; }
.icons i { display: block; background: currentColor; border-radius: 2px; }
.shot { display: block; width: ${screenW}px; height: ${shotH}px; }
</style></head><body><div class="stage">
  <div class="text">
    ${look.eyebrow ? `<span class="eyebrow" style="background:${look.eyebrow.bg}; color:${look.eyebrow.fg};">${esc(look.eyebrow.text)}</span>` : ''}
    <h1>${esc(title)}</h1>
    <p>${esc(sub)}</p>
  </div>
  <div class="phone"><div class="screen">
    <div class="island"></div>
    <div class="status"><span>${time}</span><span class="icons"><i style="width:${statusH * 0.5}px;height:${statusH * 0.28}px"></i><i style="width:${statusH * 0.62}px;height:${statusH * 0.3}px;border-radius:4px"></i></span></div>
    <img class="shot" src="${shot}">
  </div></div>
</div></body></html>`;
}

function isDark(hex) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 128;
}

const pick = (env, all) => (process.env[env] ? process.env[env].split(',').map((s) => s.trim()).filter(Boolean) : all);
const styles = pick('STYLE', Object.keys(LOOKS));
const apps = pick('APPS', Object.keys(APPS));
const sizes = pick('SIZES', Object.keys(SIZES));
const only = process.env.SCREENS ? process.env.SCREENS.split(',').map((s) => s.trim()) : null;

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
let count = 0;
for (const style of styles) {
  for (const app of apps) {
    const look = LOOKS[style][app];
    for (const sizeKey of sizes) {
      const size = SIZES[sizeKey];
      const page = await browser.newPage({ viewport: { width: size.width, height: size.height }, deviceScaleFactor: 1 });
      const dir = path.join(OUT, style, APPS[app].folder, sizeKey);
      mkdirSync(dir, { recursive: true });
      for (const [file, title, sub] of APPS[app].screens) {
        if (only && !only.some((s) => file.startsWith(s))) continue;
        const shotFile = path.join(SHOTS, APPS[app].folder, 'app-store', `${file}.png`);
        const shot = png(shotFile);
        // The status bar takes the colour of the screenshot's first row, so the phone reads as one screen.
        await page.setContent(`<img id="s" src="${shot}">`);
        const topColor = await page.evaluate(async () => {
          const img = document.getElementById('s');
          await img.decode();
          const c = document.createElement('canvas');
          c.width = img.naturalWidth; c.height = 4;
          const ctx = c.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const [r, g, b] = ctx.getImageData(Math.floor(img.naturalWidth / 2), 1, 1, 1).data;
          return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
        });
        await page.setContent(pageHtml({ look, title, sub, shot, topColor, size }), { waitUntil: 'load' });
        await page.evaluate(() => document.fonts.ready);
        const out = path.join(dir, `${file}.png`);
        await page.screenshot({ path: out });
        count++;
      }
      await page.close();
    }
  }
}
await browser.close();
console.log(`${count} images in ${OUT}`);
