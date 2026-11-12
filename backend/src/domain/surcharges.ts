/**
 * Supplements a parking charges on top of the stay (12/11/2026, « les conditions pénalisantes doivent être
 * paramétrables », choix A des maquettes https://claude.ai/artifact/4c2ADHZtb2uCSPsMhHjhQf): a late arrival at the
 * appointment, a drop-off or return at night, a breakdown service, and the parking's own. Each is switched on and set
 * once; Plazo writes the sentence the traveller reads ({conditions} of the day-before message, the confirmation, « Ma
 * réservation »). A only informs: nothing is added to a booking's price here.
 */

export type SurchargeKind = 'late' | 'night' | 'breakdown' | 'custom';

export interface Surcharge {
  /** « late », « night », « breakdown », or « custom-… » for the parking's own. */
  id: string;
  kind: SurchargeKind;
  enabled: boolean;
  amountCents: number;
  /** late: beyond how many minutes. */
  minutes: number | null;
  /** custom: its name. */
  label: string | null;
  /** « service sur rendez-vous », « batterie, etc. ». */
  note: string | null;
}

/** The night window, kept on the parking (the same hours as the night fees of « Mes tarifs », set once). */
export interface NightWindow {
  start: string;
  end: string;
}

export const MAX_CUSTOM_SURCHARGES = 6;
export const MAX_SURCHARGE_CENTS = 100_000;
export const MAX_NOTE = 80;
export const MAX_LABEL = 60;

const BUILT_IN: Surcharge[] = [
  { id: 'late', kind: 'late', enabled: false, amountCents: 1000, minutes: 30, label: null, note: null },
  { id: 'night', kind: 'night', enabled: false, amountCents: 1000, minutes: null, label: null, note: null },
  { id: 'breakdown', kind: 'breakdown', enabled: false, amountCents: 500, minutes: null, label: null, note: null },
];

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const oneLine = (value: unknown, max: number): string | null => {
  if (typeof value !== 'string') return null;
  const text = value.replace(/\s+/g, ' ').trim();
  return text ? text.slice(0, max) : null;
};
const cents = (value: unknown): number | null =>
  typeof value === 'number' && Number.isInteger(value) && value > 0 && value <= MAX_SURCHARGE_CENTS ? value : null;

/**
 * The parking's list as stored (JSON, null = never set): always the three built-in ones first, in their order, then the
 * parking's own. Anything unreadable falls back to the defaults.
 */
export function surchargesOf(raw: unknown): Surcharge[] {
  const stored = Array.isArray(raw) ? (raw as Record<string, unknown>[]) : [];
  const built = BUILT_IN.map(base => {
    const s = stored.find(x => x && x.kind === base.kind);
    if (!s) return { ...base };
    return {
      ...base,
      enabled: s.enabled === true,
      amountCents: cents(s.amountCents) ?? base.amountCents,
      minutes: base.kind === 'late' ? (typeof s.minutes === 'number' && s.minutes > 0 ? Math.round(s.minutes) : base.minutes) : null,
      note: base.kind === 'night' ? null : oneLine(s.note, MAX_NOTE),
    };
  });
  const own = stored
    .filter(s => s && s.kind === 'custom' && typeof s.id === 'string' && oneLine(s.label, MAX_LABEL) && cents(s.amountCents))
    .slice(0, MAX_CUSTOM_SURCHARGES)
    .map(s => ({
      id: s.id as string,
      kind: 'custom' as const,
      enabled: s.enabled !== false,
      amountCents: cents(s.amountCents) as number,
      minutes: null,
      label: oneLine(s.label, MAX_LABEL),
      note: oneLine(s.note, MAX_NOTE),
    }));
  return [...built, ...own];
}

export type SurchargeErrors = Record<string, string>;

/**
 * PUT body → the list to store and the night window, or field errors (« surcharges.late.amountCents »…). The night
 * window is required when the night supplement is on.
 */
export function validateSurcharges(
  input: unknown,
  night: unknown,
  newId: () => string,
): { surcharges: Surcharge[]; night: NightWindow | null; errors: SurchargeErrors } {
  const errors: SurchargeErrors = {};
  if (!Array.isArray(input)) return { surcharges: [], night: null, errors: { surcharges: 'invalid' } };
  const items = input as Record<string, unknown>[];
  const field = (s: Record<string, unknown>, i: number) => (typeof s.kind === 'string' && s.kind !== 'custom' ? s.kind : `custom.${i}`);

  const out: Surcharge[] = [];
  let customs = 0;
  items.forEach((s, i) => {
    if (!s || typeof s !== 'object') {
      errors[`surcharges.${i}`] = 'invalid';
      return;
    }
    const kind = s.kind;
    if (kind !== 'late' && kind !== 'night' && kind !== 'breakdown' && kind !== 'custom') {
      errors[`surcharges.${i}`] = 'invalid';
      return;
    }
    const key = `surcharges.${field(s, i)}`;
    const enabled = s.enabled === true;
    const amount = cents(s.amountCents);
    if (!amount) errors[`${key}.amountCents`] = s.amountCents === undefined || s.amountCents === null ? 'required' : 'invalid';
    let minutes: number | null = null;
    if (kind === 'late') {
      const m = s.minutes;
      if (typeof m === 'number' && Number.isInteger(m) && m >= 5 && m <= 240) minutes = m;
      else errors[`${key}.minutes`] = m === undefined || m === null ? 'required' : 'invalid';
    }
    const note = kind === 'night' ? null : oneLine(s.note, MAX_NOTE + 1);
    if (note && note.length > MAX_NOTE) errors[`${key}.note`] = 'too_long';
    let label: string | null = null;
    if (kind === 'custom') {
      customs += 1;
      label = oneLine(s.label, MAX_LABEL + 1);
      if (!label) errors[`${key}.label`] = 'required';
      else if (label.length > MAX_LABEL) errors[`${key}.label`] = 'too_long';
    }
    if (kind !== 'custom' && out.some(o => o.kind === kind)) errors[`${key}`] = 'duplicate';
    const id = kind === 'custom' ? (typeof s.id === 'string' && /^custom-[a-z0-9]{4,32}$/.test(s.id) ? s.id : `custom-${newId()}`) : kind;
    out.push({ id, kind, enabled: kind === 'custom' ? s.enabled !== false : enabled, amountCents: amount ?? 0, minutes, label, note });
  });
  if (customs > MAX_CUSTOM_SURCHARGES) errors.surcharges = 'too_many';

  let window: NightWindow | null = null;
  const nightOn = out.some(o => o.kind === 'night' && o.enabled);
  if (night !== undefined && night !== null) {
    const raw = night as Record<string, unknown>;
    const start = typeof raw.start === 'string' ? raw.start : '';
    const end = typeof raw.end === 'string' ? raw.end : '';
    if (!HHMM.test(start)) errors['night.start'] = start ? 'invalid' : 'required';
    if (!HHMM.test(end)) errors['night.end'] = end ? 'invalid' : 'required';
    if (HHMM.test(start) && HHMM.test(end) && start === end) errors['night.end'] = 'same_time';
    window = { start, end };
  } else if (nightOn) errors['night.start'] = 'required';

  // A switched-off supplement keeps its settings even when an amount is missing: only the ones that are on must be whole.
  for (const key of Object.keys(errors)) {
    const m = /^surcharges\.(late|night|breakdown)\.(amountCents|minutes)$/.exec(key);
    if (m && !out.find(o => o.kind === m[1])?.enabled) delete errors[key];
  }
  const surcharges = surchargesOf(out.map(o => ({ ...o, amountCents: o.amountCents || undefined })));
  return { surcharges, night: window, errors };
}

/** « 10 € », « 12,50 € ». */
export const eurosShort = (c: number) => (c % 100 === 0 ? `${c / 100} €` : `${(c / 100).toFixed(2).replace('.', ',')} €`);
/** « 22h », « 21h30 ». */
export const hourLabel = (hhmm: string) => (hhmm.endsWith(':00') ? `${Number(hhmm.slice(0, 2))}h` : `${Number(hhmm.slice(0, 2))}h${hhmm.slice(3)}`);

/** The sentence the traveller reads for one supplement, or null when it cannot be said (night without its hours). */
export function surchargeSentence(s: Surcharge, night: NightWindow | null): string | null {
  const note = s.note ? ` (${s.note})` : '';
  switch (s.kind) {
    case 'late':
      return `Retard de plus de ${s.minutes} minutes : supplément de ${eurosShort(s.amountCents)}${note}`;
    case 'night':
      return night
        ? `Prise en charge ou restitution entre ${hourLabel(night.start)} et ${hourLabel(night.end)} : supplément de ${eurosShort(s.amountCents)}`
        : null;
    case 'breakdown':
      return `Service de dépannage${note} : ${eurosShort(s.amountCents)}`;
    case 'custom':
      return s.label ? `${s.label}${note} : ${eurosShort(s.amountCents)}` : null;
  }
}

/** The supplements that are on, one line joined by « ; » (WhatsApp refuses a line break in a variable). */
export function surchargesLine(list: Surcharge[], night: NightWindow | null): string | null {
  const parts = list
    .filter(s => s.enabled)
    .map(s => surchargeSentence(s, night))
    .filter((p): p is string => !!p);
  return parts.length ? parts.join(' ; ') : null;
}

/**
 * {conditions} from a parking row: null when it never set its supplements (Plazo then says its night fees itself, as
 * before 12/11/2026), '' when none is on.
 */
export function surchargeConditions(parking: { surcharges: unknown; nightStart: string | null; nightEnd: string | null }): string | null {
  if (parking.surcharges === null || parking.surcharges === undefined) return null;
  const night = parking.nightStart && parking.nightEnd ? { start: parking.nightStart, end: parking.nightEnd } : null;
  return surchargesLine(surchargesOf(parking.surcharges), night) ?? '';
}
