// Renders brand/social-card-pro.html to its two PNGs (node brand/tools/social-card-pro.mjs, Playwright's Chromium).
import { copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const brand = join(dirname(fileURLToPath(import.meta.url)), "..");
// Playwright is a dependency of site/: resolve it from there, wherever this script is run from.
const { chromium } = createRequire(join(brand, "..", "site", "package.json"))("playwright");
const out = join(brand, "png", "social-card-pro-1200x630.png");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto(pathToFileURL(join(brand, "social-card-pro.html")).href, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
await page.locator(".card").screenshot({ path: out });
await browser.close();
copyFileSync(out, join(brand, "..", "site", "public", "brand", "social-card-pro.png"));
console.log("written", out);
