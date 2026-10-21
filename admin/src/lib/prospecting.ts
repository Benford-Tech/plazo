import { fr } from "./fr";
import type { Prospect, ProspectInput, ProspectingStep } from "./types";

/**
 * Prospection (Plateforme › Prospection, 18/10/2026): reading the admin's CSV file and the preview of a mail. The variables
 * follow the API's rules (backend/src/domain/prospecting.ts), so the preview reads like the mail that leaves.
 */

// ---- CSV ---------------------------------------------------------------------------------------------------------------

type Column = keyof ProspectInput;

const HEADERS: Record<string, Column> = {
  parking: "companyName",
  nomduparking: "companyName",
  societe: "companyName",
  entreprise: "companyName",
  raisonsociale: "companyName",
  company: "companyName",
  prenom: "contactFirstName",
  firstname: "contactFirstName",
  nom: "contactLastName",
  nomdefamille: "contactLastName",
  lastname: "contactLastName",
  email: "email",
  mail: "email",
  adressemail: "email",
  adresseemail: "email",
  courriel: "email",
  ville: "town",
  commune: "town",
  town: "town",
  city: "town",
  aeroport: "airportCode",
  airport: "airportCode",
  codeaeroport: "airportCode",
  region: "region",
  telephone: "phone",
  tel: "phone",
  phone: "phone",
  notes: "notes",
  note: "notes",
  commentaire: "notes",
  commentaires: "notes",
  remarques: "notes",
};

const headerKey = (header: string) =>
  header
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");

/** Splits a CSV text into rows of cells (quotes as in RFC 4180; ";", "," or tab, read from the first line). */
export function parseCsvCells(text: string): string[][] {
  const clean = text.replace(/^\uFEFF/, "");
  const firstLine = clean.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = [";", ",", "\t"].reduce((best, d) => (firstLine.split(d).length > firstLine.split(best).length ? d : best), ";");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < clean.length; i += 1) {
    const ch = clean[i];
    if (quoted) {
      if (ch === '"' && clean[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"' && cell === "") quoted = true;
    else if (ch === delimiter) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && clean[i + 1] === "\n") i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter(r => r.some(c => c.trim() !== ""));
}

export interface CsvReading {
  rows: Partial<ProspectInput>[];
  /** Headers Plazo does not know (ignored). */
  ignored: string[];
  /** Required columns absent from the file. */
  missing: ("companyName" | "email")[];
}

/** The prospects of a CSV file whose first line names the columns (parking, prénom, nom, e-mail, ville, aéroport…). */
export function readProspectsCsv(text: string): CsvReading {
  const [header = [], ...lines] = parseCsvCells(text);
  const columns = header.map(h => HEADERS[headerKey(h)] ?? null);
  const ignored = header.filter((h, i) => !columns[i] && h.trim() !== "");
  const missing = (["companyName", "email"] as const).filter(c => !columns.includes(c));
  const rows = lines.map(cells => {
    const row: Partial<ProspectInput> = {};
    columns.forEach((column, i) => {
      const value = (cells[i] ?? "").trim();
      if (column && value && row[column] == null) row[column] = value;
    });
    return row;
  });
  return { rows, ignored, missing };
}

// ---- Mails ---------------------------------------------------------------------------------------------------------------

export const VARIABLES = ["{prénom}", "{nom}", "{parking}", "{aéroport}", "{ville}", "{lien_demo}"];

const ALIASES: Record<string, keyof Values> = {
  prénom: "prenom",
  prenom: "prenom",
  nom: "nom",
  parking: "parking",
  aéroport: "aeroport",
  aeroport: "aeroport",
  ville: "ville",
  lien_demo: "lienDemo",
  lien_démo: "lienDemo",
  liendemo: "lienDemo",
};

interface Values {
  prenom: string;
  nom: string;
  parking: string;
  aeroport: string;
  ville: string;
  /** 21/10/2026: the prospect's own demo link (made when the mail is sent; a sample until then). */
  lienDemo: string;
}

export const SAMPLE_DEMO_LINK = "https://www.plazo.fr/pro/demo/AbCd2345EfGh";

export const valuesOf = (
  p: Pick<Prospect, "contactFirstName" | "contactLastName" | "companyName" | "airportName" | "airportCode" | "town"> & { demo?: Prospect["demo"] },
): Values => ({
  prenom: p.contactFirstName ?? "",
  nom: p.contactLastName ?? "",
  parking: p.companyName,
  aeroport: p.airportName ?? p.airportCode ?? "",
  ville: p.town ?? "",
  lienDemo: p.demo && !p.demo.expired ? p.demo.url : SAMPLE_DEMO_LINK,
});

export function renderText(text: string, values: Values): string {
  return text
    .replace(/\{([^{}\s]{1,20})\}/g, (whole, name: string) => {
      const key = ALIASES[name.toLowerCase()];
      return key ? values[key].trim() : whole;
    })
    .split("\n")
    .map(line => line.replace(/[ \t]{2,}/g, " ").replace(/ +,/g, ","))
    .join("\n");
}

export function renderSubjectText(text: string, values: Values): string {
  const line = renderText(text.replace(/[\r\n]+/g, " "), values)
    .replace(/^[\s,;:.–-]+/, "")
    .trim();
  return line.charAt(0).toUpperCase() + line.slice(1);
}

/** The variables of a text that Plazo does not know (the API refuses them). */
export function unknownVariables(text: string): string[] {
  return [...new Set([...text.matchAll(/\{([^{}\s]{1,20})\}/g)].filter(m => !ALIASES[m[1].toLowerCase()]).map(m => m[0]))];
}

/** The step a prospect will receive next: its first contact while it has not been sent anything. */
export function stepFor(prospect: Pick<Prospect, "step" | "nextStep">, steps: ProspectingStep[]): ProspectingStep {
  const wanted = prospect.nextStep ?? (prospect.step === 0 ? 1 : null);
  return steps.find(s => s.step === wanted) ?? steps[0];
}

// ---- Classement par région (19/10/2026, « Groupés par région » + « De l'aéroport ») ---------------------------------------

/** The filter value (and block key) of the prospects without a region. */
export const NO_REGION = "none";

export interface RegionGroup {
  key: string;
  label: string;
  prospects: Prospect[];
}

/**
 * The prospects in blocks, one per region: regions in the given (alphabetical) order, « Sans région » last, each block in
 * the list's order. A region with no prospect under the filters has no block.
 */
export function groupByRegion(rows: Prospect[], regions: { key: string; label: string }[]): RegionGroup[] {
  const byKey = new Map<string, Prospect[]>();
  for (const p of rows) {
    const key = p.region?.key ?? NO_REGION;
    const block = byKey.get(key);
    if (block) block.push(p);
    else byKey.set(key, [p]);
  }
  const known = new Set(regions.map(r => r.key));
  // A region the page does not list yet (never expected): after the others, under its own label.
  const extra = rows.flatMap(p => (p.region && !known.has(p.region.key) ? [{ key: p.region.key, label: p.region.label }] : []));
  const seen = new Set<string>();
  const ordered = [...regions, ...extra]
    .filter(r => byKey.has(r.key) && !seen.has(r.key) && seen.add(r.key))
    .map(r => ({ key: r.key, label: r.label, prospects: byKey.get(r.key)! }));
  const none = byKey.get(NO_REGION);
  return none ? [...ordered, { key: NO_REGION, label: fr.platform.prospecting.regionNone, prospects: none }] : ordered;
}
