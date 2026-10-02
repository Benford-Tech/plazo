/**
 * Look of the search "pills" (icon chip, small uppercase label, bold value, caret), shared by the
 * native fields rendered without JavaScript and the buttons that open the pickers.
 */

export const pillBox =
  "relative flex h-14 min-w-0 items-center gap-2.5 rounded-[14px] border border-line bg-white px-3 text-left text-ink transition-shadow";
/** Outline of the pill whose picker is open, or that has the keyboard focus. */
export const pillActive = "border-accent shadow-[inset_0_0_0_1px_#a427c3,0_0_0_4px_rgba(164,39,195,.12)]";
export const pillFocus =
  "focus-visible:border-accent focus-visible:shadow-[inset_0_0_0_1px_#a427c3,0_0_0_4px_rgba(164,39,195,.12)] focus-visible:outline-none";
export const pillFocusWithin =
  "has-focus-visible:border-accent has-focus-visible:shadow-[inset_0_0_0_1px_#a427c3,0_0_0_4px_rgba(164,39,195,.12)]";
export const pillInvalid = "border-danger";
export const pillLabel = "block text-[11px] leading-tight font-semibold tracking-[.04em] text-soft uppercase";
export const pillValue = "block truncate text-base leading-tight font-bold tabular-nums";
/** A native input or select filling the whole pill, its value where the pill's value goes. */
export const pillNative =
  "absolute inset-0 h-full w-full min-w-0 appearance-none rounded-[14px] border-0 bg-transparent pt-[17px] pr-2 pl-[52px] text-base font-bold text-ink tabular-nums focus-visible:outline-none";
/** Label of a native pill, over the value. */
export const pillNativeLabel = `${pillLabel} pointer-events-none absolute top-[9px] left-[52px]`;

export function IconChip({ children }: { children: React.ReactNode }) {
  return (
    <span aria-hidden="true" className="relative flex size-[30px] flex-none items-center justify-center rounded-full bg-tint text-accent">
      {children}
    </span>
  );
}

export function Caret() {
  return (
    <span aria-hidden="true" className="ml-auto flex-none pl-1 text-sm text-soft">
      ▾
    </span>
  );
}

const svg = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

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
