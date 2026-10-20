import type { ContractFileKind } from "./types";

/** « 214 Ko », « 1,2 Mo ». */
export function fileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
  return `${(bytes / (1024 * 1024)).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} Mo`;
}

const dateFormat = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Paris" });
const dateTimeFormat = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  timeZone: "Europe/Paris",
});

/** « 20 oct. 2026 » (Paris). */
export const contractDate = (iso: string) => dateFormat.format(new Date(iso));
/** « 20/10/2026 10:42:07 » (Paris). */
export const contractDateTime = (iso: string) => dateTimeFormat.format(new Date(iso)).replace(",", "");

/** Saves a PDF the API sends under its own name. */
export function savePdf(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** The file name the API gives, else one of ours. */
export const pdfName = (given: string | null, kind: ContractFileKind) =>
  given ?? (kind === "proof" ? "preuve-signature.pdf" : kind === "signed" ? "contrat-signe.pdf" : "contrat.pdf");
