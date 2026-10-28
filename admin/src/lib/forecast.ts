import { addDays } from "@/lib/datetime";
import type { ForecastDay } from "@/lib/types";

/** « Planning prévisionnel » (28/10/2026, direction A « Calendrier par mois »): periods and gauges, pure helpers. */

export type ForecastView = "semaine" | "mois" | "3mois";
export const FORECAST_VIEWS: ForecastView[] = ["semaine", "mois", "3mois"];

const monthStart = (date: string) => `${date.slice(0, 7)}-01`;

/** First day of the month `n` months after the one of `date`. */
export function addMonths(date: string, n: number): string {
  const d = new Date(`${monthStart(date)}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 10);
}

/** Monday of the week of `date` (weeks run Monday → Sunday). */
export function mondayOf(date: string): string {
  const weekday = (new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7;
  return addDays(date, -weekday);
}

const daysBetween = (from: string, to: string) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);

/** The dates read for a view around `anchor`: a week, a calendar month, or three calendar months (92 days at most). */
export function periodOf(view: ForecastView, anchor: string): { from: string; days: number } {
  if (view === "semaine") return { from: mondayOf(anchor), days: 7 };
  const from = monthStart(anchor);
  return { from, days: daysBetween(from, addMonths(from, view === "mois" ? 1 : 3)) };
}

/** The anchor of the previous (-1) or next (+1) period. */
export function shiftPeriod(view: ForecastView, anchor: string, step: -1 | 1): string {
  if (view === "semaine") return addDays(mondayOf(anchor), 7 * step);
  return addMonths(anchor, view === "mois" ? step : 3 * step);
}

/** The months of a period, each as weeks of seven cells (null before the 1st and after the last day). */
export function monthGrids(from: string, days: number): { month: string; weeks: (string | null)[][] }[] {
  const grids: { month: string; weeks: (string | null)[][] }[] = [];
  const last = addDays(from, days - 1);
  for (let month = monthStart(from); month <= last; month = addMonths(month, 1)) {
    const end = addDays(addMonths(month, 1), -1);
    const cells: (string | null)[] = Array((new Date(`${month}T12:00:00Z`).getUTCDay() + 6) % 7).fill(null);
    for (let d = month; d <= end; d = addDays(d, 1)) cells.push(d);
    while (cells.length % 7) cells.push(null);
    const weeks: (string | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    grids.push({ month, weeks });
  }
  return grids;
}

export type GaugeLevel = "low" | "mid" | "high" | "full";

/** Night load in percent of the real capacity (margin included), and its colour band. */
export function gaugeOf(day: Pick<ForecastDay, "parked" | "bookable">): { pct: number; level: GaugeLevel } {
  const pct = day.bookable > 0 ? Math.round((day.parked / day.bookable) * 100) : day.parked > 0 ? 100 : 0;
  const level: GaugeLevel = day.parked >= day.bookable && day.parked > 0 ? "full" : pct > 85 ? "high" : pct >= 70 ? "mid" : "low";
  return { pct, level };
}

/** "octobre 2026" */
export function monthLabel(month: string): string {
  return new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${month}T12:00:00Z`));
}

/** "27 oct. – 2 nov." for a week, "octobre 2026", "oct. – déc. 2026" for three months. */
export function periodLabel(view: ForecastView, from: string, days: number): string {
  const to = addDays(from, days - 1);
  const fmt = (date: string, options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("fr-FR", { ...options, timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));
  if (view === "semaine") return `${fmt(from, { day: "numeric", month: "short" })} – ${fmt(to, { day: "numeric", month: "short", year: "numeric" })}`;
  if (view === "mois") return monthLabel(from);
  return `${fmt(from, { month: "short" })} – ${fmt(to, { month: "short", year: "numeric" })}`;
}
