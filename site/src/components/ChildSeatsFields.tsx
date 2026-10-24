"use client";

import { CHILD_SEAT_FIELDS, CHILD_SEAT_KINDS, type ChildSeatKind, MAX_CHILD_SEATS_PER_KIND } from "@/lib/child-seats";
import { fr } from "@/lib/fr";
import type { ChildSeats } from "@/lib/types";

/** A child car seat, stroked like the site's other small icons. */
export function ChildSeatIcon({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.2 4.6C7.2 3.7 7.9 3 8.8 3h4.4c1.5 0 2.8 1.1 3 2.6l1 6.4" />
      <path d="M6.3 13.5h9.6c1.8 0 3.2 1.3 3.4 3.1l.2 1.9H5.4c-.6 0-1.1-.6-1-1.2l1.3-8.1" />
      <path d="M6 18.5v2.5M18.5 18.5v2.5M10 8.5h3.5" />
    </svg>
  );
}

/** « − n + » for one age group: 44 px targets, the count read aloud when it changes. */
function Stepper({ kind, value, onChange, idPrefix, withField }: { kind: ChildSeatKind; value: number; onChange: (n: number) => void; idPrefix: string; withField: boolean }) {
  const t = fr.booking.childSeats.kinds[kind];
  const id = `${idPrefix}-${kind}`;
  const button = "flex size-11 flex-none items-center justify-center rounded-full border border-line bg-white text-ink hover:border-soft disabled:opacity-40 disabled:hover:border-line";
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <p id={`${id}-label`} className="text-[15px] font-bold leading-snug">
          {t.label}
        </p>
        <p className="text-[13px] leading-snug text-soft">{t.hint}</p>
      </div>
      <div className="flex flex-none items-center gap-1" role="group" aria-labelledby={`${id}-label`}>
        <button type="button" className={button} aria-label={t.fewer} disabled={value === 0} onClick={() => onChange(value - 1)}>
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M6 12h12" />
          </svg>
        </button>
        <span aria-hidden="true" className="w-7 text-center font-hour text-[17px] font-semibold tabular-nums">
          {value}
        </span>
        <span role="status" className="sr-only">
          {t.count(value)}
        </span>
        <button type="button" className={button} aria-label={t.more} disabled={value >= MAX_CHILD_SEATS_PER_KIND} onClick={() => onChange(value + 1)}>
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M12 6v12M6 12h12" />
          </svg>
        </button>
        {withField && <input type="hidden" name={CHILD_SEAT_FIELDS[kind]} value={value} />}
      </div>
    </div>
  );
}

/**
 * The three age groups of the child seats (direction B « par âge », 24/10/2026), each with its stepper. With
 * `withFields`, a hidden input per group carries the counts in a form (`childSeatsInfant`…).
 */
export function ChildSeatSteppers({ value, onChange, idPrefix, withFields = false }: { value: ChildSeats; onChange: (seats: ChildSeats) => void; idPrefix: string; withFields?: boolean }) {
  return (
    <div className="divide-y divide-line-soft">
      {CHILD_SEAT_KINDS.map(kind => (
        <Stepper key={kind} kind={kind} value={value[kind]} onChange={n => onChange({ ...value, [kind]: n })} idPrefix={idPrefix} withField={withFields} />
      ))}
    </div>
  );
}
