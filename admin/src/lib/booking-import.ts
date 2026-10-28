import { parseCsvCells } from "./prospecting";
import { readWorkbook } from "./xlsx";

/**
 * Import of old (and upcoming) bookings from a file (28/10/2026, direction A): the browser reads the file into cells
 * and guesses which column holds what; the server reads every cell (dates, prices, channels) and gives the preview.
 */

export const IMPORT_FIELDS = [
  "name",
  "firstName",
  "lastName",
  "phone",
  "email",
  "plate",
  "arrivalDate",
  "arrivalTime",
  "returnDate",
  "returnTime",
  "returnFlight",
  "departureFlight",
  "passengers",
  "price",
  "channel",
  "reference",
  "status",
  "bookedAt",
  "vehicle",
  "notes",
] as const;
export type ImportField = (typeof IMPORT_FIELDS)[number];

/** Column index → field (or nothing: ignored). */
export type ImportMapping = (ImportField | null)[];

export type ImportRow = { line: number } & Partial<Record<ImportField, string>>;

const fold = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** Header words, folded, for each field; the first rule that matches wins (order matters: « date retour » before « date »). */
const RULES: { field: ImportField; test: RegExp }[] = [
  { field: "bookedAt", test: /^(date (de )?(reservation|resa|commande|creation)|reserve le|reservee le|cree le|booking date)$/ },
  { field: "returnTime", test: /^(heure|h) (de )?(retour|sortie|depart|recuperation|fin)$/ },
  { field: "arrivalTime", test: /^(heure|h) (d )?(de )?(arrivee|depot|entree|debut)$/ },
  { field: "returnFlight", test: /^(n )?(no |num |numero )?(de )?vol (de )?retour$|^vol retour$|^return flight$/ },
  { field: "departureFlight", test: /^(n )?(no |num |numero )?(de )?vol (d )?(aller|depart)$|^vol aller$/ },
  { field: "returnDate", test: /^(date (de )?)?(retour|sortie|fin|recuperation|depart)( le)?( date)?$|^date (et heure )?(de |du )?(retour|sortie|fin|recuperation|depart)$|^au$|^return$/ },
  { field: "arrivalDate", test: /^(date (de )?)?(arrivee|depot|entree|debut|aller)( le)?( date)?$|^date (et heure )?(d |de )?(arrivee|depot|entree|debut)$|^du$|^arrival$/ },
  { field: "firstName", test: /^prenom$|^first name$/ },
  { field: "lastName", test: /^nom( de famille)?$|^last name$/ },
  { field: "name", test: /^(nom (du )?(client|voyageur)|client|voyageur|nom complet|nom et prenom|prenom et nom|name)$/ },
  { field: "phone", test: /^(tel|telephone|portable|mobile|gsm|phone|n tel|numero de telephone)$/ },
  { field: "email", test: /^(e ?mail|mail|courriel|adresse (e ?)?mail)$/ },
  { field: "plate", test: /^(plaque|immat|immatriculation|plaque d immatriculation|vehicule immat|plate)$/ },
  { field: "passengers", test: /^(passagers?|nb (de )?(personnes|passagers|pers)|personnes|pax|nombre de personnes)$/ },
  { field: "price", test: /^(prix|montant|tarif|total|prix ttc|montant ttc|prix paye|ca|chiffre)( eur)?$/ },
  { field: "channel", test: /^(source|canal|origine|provenance|comparateur|apporteur|via)$/ },
  { field: "reference", test: /^(n |no |num |numero )?(de )?(resa|reservation|reference|ref|dossier|booking)( n)?$|^reference externe$/ },
  { field: "status", test: /^(statut|etat|status)$/ },
  { field: "vehicle", test: /^(vehicule|voiture|modele|marque|marque modele)$/ },
  { field: "notes", test: /^(notes?|remarques?|commentaires?|observations?|infos?)$/ },
];

/** The field a header names, null when Plazo does not know it. */
export function fieldOfHeader(header: string): ImportField | null {
  const key = fold(header);
  if (!key) return null;
  return RULES.find(r => r.test.test(key))?.field ?? null;
}

/** A field per column, each field used once (the first column that names it). */
export function guessMapping(header: string[]): ImportMapping {
  const used = new Set<ImportField>();
  const mapping = header.map(h => {
    const field = fieldOfHeader(h);
    if (!field || used.has(field)) return null;
    used.add(field);
    return field;
  });
  // A lone « Nom » column holds the whole name.
  if (used.has("lastName") && !used.has("firstName") && !used.has("name")) return mapping.map(f => (f === "lastName" ? "name" : f));
  return mapping;
}

/** What the mapping still lacks: a name (whole, or first and last), the arrival and the return. */
export function missingFields(mapping: ImportMapping): ("name" | "arrivalDate" | "returnDate")[] {
  const has = (f: ImportField) => mapping.includes(f);
  const missing: ("name" | "arrivalDate" | "returnDate")[] = [];
  if (!has("name") && !has("firstName") && !has("lastName")) missing.push("name");
  if (!has("arrivalDate")) missing.push("arrivalDate");
  if (!has("returnDate")) missing.push("returnDate");
  return missing;
}

/** The rows to send: the file's lines under its header (line 2 is the first), the mapped columns only. */
export function rowsFor(cells: string[][], mapping: ImportMapping): ImportRow[] {
  return cells.slice(1).map((cellsOfRow, i) => {
    const row: ImportRow = { line: i + 2 };
    mapping.forEach((field, column) => {
      const value = (cellsOfRow[column] ?? "").trim();
      if (field && value) row[field] = value;
    });
    return row;
  });
}

export interface ReadFile {
  /** The sheets of a workbook; a CSV file is one sheet. */
  sheets: { name: string; rows: string[][] }[];
}

function bytesOf(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error("not_a_workbook"));
    reader.readAsArrayBuffer(file);
  });
}

/** An Excel workbook (.xlsx) or a CSV / text file, as sheets of cells. */
export async function readImportFile(file: File): Promise<ReadFile> {
  const buffer = await bytesOf(file);
  const head = new Uint8Array(buffer.slice(0, 4));
  if (head[0] === 0x50 && head[1] === 0x4b) return { sheets: await readWorkbook(buffer) };
  if (/\.xls$/i.test(file.name)) throw new Error("old_excel");
  return { sheets: [{ name: file.name, rows: parseCsvCells(new TextDecoder().decode(buffer)) }] };
}
