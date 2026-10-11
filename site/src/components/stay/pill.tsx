/**
 * Look of the search "pills" (icon, small spaced capitals, bold value, chevron), shared by the native fields
 * rendered without JavaScript and the buttons that open the pickers.
 *
 * Boutique (11/10/2026): a white field with the warm hairline and 12 px corners, the icon alone in warm grey (no
 * more orange icon in a cream circle), the label in small capitals, the hour in JetBrains Mono. The field whose
 * picker is open is outlined in espresso (selection is never orange); the keyboard focus is the accent-dark ring
 * of the other fields of the site.
 */

/**
 * The pill's shape. Its border colour comes from exactly one of pillIdle, pillActive or pillInvalid (two
 * border colours on one element would be settled by the stylesheet's order, not by intent).
 */
export const pillBox = "relative flex h-14 min-w-0 items-center gap-2.5 rounded-field border bg-white px-3.5 text-left text-ink transition-colors";
/** Border of a pill at rest. */
export const pillIdle = "border-line hover:border-soft/50";
/** Outline of the pill whose picker is open. */
export const pillActive = "border-dark inset-ring inset-ring-dark";
/** Keyboard focus of a pill that is a button (the hydrated pickers). */
export const pillFocus = "focus-visible:border-accent-dark focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent-dark";
/** Keyboard focus of a pill that holds a native field (no JavaScript). */
export const pillFocusWithin =
  "has-focus-visible:border-accent-dark has-focus-visible:outline-2 has-focus-visible:outline-offset-0 has-focus-visible:outline-accent-dark";
export const pillInvalid = "border-danger";
export const pillLabel = "block text-[10.5px] leading-tight font-bold tracking-[.12em] text-soft uppercase";
export const pillValue = "block truncate text-[15px] leading-tight font-bold tabular-nums";
/** The value of a time pill: an hour, so JetBrains Mono. */
export const pillHour = "font-hour text-[15px] leading-tight";
const nativeBase =
  "absolute inset-0 h-full w-full min-w-0 appearance-none rounded-field border-0 bg-transparent pt-[17px] pr-2 pl-[44px] text-[15px] text-ink tabular-nums focus-visible:outline-none";
/** A native input or select filling the whole pill, its value where the pill's value goes. */
export const pillNative = `${nativeBase} font-bold`;
/** The native time input of a time pill (an hour: JetBrains Mono). */
export const pillNativeHour = `${nativeBase} font-hour`;
/** Label of a native pill, over the value. */
export const pillNativeLabel = `${pillLabel} pointer-events-none absolute top-[10px] left-[44px]`;

/** The pill's icon: alone, in warm grey, in a 20 px box (the native fields' text starts after it). */
export function IconChip({ children }: { children: React.ReactNode }) {
  return (
    <span aria-hidden="true" className="relative flex size-5 flex-none items-center justify-center text-soft">
      {children}
    </span>
  );
}

const svg = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

/** Decorative chevron at the end of a pill (a stroked icon, no more "▾" glyph). */
export function Caret() {
  return (
    <span aria-hidden="true" className="pointer-events-none ml-auto flex flex-none pl-1 text-mute">
      <ChevronIcon direction="down" size={14} />
    </span>
  );
}

export function ChevronIcon({ direction, size = 16 }: { direction: "down" | "left" | "right"; size?: number }) {
  const d = direction === "down" ? "m6 9 6 6 6-6" : direction === "left" ? "m15 6-6 6 6 6" : "m9 6 6 6-6 6";
  return (
    <svg {...svg} width={size} height={size} aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export function CloseIcon({ size = 18 }: { size?: number }) {
  return (
    <svg {...svg} width={size} height={size} aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function CalendarIcon() {
  return (
    <svg {...svg} aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </svg>
  );
}

export function ClockIcon() {
  return (
    <svg {...svg} aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function PlaneIcon() {
  return (
    <svg {...svg} aria-hidden="true" fill="currentColor" stroke="none">
      <path d="M21 15.5v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V8.5l-8 5v2l8-2.5V18l-2 1.5V21l3.5-1 3.5 1v-1.5L13 18v-5z" />
    </svg>
  );
}

export function MapIcon() {
  return (
    <svg {...svg} aria-hidden="true">
      <path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6z" />
      <path d="M9 4v14M15 6v14" />
    </svg>
  );
}

/** A stroked check mark (the reassurance list of the home), in place of the "✓" glyph. */
export function CheckIcon({ size = 14 }: { size?: number }) {
  return (
    <svg {...svg} width={size} height={size} strokeWidth={2.4} aria-hidden="true">
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}
