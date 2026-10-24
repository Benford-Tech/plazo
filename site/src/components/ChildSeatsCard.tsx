"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChildSeatIcon, ChildSeatSteppers } from "./ChildSeatsFields";
import { FieldError } from "./FieldError";
import { BookingClientError, updateChildSeats } from "@/lib/booking-client";
import { childSeatsProblem, childSeatsSummary, hasChildSeats, NO_CHILD_SEATS } from "@/lib/child-seats";
import { fr } from "@/lib/fr";
import type { ChildSeats } from "@/lib/types";

/**
 * « Sièges auto » on Ma réservation (24/10/2026, direction B « par âge »): the seats asked for the shuttle, and
 * « Modifier » while the booking is « Attendu » (the same three steppers, saved by PUT …/child-seats).
 */
export function ChildSeatsCard({ reference, token, seats: initial, passengers, editable }: { reference: string; token: string; seats: ChildSeats | null | undefined; passengers: number; editable: boolean }) {
  const t = fr.manage.childSeats;
  const router = useRouter();
  const [seats, setSeats] = useState<ChildSeats>(initial ?? NO_CHILD_SEATS);
  const [draft, setDraft] = useState<ChildSeats>(seats);
  const [editing, setEditing] = useState(false);
  const [locked, setLocked] = useState(!editable);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const problem = editing ? childSeatsProblem(draft, passengers) : null;

  const open = () => {
    setDraft(seats);
    setError(null);
    setSaved(false);
    setEditing(true);
  };

  const save = async () => {
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const booking = await updateChildSeats(reference, token, draft);
      const next = booking.childSeats ?? draft;
      setSeats(next);
      setDraft(next);
      setEditing(false);
      setSaved(true);
      // The recap of the page (server-rendered) says the same.
      router.refresh();
    } catch (e) {
      const code = e instanceof BookingClientError ? e.code : "unknown";
      if (code === "child_seats_locked") {
        // No longer « Attendu »: the card says so under the seats kept.
        setLocked(true);
        setEditing(false);
      } else {
        setError(code);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="sieges" className="card flex flex-col gap-3 p-4 md:p-6" data-testid="child-seats-card">
      <div className="flex items-center justify-between gap-3">
        <h2 id="sieges" className="flex items-center gap-2 text-base font-extrabold">
          <ChildSeatIcon className="size-5 flex-none text-soft" />
          {t.title}
        </h2>
        {!locked && !editing && (
          <button type="button" onClick={open} className="link -my-2 inline-flex min-h-11 items-center text-[14px]">
            {t.edit}
          </button>
        )}
      </div>
      {editing ? (
        <div className="flex flex-col gap-3">
          <ChildSeatSteppers value={draft} onChange={setDraft} idPrefix="m-childSeats" />
          {(problem || error) && <FieldError id="m-childSeats-error" code={problem ?? error} />}
          <p className="text-[13px] leading-snug text-soft">{fr.booking.childSeats.hint}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={save} disabled={busy || !!problem} aria-busy={busy || undefined} className="btn-primary min-h-12 px-5 text-[15px]">
              {busy ? t.saving : t.save}
            </button>
            <button type="button" onClick={() => setEditing(false)} disabled={busy} className="btn-secondary min-h-12 px-5 text-[15px]">
              {t.cancel}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <p className={`text-[15px] leading-snug ${hasChildSeats(seats) ? "font-semibold" : "text-soft"}`}>{hasChildSeats(seats) ? childSeatsSummary(seats) : t.none}</p>
          {hasChildSeats(seats) && <p className="text-[13px] leading-snug text-soft">{t.inShuttle}</p>}
          {locked && hasChildSeats(seats) && <p className="text-[13px] leading-snug text-soft">{t.locked}</p>}
          <p role="status" className="text-[13.5px] font-bold text-ok empty:hidden">
            {saved ? t.saved : ""}
          </p>
        </div>
      )}
    </section>
  );
}
