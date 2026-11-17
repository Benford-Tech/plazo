import type { PDFFont, PDFPage, RGB } from "pdf-lib";

/**
 * The travellers' flyer (17/11/2026, « permettre à chacun de générer son flyer », direction C « Partez léger, revenez
 * sans attendre. »): one A4 page drawn by the browser with the parking's logo and name, its phone if asked, a QR code
 * to its page on plazo.fr and the store badges. The A5 version puts two of them on a landscape A4 sheet.
 */

export type FlyerFormat = "a4" | "a5";

export interface FlyerImage {
  bytes: Uint8Array;
  type: "png" | "jpeg";
}

export interface FlyerInput {
  /** The name printed on the flyer (the listing's title by default). */
  name: string;
  /** Printed under the badges when given. */
  phone: string | null;
  /** Where the QR code leads. */
  qrUrl: string;
  /** The parking's logo; its initials on a green tile without one. */
  logo: FlyerImage | null;
  /** The official badges; plain words without them. */
  badges: { appStore: FlyerImage; googlePlay: FlyerImage } | null;
  format: FlyerFormat;
}

export const FLYER_NAME_MAX = 40;
export const FLYER_TITLE = ["Partez léger,", "revenez sans attendre."] as const;

/** The parking's initials for the tile drawn without a logo (« Parking des Cèdres » → « C »). */
export function initialsOf(name: string): string {
  const words = name
    .trim()
    .replace(/^parking\s+(?:des|du|de la|de l['’]|de)?\s*/i, "")
    .split(/\s+/)
    .filter((w) => /[\p{L}\p{N}]/u.test(w));
  return words.slice(0, 2).map((w) => [...w.replace(/^[^\p{L}\p{N}]+/u, "")][0].toUpperCase()).join("") || "P";
}

/** The QR code's target: the parking's page on plazo.fr once its listing is online, else « Ma réservation ». */
export function flyerQrUrl(siteUrl: string, listing: { status: string; slug: string; airport: { slug: string } } | null): {
  url: string;
  listing: boolean;
} {
  const base = (siteUrl || "https://www.plazo.fr").replace(/\/+$/, "");
  if (listing?.status === "published") return { url: `${base}/${listing.airport.slug}/${listing.slug}`, listing: true };
  return { url: `${base}/ma-reservation`, listing: false };
}

export function flyerFileName(name: string, format: FlyerFormat): string {
  const slug =
    name
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "parking";
  return `flyer-plazo-${slug}${format === "a5" ? "-a5" : ""}.pdf`;
}

// ---- Drawing ----------------------------------------------------------------------------------------------------------

// The design is laid out in CSS pixels on a 794 × 1123 A4 page, as on the canvas; 0.75 pt per pixel.
const PX = 595.28 / 794;
const PAGE_W = 595.28;
const PAGE_H = 841.89;

function hex(rgb: (r: number, g: number, b: number) => RGB, value: string): RGB {
  const n = parseInt(value.slice(1), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

/** Keeps what the standard fonts can print (WinAnsi), so a name with an emoji never breaks the PDF. */
export function printable(font: Pick<PDFFont, "encodeText">, text: string): string {
  let out = "";
  for (const ch of text) {
    // A letter outside WinAnsi loses its accent (« ź » → « z »); anything else outside is dropped.
    for (const candidate of [ch, ch.normalize("NFD").replace(/[\u0300-\u036f]/g, "")]) {
      try {
        if (!candidate) break;
        font.encodeText(candidate);
        out += candidate;
        break;
      } catch {
        // not in the font's encoding
      }
    }
  }
  return out.replace(/\s+/g, " ").trim();
}

function wrap(font: PDFFont, text: string, size: number, width: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (line && font.widthOfTextAtSize(next, size) > width) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/** Shrinks the size until the text fits the width (never under `min`), then cuts it with « … ». */
function fit(font: PDFFont, text: string, size: number, width: number, min: number): { text: string; size: number } {
  let s = size;
  while (s > min && font.widthOfTextAtSize(text, s) > width) s -= 0.5;
  let t = text;
  while (t.length > 1 && font.widthOfTextAtSize(t, s) > width) t = `${t.slice(0, -2).trimEnd()}…`;
  return { text: t, size: s };
}

export async function buildFlyerPdf(input: FlyerInput): Promise<Uint8Array> {
  const [pdfLib, qrLib] = await Promise.all([import("pdf-lib"), import("qrcode")]);
  // Both are CommonJS: the bundler gives named exports, Node's interop puts them under `default`.
  const { PDFDocument, StandardFonts, rgb, LineCapStyle } = ("PDFDocument" in pdfLib ? pdfLib : (pdfLib as { default: typeof pdfLib }).default);
  const QRCode = ("create" in qrLib ? qrLib : (qrLib as unknown as { default: typeof qrLib }).default);
  const doc = await PDFDocument.create();
  doc.setTitle(`Flyer Plazo · ${input.name}`);
  doc.setCreator("Plazo Pro");
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const italic = await doc.embedFont(StandardFonts.TimesRomanItalic);
  const c = (v: string) => hex(rgb, v);
  const ink = c("#2C1A0E");
  const soft = c("#5B4A3F");
  const muted = c("#6E5E52");
  const accent = c("#FF6600");
  const accentText = c("#C24E00");

  const page = doc.addPage([PAGE_W, PAGE_H]);
  const X = (px: number) => px * PX;
  const Y = (px: number) => PAGE_H - px * PX;
  const text = (p: PDFPage, s: string, x: number, baseline: number, font: PDFFont, size: number, color: RGB) =>
    p.drawText(s, { x: X(x), y: Y(baseline), size: size * PX, font, color });
  const centred = (s: string, baseline: number, font: PDFFont, size: number, color: RGB, cx = 397) =>
    text(page, s, cx - font.widthOfTextAtSize(s, size) / 2, baseline, font, size, color);
  const roundRect = (x: number, top: number, w: number, h: number, r: number, opts: { fill?: RGB; border?: RGB }) => {
    const path = `M ${r} 0 H ${w - r} A ${r} ${r} 0 0 1 ${w} ${r} V ${h - r} A ${r} ${r} 0 0 1 ${w - r} ${h} H ${r} A ${r} ${r} 0 0 1 0 ${h - r} V ${r} A ${r} ${r} 0 0 1 ${r} 0 Z`;
    page.drawSvgPath(path, {
      x: X(x),
      y: Y(top),
      scale: PX,
      color: opts.fill,
      borderColor: opts.border,
      borderWidth: opts.border ? 1 : 0,
    });
  };

  const name = printable(bold, input.name) || "Votre parking";

  // Header: Plazo on the left, the parking on the right.
  roundRect(56, 48, 44, 44, 11, { fill: accent });
  centred("P", 80, bold, 26, c("#FFFFFF"), 78);
  text(page, "Plazo", 112, 78, bold, 22, ink);

  const nameFit = fit(bold, name, 17, 300, 11);
  const chipText = Math.max(bold.widthOfTextAtSize(nameFit.text, nameFit.size), bold.widthOfTextAtSize("VOTRE PARKING", 11));
  const chipW = 6 + 40 + 10 + chipText + 16;
  const chipX = 738 - chipW;
  roundRect(chipX, 46, chipW, 52, 16, { border: c("#E8E2DC") });
  if (input.logo) {
    const image = input.logo.type === "png" ? await doc.embedPng(input.logo.bytes) : await doc.embedJpg(input.logo.bytes);
    const box = 40;
    const s = Math.min(box / image.width, box / image.height);
    page.drawImage(image, {
      x: X(chipX + 6 + (box - image.width * s) / 2),
      y: Y(52 + box - (box - image.height * s) / 2),
      width: image.width * s * PX,
      height: image.height * s * PX,
    });
  } else {
    roundRect(chipX + 6, 52, 40, 40, 10, { fill: c("#1E5E2E") });
    const initials = printable(bold, initialsOf(input.name)) || "P";
    centred(initials, 77, bold, 15, c("#FFFFFF"), chipX + 26);
  }
  text(page, "VOTRE PARKING", chipX + 56, 66, bold, 11, muted);
  text(page, nameFit.text, chipX + 56, 86, bold, nameFit.size, ink);

  // Headline.
  centred(FLYER_TITLE[0], 176, bold, 56, ink);
  centred(FLYER_TITLE[1], 236, italic, 60, accentText);

  // The ring and the QR code.
  const ringTop = 262;
  const cx = 397;
  const cy = ringTop + 190;
  const r = 172;
  page.drawCircle({ x: X(cx), y: Y(cy), size: r * PX, borderColor: c("#F1EEEA"), borderWidth: 20 * PX });
  const sweep = (760 / 1081) * 2 * Math.PI;
  const end = { x: r * Math.sin(sweep), y: -r * Math.cos(sweep) };
  page.drawSvgPath(`M 0 ${-r} A ${r} ${r} 0 ${sweep > Math.PI ? 1 : 0} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`, {
    x: X(cx),
    y: Y(cy),
    scale: PX,
    borderColor: accent,
    borderWidth: 20,
    borderLineCap: LineCapStyle.Round,
  });
  const qr = QRCode.create(input.qrUrl, { errorCorrectionLevel: "M" });
  const n = qr.modules.size;
  const qrSize = 204;
  const cell = qrSize / n;
  const qrLeft = cx - qrSize / 2;
  const qrTop = cy - qrSize / 2 - 16;
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      if (!qr.modules.get(row, col)) continue;
      page.drawRectangle({
        x: X(qrLeft + col * cell),
        y: Y(qrTop + (row + 1) * cell),
        width: cell * PX + 0.05,
        height: cell * PX + 0.05,
        color: ink,
      });
    }
  }
  centred("votre parking sur Plazo", qrTop + qrSize + 30, italic, 22, ink);

  // Three promises.
  const cols = [
    ["Votre vol suivi", "Retard ou avance, le parking le voit en même temps que vous."],
    ["La navette en direct", "Où elle est, et où la rejoindre à l'aéroport."],
    ["Votre voiture retrouvée", "Sa place sur le parking, le chemin à pied."],
  ];
  const colTop = ringTop + 380 + 30;
  const colW = (794 - 112 - 32) / 3;
  cols.forEach(([title, body], i) => {
    const left = 56 + i * (colW + 16);
    page.drawRectangle({ x: X(left), y: Y(colTop + 3), width: colW * PX, height: 3 * PX, color: accent });
    text(page, title, left, colTop + 34, bold, 17, ink);
    wrap(regular, body, 14, colW).forEach((line, k) => text(page, line, left, colTop + 58 + k * 21, regular, 14, soft));
  });

  // The band: install the app.
  const bandTop = input.phone ? 872 : 892;
  page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: (1123 - bandTop) * PX, color: accent });
  centred("Installez Plazo avant de partir", bandTop + 52, bold, 26, ink);
  const badgeTop = bandTop + 74;
  if (input.badges) {
    const store = [
      input.badges.appStore.type === "png" ? await doc.embedPng(input.badges.appStore.bytes) : await doc.embedJpg(input.badges.appStore.bytes),
      input.badges.googlePlay.type === "png" ? await doc.embedPng(input.badges.googlePlay.bytes) : await doc.embedJpg(input.badges.googlePlay.bytes),
    ];
    const h = 42;
    const widths = store.map((img) => (img.width / img.height) * h);
    let x = cx - (widths[0] + widths[1] + 12) / 2;
    store.forEach((img, i) => {
      page.drawImage(img, { x: X(x), y: Y(badgeTop + h), width: widths[i] * PX, height: h * PX });
      x += widths[i] + 12;
    });
  } else {
    centred("Sur l'App Store et Google Play", badgeTop + 28, bold, 18, ink);
  }
  const join = fit(bold, `Ajoutez votre réservation ${name} avec son numéro et votre e-mail ou téléphone.`, 14, 682, 10);
  centred(join.text, badgeTop + 76, bold, join.size, ink);
  if (input.phone) {
    const phone = printable(regular, input.phone);
    if (phone) centred(fit(regular, `Une question ? ${name} : ${phone}`, 14, 682, 10).text, badgeTop + 100, regular, 14, ink);
  }

  if (input.format === "a4") return doc.save();

  // A5: two flyers side by side on a landscape A4 sheet, with a cutting line.
  const sheet = await PDFDocument.create();
  sheet.setTitle(`Flyer Plazo · ${input.name} · A5`);
  sheet.setCreator("Plazo Pro");
  const [embedded] = await sheet.embedPdf(await doc.save());
  const out = sheet.addPage([PAGE_H, PAGE_W]);
  const scale = PAGE_W / PAGE_H;
  for (const left of [0, PAGE_H / 2]) out.drawPage(embedded, { x: left, y: 0, xScale: scale, yScale: scale });
  out.drawLine({
    start: { x: PAGE_H / 2, y: 0 },
    end: { x: PAGE_H / 2, y: PAGE_W },
    thickness: 0.5,
    color: rgb(0.7, 0.7, 0.7),
    dashArray: [4, 4],
  });
  return sheet.save();
}
