import { fr } from "./fr";
import type {
  Prospect,
  ProspectInput,
  ProspectingSettings,
  ProspectingStep,
} from "./types";

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
  // 13/11/2026: a country is filed as its region; the site and the language of the mails.
  pays: "region",
  country: "region",
  site: "website",
  siteweb: "website",
  siteinternet: "website",
  website: "website",
  web: "website",
  url: "website",
  langue: "language",
  language: "language",
  telephone: "phone",
  tel: "phone",
  phone: "phone",
  // 15/11/2026: the software seen at the parking and what was seen.
  outil: "tool",
  outildetecte: "tool",
  tool: "tool",
  detailoutil: "toolDetail",
  detailsoutil: "toolDetail",
  tooldetail: "toolDetail",
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
  const delimiter = [";", ",", "\t"].reduce(
    (best, d) =>
      firstLine.split(d).length > firstLine.split(best).length ? d : best,
    ";",
  );
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
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

export interface CsvReading {
  rows: Partial<ProspectInput>[];
  /** Headers Plazo does not know (ignored). */
  ignored: string[];
  /** Required columns absent from the file (the email is optional since 13/11/2026). */
  missing: "companyName"[];
}

/** The prospects of a CSV file whose first line names the columns (parking, prénom, nom, e-mail, ville, aéroport…). */
export function readProspectsCsv(text: string): CsvReading {
  const [header = [], ...lines] = parseCsvCells(text);
  const columns = header.map((h) => HEADERS[headerKey(h)] ?? null);
  const ignored = header.filter((h, i) => !columns[i] && h.trim() !== "");
  const missing = (["companyName"] as const).filter(
    (c) => !columns.includes(c),
  );
  const rows = lines.map((cells) => {
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

export const VARIABLES = [
  "{prénom}",
  "{nom}",
  "{parking}",
  "{aéroport}",
  "{ville}",
  "{lien_demo}",
];

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

export const SAMPLE_DEMO_LINK = "https://pro.plazo.fr/pro/demo/AbCd2345EfGh";

export const valuesOf = (
  p: Pick<
    Prospect,
    | "contactFirstName"
    | "contactLastName"
    | "companyName"
    | "airportName"
    | "airportCode"
    | "town"
  > & { demo?: Prospect["demo"] },
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
    .map((line) => line.replace(/[ \t]{2,}/g, " ").replace(/ +,/g, ","))
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
  return [
    ...new Set(
      [...text.matchAll(/\{([^{}\s]{1,20})\}/g)]
        .filter((m) => !ALIASES[m[1].toLowerCase()])
        .map((m) => m[0]),
    ),
  ];
}

/** The sequence a prospect receives: its language's (13/11/2026), the French one when the settings predate them. */
export function sequenceFor(
  prospect: Pick<Prospect, "language"> | null,
  settings: ProspectingSettings | undefined,
): ProspectingStep[] {
  if (!settings) return [];
  return (
    (prospect && settings.sequences?.[prospect.language]) || settings.steps
  );
}

/** The step a prospect will receive next: its first contact while it has not been sent anything. */
export function stepFor(
  prospect: Pick<Prospect, "step" | "nextStep">,
  steps: ProspectingStep[],
): ProspectingStep {
  const wanted = prospect.nextStep ?? (prospect.step === 0 ? 1 : null);
  return steps.find((s) => s.step === wanted) ?? steps[0];
}

// ---- Classement par région (19/10/2026, « Groupés par région » + « De l'aéroport ») ---------------------------------------

/** The filter value (and block key) of the prospects without a region. */
export const NO_REGION = "none";
/** The API's « France » filter (22/11/2026): every French region at once. */
export const FRANCE = "france";

export interface RegionGroup {
  key: string;
  label: string;
  prospects: Prospect[];
}

/**
 * The prospects in blocks, one per region: regions in the given (alphabetical) order, « Sans région » last, each block in
 * the list's order. A region with no prospect under the filters has no block.
 */
export function groupByRegion(
  rows: Prospect[],
  regions: { key: string; label: string }[],
): RegionGroup[] {
  const byKey = new Map<string, Prospect[]>();
  for (const p of rows) {
    const key = p.region?.key ?? NO_REGION;
    const block = byKey.get(key);
    if (block) block.push(p);
    else byKey.set(key, [p]);
  }
  const known = new Set(regions.map((r) => r.key));
  // A region the page does not list yet (never expected): after the others, under its own label.
  const extra = rows.flatMap((p) =>
    p.region && !known.has(p.region.key)
      ? [{ key: p.region.key, label: p.region.label }]
      : [],
  );
  const seen = new Set<string>();
  const ordered = [...regions, ...extra]
    .filter((r) => byKey.has(r.key) && !seen.has(r.key) && seen.add(r.key))
    .map((r) => ({ key: r.key, label: r.label, prospects: byKey.get(r.key)! }));
  const none = byKey.get(NO_REGION);
  return none
    ? [
        ...ordered,
        {
          key: NO_REGION,
          label: fr.platform.prospecting.regionNone,
          prospects: none,
        },
      ]
    : ordered;
}

// ---- 16/11/2026 (« pouvoir faire des tris dans les prospects pour envoyer le mail », direction A) ----------------------

export type ProspectSortKey =
  | "parking"
  | "contact"
  | "airport"
  | "tool"
  | "state"
  | "next"
  | "demo";
export interface ProspectSort {
  key: ProspectSortKey;
  dir: "asc" | "desc";
}

export interface ProspectFilters {
  /** Parking, town, contact, email, site, airport, notes; accents and case ignored. */
  q: string;
  email: "" | "with" | "without";
  /** A language code, or "" for all. */
  language: string;
  /** "" all, "none" no tool seen, "unknown" nothing filled in, else one tool as shown. */
  tool: string;
  demo: "" | "opened" | "not_opened" | "none";
  /** "" all, "never" never emailed, "7d" / "30d" emailed in the last 7 / 30 days, "older" more than 30 days ago. */
  lastMail: "" | "never" | "7d" | "30d" | "older";
  /** 22/11/2026: "new" BODACC or annuaire, one of them, "csv" a file, "manual" typed by hand. */
  origin: "" | "new" | "bodacc" | "directory" | "csv" | "manual";
}

export const NO_FILTERS: ProspectFilters = {
  q: "",
  email: "",
  language: "",
  tool: "",
  demo: "",
  lastMail: "",
  origin: "",
};

/** 22/11/2026: a declared start of activity still to come (« Pas encore ouvert »). */
export const notOpenYet = (
  p: Pick<Prospect, "opensOn">,
  today: string = new Date().toISOString().slice(0, 10),
) => !!p.opensOn && p.opensOn > today;

export const hasFilters = (f: ProspectFilters) =>
  Object.values(f).some((v) => v !== "");

const fold = (s: string) =>
  s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();

/** The tool as shown in its pill (its leading emoji or mark taken off). */
export const toolOf = (p: Pick<Prospect, "tool">) =>
  (p.tool ?? "").replace(/^[^\p{L}\p{N}]+/u, "").trim();

const isNoTool = (tool: string) => fr.platform.prospecting.noTool(tool);

/** The tools of the list, for the « Outil » filter: each distinct tool with its count, the most frequent first. */
export function toolOptions(
  rows: Pick<Prospect, "tool">[],
): { value: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const p of rows) {
    const tool = toolOf(p);
    if (tool && !isNoTool(tool)) counts.set(tool, (counts.get(tool) ?? 0) + 1);
  }
  return [...counts]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value, "fr"));
}

const DAY = 86_400_000;

export function filterProspects(
  rows: Prospect[],
  f: ProspectFilters,
  now: number = Date.now(),
): Prospect[] {
  const words = fold(f.q).split(/\s+/).filter(Boolean);
  return rows.filter((p) => {
    if (words.length) {
      const hay = fold(
        [
          p.companyName,
          p.town,
          p.contactFirstName,
          p.contactLastName,
          p.email,
          p.website,
          p.airportCode,
          p.airportName,
          p.notes,
          p.region?.label,
        ]
          .filter(Boolean)
          .join(" "),
      );
      if (!words.every((w) => hay.includes(w))) return false;
    }
    if (f.email === "with" && !p.email) return false;
    if (f.email === "without" && p.email) return false;
    if (f.language && p.language !== f.language) return false;
    if (f.tool) {
      const tool = toolOf(p);
      if (
        f.tool === "none"
          ? !tool || !isNoTool(tool)
          : f.tool === "unknown"
            ? !!tool
            : tool !== f.tool
      )
        return false;
    }
    if (f.demo === "none" && p.demo) return false;
    if (f.demo === "opened" && !(p.demo && p.demo.opens > 0)) return false;
    if (f.demo === "not_opened" && !(p.demo && p.demo.opens === 0))
      return false;
    if (f.origin) {
      const origin = p.origin ?? null;
      const keep =
        f.origin === "new"
          ? !!origin
          : f.origin === "bodacc" || f.origin === "directory"
            ? origin === f.origin
            : !origin && p.source === f.origin;
      if (!keep) return false;
    }
    if (f.lastMail) {
      const last = p.lastContactedAt
        ? new Date(p.lastContactedAt).getTime()
        : null;
      if (f.lastMail === "never" && last !== null) return false;
      if (f.lastMail === "7d" && (last === null || now - last > 7 * DAY))
        return false;
      if (f.lastMail === "30d" && (last === null || now - last > 30 * DAY))
        return false;
      if (f.lastMail === "older" && (last === null || now - last <= 30 * DAY))
        return false;
    }
    return true;
  });
}

const STATE_ORDER: Record<Prospect["status"], number> = {
  to_contact: 0,
  contacted: 1,
  replied: 2,
  interested: 3,
  not_interested: 4,
  unsubscribed: 5,
};

/** The value a column sorts by; null always goes last, whatever the direction. */
function sortValue(p: Prospect, key: ProspectSortKey): string | number | null {
  switch (key) {
    case "parking":
      return fold(p.companyName);
    case "contact":
      return (
        fold(
          [p.contactLastName, p.contactFirstName].filter(Boolean).join(" "),
        ) || null
      );
    case "airport":
      return p.airportCode ? fold(p.airportCode) : null;
    case "tool":
      return toolOf(p) ? fold(toolOf(p)) : null;
    case "state":
      return STATE_ORDER[p.status] * 10 + p.step;
    case "next":
      return p.nextSendAt ? new Date(p.nextSendAt).getTime() : null;
    case "demo":
      return p.demo ? p.demo.opens : null;
  }
}

/** The list sorted by a column (stable: equal rows keep their order). */
export function sortProspects(
  rows: Prospect[],
  sort: ProspectSort | null,
): Prospect[] {
  if (!sort) return rows;
  const sign = sort.dir === "asc" ? 1 : -1;
  return rows
    .map((p, i) => ({ p, i, v: sortValue(p, sort.key) }))
    .sort((a, b) => {
      if (a.v === null || b.v === null)
        return a.v === b.v ? a.i - b.i : a.v === null ? 1 : -1;
      const c =
        typeof a.v === "number" && typeof b.v === "number"
          ? a.v - b.v
          : String(a.v).localeCompare(String(b.v), "fr");
      return c ? c * sign : a.i - b.i;
    })
    .map((x) => x.p);
}

/** « Les plus ouvertes » (25/11/2026): the prospects by number of openings of their demo, the most opened first. */
export const MOST_OPENED: ProspectSort = { key: "demo", dir: "desc" };

/**
 * A click on a column: sort by it, the other way, then back to the list's own order. Ascending first, except the
 * demo column, whose point is the most opened first.
 */
export function nextSort(
  current: ProspectSort | null,
  key: ProspectSortKey,
): ProspectSort | null {
  const first = key === "demo" ? "desc" : "asc";
  if (!current || current.key !== key) return { key, dir: first };
  if (current.dir !== first) return null;
  return { key, dir: first === "asc" ? "desc" : "asc" };
}

// ---- SMS (19/11/2026, « pouvoir envoyer un sms de prospection », choix C) --------------------------------------------

export const DEFAULT_PROSPECT_SMS =
  "Bonjour, c'est Joanny de Plazo. Plazo Pro range les réservations des comparateurs, la navette et les clés de {parking} dans une seule app. Démo : {lien_demo}";
export const PROSPECT_SMS_MAX_LENGTH = 480;
export const PROSPECT_SMS_MAX_SEGMENTS = 3;
const SMS_GAP_MS = 7 * DAY;

/** The countries Plazo texts (backend/src/domain/phone.ts, SMS_COUNTRY_CODES): Europe, French overseas, the Maghreb. */
const SMS_COUNTRY_CODES = [
  "30", "31", "32", "34", "351", "352", "353", "354", "356", "357", "358", "359", "36", "370", "371", "372", "376", "377",
  "378", "385", "386", "39", "40", "41", "420", "421", "423", "43", "44", "45", "46", "47", "48", "49", "262", "590", "594",
  "596", "508", "687", "681", "689", "212", "213", "216",
];

/** Whether a number can get an SMS: a French mobile, or a number of an allowed country written with its code. */
export function isTextablePhone(phone: string | null): boolean {
  if (!phone) return false;
  let digits = phone.replace(/\(0\)/g, "").replace(/[\s.()-]/g, "");
  if (digits.startsWith("00")) digits = `+${digits.slice(2)}`;
  // The 06 39 98 range is kept for fiction: never texted.
  if (/^0[67]\d{8}$/.test(digits)) return !digits.startsWith("063998");
  if (digits.startsWith("+33")) return /^[67]\d{8}$/.test(digits.slice(3).replace(/^0/, ""));
  if (/^\+[1-9]\d{7,14}$/.test(digits)) return SMS_COUNTRY_CODES.some((code) => digits.slice(1).startsWith(code));
  return false;
}

/** The prospects of a list that can get a prospecting SMS now (the API decides in the end). */
export function smsCandidates(rows: Prospect[], now = Date.now()): Prospect[] {
  return rows.filter(
    (p) =>
      p.status !== "unsubscribed" &&
      p.status !== "not_interested" &&
      isTextablePhone(p.phone) &&
      !(p.lastSmsAt && now - new Date(p.lastSmsAt).getTime() < SMS_GAP_MS),
  );
}

// ---- Appels (25/11/2026, « A · File d'appels ») ----------------------------------------------------------------------

export type CallGroup = "callback" | "interested" | "demo" | "contacted" | "new";
export const CALL_GROUPS: CallGroup[] = ["callback", "interested", "demo", "contacted", "new"];
/** Calls in a row nobody answered after which a prospect leaves the queue (the API's MAX_MISSED_CALLS). */
export const MAX_MISSED_CALLS = 3;

export interface CallQueueItem {
  group: CallGroup;
  prospect: Prospect;
}

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const endOfDay = (now: Date) => new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
const time = (iso: string | null | undefined) => (iso ? new Date(iso).getTime() : 0);

/** Whether a number is French (the queue's « France » filter): written the French way, or with +33. */
export function isFrenchPhone(phone: string | null): boolean {
  if (!phone) return false;
  const digits = phone.replace(/[\s.()-]/g, "");
  return /^0[1-9]\d{8}$/.test(digits) || /^(\+|00)33/.test(digits);
}

/**
 * Who to call, in order: the callbacks due today, the interested ones, those who opened their demo, those written to
 * without an answer, then the ones never contacted. Never a prospect without a number, opted out, not interested, with a
 * wrong number, already called today, or after three calls in a row nobody answered; a callback set for a later day waits.
 */
export function callQueue(prospects: Prospect[], now = new Date()): CallQueueItem[] {
  const items: CallQueueItem[] = [];
  for (const p of prospects) {
    if (!p.phone || p.status === "unsubscribed" || p.status === "not_interested") continue;
    const calls = p.calls;
    if (calls?.wrongNumber) continue;
    if (calls?.callbackAt) {
      if (new Date(calls.callbackAt) <= endOfDay(now)) items.push({ group: "callback", prospect: p });
      continue;
    }
    if (calls?.lastAt && sameDay(new Date(calls.lastAt), now)) continue;
    if ((calls?.missed ?? 0) >= MAX_MISSED_CALLS) continue;
    const group: CallGroup =
      p.status === "interested" || p.status === "replied"
        ? "interested"
        : (p.demo?.opens ?? 0) > 0
          ? "demo"
          : p.status === "contacted"
            ? "contacted"
            : "new";
    items.push({ group, prospect: p });
  }
  const order = (item: CallQueueItem): number => {
    const p = item.prospect;
    switch (item.group) {
      case "callback":
        return time(p.calls?.callbackAt);
      case "demo":
        return -time(p.demo?.lastOpenedAt);
      case "contacted":
        // The ones who got the most mails first, then the oldest last contact.
        return -p.step * 1e14 + time(p.lastContactedAt);
      case "new":
        return (p.origin ? 0 : 1e14) - time(p.createdAt) / 1e3;
      default:
        return -time(p.lastContactedAt);
    }
  };
  return items.sort(
    (a, b) =>
      CALL_GROUPS.indexOf(a.group) - CALL_GROUPS.indexOf(b.group) ||
      order(a) - order(b) ||
      a.prospect.companyName.localeCompare(b.prospect.companyName, "fr"),
  );
}

/** A number as the phone's dialler takes it. */
export const telHref = (phone: string) => `tel:${phone.replace(/\(0\)/g, "").replace(/[^+\d]/g, "")}`;

/** « Demain 10:00 » as a datetime-local value: the default of « Rappeler le… » (a Saturday or Sunday moves to Monday). */
export function defaultCallback(now = new Date()): string {
  const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 10, 0);
  while (at.getDay() === 0 || at.getDay() === 6) at.setDate(at.getDate() + 1);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}T${pad(at.getHours())}:${pad(at.getMinutes())}`;
}
