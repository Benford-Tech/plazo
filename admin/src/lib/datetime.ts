// The parking's timezone (Europe/Paris for the MVP): every date shown or typed is local to it.
export const PARKING_TZ = "Europe/Paris";

function parts(iso: string, timeZone = PARKING_TZ) {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(iso));
  const get = (type: string) => p.find(x => x.type === type)?.value ?? "";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
}

/** Local date (YYYY-MM-DD) and time (HH:mm) of a UTC instant. */
export const localParts = parts;

export function todayLocal(timeZone = PARKING_TZ): string {
  return parts(new Date().toISOString(), timeZone).date;
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function timeOf(iso: string, timeZone = PARKING_TZ): string {
  return parts(iso, timeZone).time;
}

/** "Mercredi 1 octobre" */
export function longDate(date: string): string {
  const s = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** "sam. 4" */
export function shortDay(date: string): string {
  return new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));
}

/** "sam. 4 oct., 06:30" */
export function dateTimeShort(iso: string, timeZone = PARKING_TZ): string {
  return new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone }).format(
    new Date(iso),
  );
}

/** Whole nights between two local dates. */
export function nightsBetween(arrivalDate: string, returnDate: string): number {
  return Math.max(1, Math.round((Date.parse(`${returnDate}T00:00:00Z`) - Date.parse(`${arrivalDate}T00:00:00Z`)) / 86400000));
}

/** "il y a 12 min", "il y a 3 h", "il y a 2 j": the age of an instant, for status lines. */
export function timeAgo(iso: string, now = Date.now()): string {
  const seconds = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "à l'instant";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  return `il y a ${Math.floor(hours / 24)} j`;
}
