// Store screenshots (11/10/2026): drives the Flutter web builds of Plazo and Plazo Pro with Chromium and saves the
// phone screenshots Google Play asks for (1080 x 1920, 9:16: a 405 x 720 viewport at 8/3 device pixels) and, with
// DEVICE=iphone, the iPhone 6,9" ones the App Store asks for (1320 x 2868), with DEVICE=iphone63 its 6,3" ones (1206 x 2622).
//
//   node capture.mjs traveller   (Plazo, 7 screens)
//   node capture.mjs pro         (Plazo Pro, 7 screens; runs `scenario.mjs trip` before the trip screen)
//
// Environment: TRAVELLER_URL (http://localhost:8091), PRO_URL (http://localhost:8092), SCENARIO (the JSON printed by
// `scenario.mjs prepare`), OUT (output folder), DEVICE (phone | iphone | iphone63, see below), PLAZO_CLOCK_OFFSET_MS (the API's
// clock shift, applied to the browser too), MANAGER_EMAIL / MANAGER_PASSWORD (the demo manager), PLAYWRIGHT (module
// path, default: resolved from site/).
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../../..');
const { chromium } = createRequire(path.join(ROOT, 'site', 'package.json'))(process.env.PLAYWRIGHT || 'playwright');
const flavor = process.argv[2] || 'traveller';
// DEVICE: `phone` for Google Play (1080 x 1920), `iphone` for the App Store's iPhone 6,9" (1320 x 2868: a 440 x 956
// viewport, the iPhone 16 Pro Max, at 3 device pixels), `iphone63` for its iPhone 6,3" (1206 x 2622: a 402 x 874
// viewport, the iPhone 16 Pro, at 3 device pixels). The screens are the same, a taller one just shows more.
const DEVICES = {
  phone: { width: 405, height: 720, scale: 8 / 3 },
  iphone: { width: 440, height: 956, scale: 3 },
  iphone63: { width: 402, height: 874, scale: 3 },
};
const device = DEVICES[process.env.DEVICE || 'phone'];
if (!device) throw new Error(`DEVICE must be one of ${Object.keys(DEVICES).join(', ')}`);
const OUT = path.resolve(process.env.OUT || path.join(ROOT, 'brand/stores/screenshots', flavor === 'pro' ? 'plazo-pro' : 'plazo'));
const scenario = JSON.parse(readFileSync(process.env.SCENARIO, 'utf8'));
const offset = Number(process.env.PLAZO_CLOCK_OFFSET_MS || 0);
const base = flavor === 'pro' ? process.env.PRO_URL || 'http://localhost:8092' : process.env.TRAVELLER_URL || 'http://localhost:8091';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
const context = await browser.newContext({
  viewport: { width: device.width, height: device.height },
  deviceScaleFactor: device.scale,
  locale: 'fr-FR',
  timezoneId: 'Europe/Paris',
  permissions: ['geolocation'],
  geolocation: { latitude: 45.7085, longitude: 5.0672, accuracy: 8 },
});
// The browser's clock follows the API's (shifted) clock, so countdowns and « today » agree with the data.
await context.addInitScript(o => {
  if (!o) return;
  const RealDate = Date;
  class ShiftedDate extends RealDate {
    constructor(...args) {
      if (args.length === 0) super(RealDate.now() + o);
      else super(...args);
    }
    static now() { return RealDate.now() + o; }
  }
  globalThis.Date = ShiftedDate;
}, offset);
const page = await context.newPage();
page.on('pageerror', e => console.error('page error:', String(e).slice(0, 300)));

/** Opens an app URL, waits for Flutter's first frame and turns its accessibility tree on (to find buttons by name). */
async function open(url, settle = 4000) {
  await page.goto(base + url, { waitUntil: 'load' });
  await page.waitForSelector('flt-semantics-placeholder', { state: 'attached', timeout: 60_000 });
  await page.waitForTimeout(1500);
  await page.evaluate(() => document.querySelector('flt-semantics-placeholder')?.click());
  await page.waitForTimeout(settle);
}
const pause = ms => page.waitForTimeout(ms);
async function tap(name, { role = 'button', exact = false } = {}) {
  const target = page.getByRole(role, { name, exact }).first();
  await target.waitFor({ timeout: 20_000 });
  await target.click();
}
async function type(label, text) {
  const field = page.getByRole('textbox', { name: label }).first();
  await field.waitFor({ timeout: 20_000 });
  await field.click();
  await pause(400);
  // Flutter's editing element is the focused <input>: fill it (typing key by key loses characters on the web build).
  await page.locator('input:focus, textarea:focus').first().fill(text);
  await pause(300);
}
async function scroll(dy) {
  await page.mouse.move(Math.round(device.width / 2), Math.round(device.height * 0.55));
  await page.mouse.wheel(0, dy);
  await pause(1200);
}
async function shot(name) {
  // Map tiles and photos: wait for the network to settle (the apps poll every 10–12 s, which leaves quiet windows).
  await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
  await pause(1500);
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file });
  console.log('saved', path.relative(ROOT, file));
}

if (flavor === 'traveller') {
  const link = ref => `/ma-reservation/${ref}?cle=${scenario.links[ref]}`;
  await open('/', 7000); // the IGN tiles of the home map
  await shot('01-rechercher');
  await tap('Rechercher');
  await pause(5000);
  await shot('02-resultats');
  await tap(/Parkair Lyon/);
  await pause(6000); // photos
  await shot('03-fiche-parking');
  await open(`${link('RDEMX2')}&confirmee=1`);
  await shot('04-reservation-confirmee');
  await open(link('RDEMX3'));
  await shot('05-jour-du-depot');
  await open(link('RDEMX1'), 6000);
  await shot('06-jour-du-retour');
  await open('/ma-reservation/RDEMX1/ma-voiture', 7000);
  await shot('07-retrouver-ma-voiture');
} else {
  await open('/pro/connexion');
  await type('Adresse email', process.env.MANAGER_EMAIL || 'demo-parkair-lyon@plazo.test');
  await type('Mot de passe', process.env.MANAGER_PASSWORD);
  await tap('Se connecter');
  await pause(5000);
  await shot('07-poste-du-jour');
  await tap(/Gérant/);
  await tap("C'est parti");
  await pause(6000);
  await shot('01-tableau-de-bord');
  await tap(/Planning/i);
  await pause(4000);
  await shot('02-planning');
  await open(`/pro/reservations/${scenario.detailId}`);
  await shot('03-reservation');
  await open('/pro/parking', 6000);
  await shot('04-occupation');
  // « Ma tournée » is the driver's first tab: the manager takes the driver's post for the last two screens.
  execFileSync(process.execPath, [path.join(HERE, 'scenario.mjs'), 'post', 'driver'], { stdio: 'inherit', env: process.env });
  await open('/pro/navette', 6000);
  await shot('05-ma-tournee');
  execFileSync(process.execPath, [path.join(HERE, 'scenario.mjs'), 'trip'], { stdio: 'inherit', env: process.env });
  await open('/pro/navette', 7000);
  await shot('06-trajet-en-cours');
}
await browser.close();
