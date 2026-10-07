import type { TemplateValues, TemplateVariable } from "./types";

/**
 * A phone number typed by the manager ("06 12 34 56 78", "+33 6 12 34 56 78", "0033612345678") in
 * E.164 ("+33612345678"), or the trimmed input when it does not look like a French number (the
 * API validates it).
 */
export function toE164(value: string): string {
  let digits = value.replace(/\(0\)/g, "").replace(/[\s.()-]/g, "");
  if (digits.startsWith("00")) digits = `+${digits.slice(2)}`;
  if (/^0[1-9]\d{8}$/.test(digits)) return `+33${digits.slice(1)}`;
  if (digits.startsWith("+33")) return `+33${digits.slice(3).replace(/^0/, "")}`;
  return digits;
}

/** "+33612345678" shown as "+33 6 12 34 56 78". */
export function formatPhone(value: string | null): string {
  if (!value) return "";
  const m = /^\+33(\d)(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(value);
  return m ? `+33 ${m[1]} ${m[2]} ${m[3]} ${m[4]} ${m[5]}` : value;
}

/**
 * The day-before SMS in the browser (« SMS de la veille », 06/10/2026): the same rules as
 * backend/src/domain/day-before-sms.ts, for the live preview and the counter.
 */

const GSM7 = new Set(
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà^{}\\[~]|€",
);
const GSM7_EXTENDED = new Set("^{}\\[~]|€");

export interface SmsLength {
  encoding: "gsm7" | "unicode";
  characters: number;
  segments: number;
}

/** GSM-7: 160 characters, or 153 per part; any other character (emoji, â, ’…): Unicode, 70 or 67 per part. */
export function smsLength(text: string): SmsLength {
  const chars = [...text];
  if (chars.every(c => GSM7.has(c))) {
    const characters = chars.reduce((n, c) => n + (GSM7_EXTENDED.has(c) ? 2 : 1), 0);
    return { encoding: "gsm7", characters, segments: characters === 0 ? 0 : characters <= 160 ? 1 : Math.ceil(characters / 153) };
  }
  const characters = text.length;
  return { encoding: "unicode", characters, segments: characters <= 70 ? 1 : Math.ceil(characters / 67) };
}

/** The characters that push a text to Unicode, once each ("â", "’", "📍"…). */
export function unicodeCharacters(text: string): string[] {
  return [...new Set([...text].filter(c => !GSM7.has(c) && c.trim() !== "" && c !== "️"))];
}

const ALIASES: Record<string, TemplateVariable> = { prenom: "prénom", reference: "référence" };
const VARIABLES: TemplateVariable[] = ["prénom", "nom", "date", "heure", "plaque", "référence", "lien"];
const TOKEN_RE = /\{\s*([^{}\s][^{}]{0,30}?)\s*\}/g;

function variableOf(name: string): TemplateVariable | null {
  const key = name.toLowerCase();
  if ((VARIABLES as string[]).includes(key)) return key as TemplateVariable;
  return ALIASES[key] ?? null;
}

export function unknownVariables(template: string): string[] {
  const unknown = new Set<string>();
  for (const match of template.matchAll(TOKEN_RE)) if (!variableOf(match[1])) unknown.add(match[0]);
  return [...unknown];
}

export function renderTemplate(template: string, values: TemplateValues): string {
  return template
    .replace(TOKEN_RE, (whole, name: string) => {
      const variable = variableOf(name);
      return variable ? values[variable] : whole;
    })
    .replace(/[ \t]+$/gm, "")
    .trim();
}

const REPLACEMENTS: [RegExp, string][] = [
  [/[’‘‚`´]/g, "'"],
  [/[“”„«»]/g, '"'],
  [/[–—−]/g, "-"],
  [/[•·▪●]/g, "-"],
  [/…/g, "..."],
  [/[\u00A0\u202F\u2009]/g, " "],
  [/[âáã]/g, "a"],
  [/[ÀÂÁÃ]/g, "A"],
  [/[êë]/g, "e"],
  [/[ÈÊË]/g, "E"],
  [/[îïí]/g, "i"],
  [/[ÎÏÍ]/g, "I"],
  [/[ôóõ]/g, "o"],
  [/[ÔÓÕ]/g, "O"],
  [/[ûú]/g, "u"],
  [/[ÙÛÚ]/g, "U"],
  [/ç/g, "c"],
  [/ÿ/g, "y"],
  [/œ/g, "oe"],
  [/Œ/g, "OE"],
];

/** "Retirer les émojis et signes": the closest text in GSM-7 (accents kept where GSM-7 has them). */
export function toGsm7(text: string): string {
  let result = text;
  for (const [re, by] of REPLACEMENTS) result = result.replace(re, by);
  return [...result]
    .filter(c => GSM7.has(c))
    .join("")
    .replace(/^[ \t]+/gm, "")
    .replace(/ {2,}/g, " ")
    .replace(/[ \t]+$/gm, "");
}
